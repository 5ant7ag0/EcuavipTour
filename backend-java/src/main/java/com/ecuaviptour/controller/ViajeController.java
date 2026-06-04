package com.ecuaviptour.controller;

import com.ecuaviptour.model.*;
import com.ecuaviptour.service.interfaces.ViajeService;
import com.ecuaviptour.service.interfaces.CalificacionService;
import com.ecuaviptour.service.interfaces.SocketIOService;
import com.ecuaviptour.repository.*;
import com.ecuaviptour.exception.*;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@RestController
@Transactional
public class ViajeController {

    private final ViajeService viajeService;
    private final CalificacionService calificacionService;
    private final UsuarioRepository usuarioRepository;
    private final TicketQRRepository ticketQRRepository;
    private final CalificacionRepository calificacionRepository;
    private final ReservaAsientoRepository reservaAsientoRepository;
    private final ViajeRepository viajeRepository;
    private final VehiculoRepository vehiculoRepository;
    private final SocketIOService socketIOService;

    public ViajeController(ViajeService viajeService, 
                           CalificacionService calificacionService, 
                           UsuarioRepository usuarioRepository,
                           TicketQRRepository ticketQRRepository,
                           CalificacionRepository calificacionRepository,
                           ReservaAsientoRepository reservaAsientoRepository,
                           ViajeRepository viajeRepository,
                           VehiculoRepository vehiculoRepository,
                           SocketIOService socketIOService) {
        this.viajeService = viajeService;
        this.calificacionService = calificacionService;
        this.usuarioRepository = usuarioRepository;
        this.ticketQRRepository = ticketQRRepository;
        this.calificacionRepository = calificacionRepository;
        this.reservaAsientoRepository = reservaAsientoRepository;
        this.viajeRepository = viajeRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.socketIOService = socketIOService;
    }

    // Root-level /api/cotizar endpoint for backwards compatibility
    @PostMapping("/api/cotizar")
    public ResponseEntity<Map<String, Object>> cotizarRoot(@RequestBody Map<String, Object> payload) {
        return cotizarCommon(payload);
    }

    // viajes-level /api/viajes/cotizar endpoint
    @PostMapping("/api/viajes/cotizar")
    public ResponseEntity<Map<String, Object>> cotizarViaje(@RequestBody Map<String, Object> payload) {
        return cotizarCommon(payload);
    }

    private ResponseEntity<Map<String, Object>> cotizarCommon(Map<String, Object> payload) {
        BigDecimal distanciaKm = new BigDecimal(payload.get("distancia_km").toString());
        String tipoServicio = (String) payload.get("tipo_servicio");
        Integer numPasajeros = payload.get("num_pasajeros") != null ? Integer.parseInt(payload.get("num_pasajeros").toString()) : 1;
        
        Map<String, Object> quote = viajeService.cotizar(distanciaKm, tipoServicio, numPasajeros);
        return ResponseEntity.ok(quote);
    }

    @PostMapping("/api/viajes/reservar")
    public ResponseEntity<Map<String, Object>> reservar(@RequestBody Map<String, Object> payload) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario activeUser = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        Long clienteId = activeUser.getId();
        // If administrator wants to book on behalf of another client:
        if ("admin".equalsIgnoreCase(activeUser.getRol()) && payload.containsKey("cliente_id")) {
            clienteId = Long.parseLong(payload.get("cliente_id").toString());
        }

        Long choferId = payload.get("chofer_id") != null ? Long.parseLong(payload.get("chofer_id").toString()) : null;
        Integer numPasajeros = payload.get("num_pasajeros") != null ? Integer.parseInt(payload.get("num_pasajeros").toString()) : null;
        BigDecimal tarifa = payload.get("tarifa") != null ? new BigDecimal(payload.get("tarifa").toString()) : null;

        // Parse seats array if provided
        List<Integer> asientos = new ArrayList<>();
        if (payload.get("asientos") != null) {
            Object obj = payload.get("asientos");
            if (obj instanceof List) {
                asientos = ((List<?>) obj).stream()
                        .map(item -> Integer.parseInt(item.toString()))
                        .collect(Collectors.toList());
            }
        }

        Viaje viaje = Viaje.builder()
                .dirOrigen((String) payload.get("origen"))
                .latOrigen(payload.get("lat_origen") != null ? new BigDecimal(payload.get("lat_origen").toString()) : null)
                .lngOrigen(payload.get("lng_origen") != null ? new BigDecimal(payload.get("lng_origen").toString()) : null)
                .dirDestino((String) payload.get("destino"))
                .latDestino(payload.get("lat_destino") != null ? new BigDecimal(payload.get("lat_destino").toString()) : null)
                .lngDestino(payload.get("lng_destino") != null ? new BigDecimal(payload.get("lng_destino").toString()) : null)
                .referenciaAdicional((String) payload.get("referencia"))
                .tipoServicio((String) payload.get("tipo_servicio"))
                .duracionMinutos(payload.get("duracion_minutos") != null ? Integer.parseInt(payload.get("duracion_minutos").toString()) : 30)
                .distanciaKm(payload.get("distancia") != null ? new BigDecimal(payload.get("distancia").toString()) : BigDecimal.ZERO)
                .build();

        if (payload.get("fecha_viaje") != null) {
            String dateStr = (String) payload.get("fecha_viaje");
            try {
                viaje.setFechaViaje(LocalDateTime.parse(dateStr.replace(" ", "T")));
            } catch (Exception e) {
                viaje.setFechaViaje(LocalDateTime.now().plusDays(1));
            }
        }

        Viaje saved = viajeService.reservar(viaje, asientos, clienteId, choferId, numPasajeros, tarifa);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Viaje reservado con éxito");
        response.put("viaje_id", saved.getId());
        response.put("monto_total", saved.getMontoTotal());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/api/viajes/mis-viajes")
    public ResponseEntity<List<Map<String, Object>>> misViajes() {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        List<Viaje> trips = viajeService.getViajesCliente(user.getId());
        
        List<Map<String, Object>> list = trips.stream().map(v -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", v.getId());
            m.put("viaje_id", v.getId());
            m.put("origen", v.getDirOrigen());
            m.put("destino", v.getDirDestino());
            m.put("distancia_km", v.getDistanciaKm() != null ? v.getDistanciaKm().doubleValue() : 0.0);
            m.put("monto", v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0);
            m.put("estado_pago", v.getEstadoPago());
            m.put("estado_logistico", v.getEstadoLogistico());
            m.put("tipo_servicio", v.getTipoServicio());
            m.put("fecha", v.getFechaCreacion() != null ? v.getFechaCreacion().format(formatter) : "Sin fecha");
            m.put("fecha_limite_pago", v.getFechaLimitePago() != null ? v.getFechaLimitePago().toString() : null);
            m.put("comentario_rechazo", v.getComentarioRechazo());
            
            // Add QR Hash
            Optional<TicketQR> qr = ticketQRRepository.findByViajeId(v.getId());
            m.put("qr_hash", qr.isPresent() ? qr.get().getCodigoHash() : null);
            
            // Add Chofer details
            if (v.getChofer() != null) {
                Usuario ch = v.getChofer();
                m.put("nombre_chofer", ch.getNombre());
                m.put("chofer_id", ch.getId());
                m.put("chofer", Map.of(
                        "id", ch.getId(),
                        "nombre", ch.getNombre(),
                        "telefono", ch.getTelefono() != null ? ch.getTelefono() : "",
                        "foto_perfil_url", ch.getFotoPerfilUrl() != null ? ch.getFotoPerfilUrl() : ""
                ));
                m.put("foto_chofer_url", ch.getFotoPerfilUrl());
            } else {
                m.put("nombre_chofer", null);
                m.put("chofer", null);
                m.put("foto_chofer_url", null);
                m.put("chofer_id", null);
            }
            
            // Add Vehiculo details
            Vehiculo veh = v.getVehiculo();
            if (veh == null && v.getChofer() != null) {
                veh = vehiculoRepository.findByChoferId(v.getChofer().getId()).orElse(null);
            }
            
            if (veh != null) {
                m.put("vehiculo", Map.of(
                        "placa", veh.getPlaca() != null ? veh.getPlaca() : "",
                        "marca", veh.getMarca() != null ? veh.getMarca() : "",
                        "modelo", veh.getModelo() != null ? veh.getModelo() : "",
                        "tipo", veh.getTipoVehiculo() != null ? veh.getTipoVehiculo() : "",
                        "foto_auto_url", veh.getFotoAutoUrl() != null ? veh.getFotoAutoUrl() : ""
                ));
            } else {
                m.put("vehiculo", null);
            }
            
            // Add Calificacion
            List<Calificacion> cList = calificacionRepository.findByViajeId(v.getId());
            if (!cList.isEmpty()) {
                Calificacion cal = cList.get(0);
                Map<String, Object> calMap = new HashMap<>();
                calMap.put("estrellas", cal.getEstrellas());
                calMap.put("comentario", cal.getComentario() != null ? cal.getComentario() : "");
                m.put("calificacion", calMap);
            } else {
                m.put("calificacion", null);
            }
            
            // Add Seats
            m.put("asientos", viajeService.getAsientosOcupados(v.getId()));
            
            return m;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(list);
    }

    @GetMapping("/api/viajes/activo")
    public ResponseEntity<Map<String, Object>> getActivo() {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        Optional<Viaje> active = viajeService.getViajeActivo(user.getId());
        if (active.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyMap());
        }

        Viaje v = active.get();
        Map<String, Object> m = new HashMap<>();
        m.put("id", v.getId());
        m.put("viaje_id", v.getId());
        m.put("origen", v.getDirOrigen());
        m.put("destino", v.getDirDestino());
        m.put("distancia", v.getDistanciaKm() != null ? v.getDistanciaKm().doubleValue() : 0.0);
        m.put("tarifa", v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0);
        m.put("estado_pago", v.getEstadoPago());
        m.put("estado_logistico", v.getEstadoLogistico());
        m.put("tipo_servicio", v.getTipoServicio());
        m.put("fecha", v.getFechaCreacion() != null ? v.getFechaCreacion().toString() : "");
        m.put("comentario_rechazo", v.getComentarioRechazo());
        
        // Add Chofer details
        if (v.getChofer() != null) {
            Usuario ch = v.getChofer();
            m.put("chofer_id", ch.getId());
            m.put("chofer", Map.of(
                    "id", ch.getId(),
                    "nombre", ch.getNombre(),
                    "telefono", ch.getTelefono() != null ? ch.getTelefono() : "",
                    "foto_perfil_url", ch.getFotoPerfilUrl() != null ? ch.getFotoPerfilUrl() : ""
            ));
            m.put("foto_chofer_url", ch.getFotoPerfilUrl());
        } else {
            m.put("chofer", null);
            m.put("foto_chofer_url", null);
            m.put("chofer_id", null);
        }
        
        // Add Vehiculo details
        Vehiculo veh = v.getVehiculo();
        if (veh == null && v.getChofer() != null) {
            veh = vehiculoRepository.findByChoferId(v.getChofer().getId()).orElse(null);
        }
        
        if (veh != null) {
            m.put("vehiculo", Map.of(
                    "placa", veh.getPlaca() != null ? veh.getPlaca() : "",
                    "marca", veh.getMarca() != null ? veh.getMarca() : "",
                    "modelo", veh.getModelo() != null ? veh.getModelo() : "",
                    "anio", veh.getAnio() != null ? veh.getAnio() : 0,
                    "tipo", veh.getTipoVehiculo() != null ? veh.getTipoVehiculo() : "",
                    "foto_auto_url", veh.getFotoAutoUrl() != null ? veh.getFotoAutoUrl() : ""
            ));
        } else {
            m.put("vehiculo", null);
        }
        
        // Add Cliente Name
        m.put("cliente_id", v.getCliente() != null ? v.getCliente().getId() : null);
        m.put("nombre_cliente", v.getCliente() != null ? v.getCliente().getNombre() : "Cliente Desconocido");
        m.put("foto_cliente_url", (v.getCliente() != null && v.getCliente().getFotoPerfilUrl() != null) ? v.getCliente().getFotoPerfilUrl() : null);
        
        // Add QR Hash
        Optional<TicketQR> qr = ticketQRRepository.findByViajeId(v.getId());
        m.put("qr_hash", qr.isPresent() ? qr.get().getCodigoHash() : null);
        
        // Add Seats
        m.put("asientos", viajeService.getAsientosOcupados(v.getId()));
        
        return ResponseEntity.ok(m);
    }

    @GetMapping("/api/viajes/{viajeId}/asientos-ocupados")
    public ResponseEntity<List<Integer>> getAsientosOcupados(@PathVariable Long viajeId) {
        List<Integer> seats = viajeService.getAsientosOcupados(viajeId);
        return ResponseEntity.ok(seats);
    }

    @PostMapping("/api/viajes/calificar")
    public ResponseEntity<Map<String, Object>> calificar(@RequestBody Map<String, Object> payload) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        Long viajeId = Long.parseLong(payload.get("viaje_id").toString());
        Integer estrellas = Integer.parseInt(payload.get("estrellas").toString());
        String comentario = (String) payload.get("comentario");

        Calificacion c = calificacionService.calificar(viajeId, user.getId(), estrellas, comentario);
        return ResponseEntity.ok(Map.of(
                "message", "Viaje calificado correctamente",
                "calificacion_id", c.getId()
        ));
    }

    @PostMapping("/api/viajes/validar_abordaje")
    public ResponseEntity<Map<String, Object>> validarAbordaje(@RequestBody Map<String, Object> payload) {
        Long viajeId = Long.parseLong(payload.get("viaje_id").toString());
        String codigo = (String) payload.get("codigo");

        Viaje viaje = viajeRepository.findById(viajeId)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado con el ID: " + viajeId));

        if (codigo != null && codigo.length() == 4) {
            viaje.setEstadoLogistico("en_curso");
            viajeRepository.save(viaje);
            return ResponseEntity.ok(Map.of(
                    "mensaje", "Abordaje verificado correctamente",
                    "estado", "en_curso"
            ));
        } else {
            return ResponseEntity.badRequest().body(Map.of("error", "Código de abordaje inválido."));
        }
    }

    @PostMapping("/api/viajes/cancelar")
    public ResponseEntity<Map<String, Object>> cancelarBody(@RequestBody Map<String, Object> payload) {
        Long viajeId = Long.parseLong(payload.get("viaje_id").toString());
        return performCancellation(viajeId);
    }

    @PostMapping("/api/viajes/cancelar/{viajeId}")
    public ResponseEntity<Map<String, Object>> cancelarPath(@PathVariable Long viajeId) {
        return performCancellation(viajeId);
    }

    private ResponseEntity<Map<String, Object>> performCancellation(Long viajeId) {
        Viaje viaje = viajeRepository.findById(viajeId)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado con el ID: " + viajeId));

        viaje.setEstadoLogistico("cancelado");
        viaje.setEstadoPago("cancelado");

        Long clienteId = viaje.getCliente() != null ? viaje.getCliente().getId() : null;
        Long choferId = viaje.getChofer() != null ? viaje.getChofer().getId() : null;

        viaje.setChofer(null);
        viaje.setVehiculo(null);
        viajeRepository.save(viaje);

        // Also cancel associated seat reservations
        List<ReservaAsiento> reservations = reservaAsientoRepository.findByViajeId(viajeId);
        for (ReservaAsiento r : reservations) {
            r.setEstado("cancelado");
            reservaAsientoRepository.save(r);
        }

        // Broadcast real-time Socket.IO cancellation event
        socketIOService.broadcastViajeCancelado(viajeId, "El viaje ha sido cancelado por el cliente", clienteId, choferId);

        return ResponseEntity.ok(Map.of("mensaje", "Viaje cancelado correctamente"));
    }
}
