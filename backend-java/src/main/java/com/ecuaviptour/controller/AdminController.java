package com.ecuaviptour.controller;

import com.ecuaviptour.model.*;
import com.ecuaviptour.service.interfaces.AdminService;
import com.ecuaviptour.service.interfaces.PagoService;
import com.ecuaviptour.service.interfaces.SocketIOService;
import com.ecuaviptour.repository.*;
import com.ecuaviptour.dto.UsuarioDTO;
import com.ecuaviptour.mapper.UsuarioMapper;
import com.ecuaviptour.exception.ResourceNotFoundException;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;

@RestController
@RequestMapping("/api/admin")
@Transactional
public class AdminController {

    private final AdminService adminService;
    private final PagoService pagoService;
    private final ViajeRepository viajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final PagoRepository pagoRepository;
    private final MensajeRepository mensajeRepository;
    private final TicketQRRepository ticketQRRepository;
    private final ReservaAsientoRepository reservaAsientoRepository;
    private final SocketIOService socketIOService;
    private final UsuarioMapper usuarioMapper;

    public AdminController(AdminService adminService,
                           PagoService pagoService,
                           ViajeRepository viajeRepository,
                           UsuarioRepository usuarioRepository,
                           PagoRepository pagoRepository,
                           MensajeRepository mensajeRepository,
                           TicketQRRepository ticketQRRepository,
                           ReservaAsientoRepository reservaAsientoRepository,
                           SocketIOService socketIOService,
                           UsuarioMapper usuarioMapper) {
        this.adminService = adminService;
        this.pagoService = pagoService;
        this.viajeRepository = viajeRepository;
        this.usuarioRepository = usuarioRepository;
        this.pagoRepository = pagoRepository;
        this.mensajeRepository = mensajeRepository;
        this.ticketQRRepository = ticketQRRepository;
        this.reservaAsientoRepository = reservaAsientoRepository;
        this.socketIOService = socketIOService;
        this.usuarioMapper = usuarioMapper;
    }

    @GetMapping("/vehiculos")
    public ResponseEntity<List<Map<String, Object>>> getVehiculos(
            @RequestParam(value = "estado", required = false) String estado,
            @RequestParam(value = "search", required = false) String search) {
        
        List<Vehiculo> list = adminService.getVehiculosFiltrados(estado, search);
        List<Map<String, Object>> response = list.stream().map(v -> {
            Map<String, Object> m = new HashMap<>();
            m.put("id", v.getId());
            m.put("placa", v.getPlaca());
            m.put("marca", v.getMarca());
            m.put("modelo", v.getModelo());
            m.put("anio", v.getAnio());
            m.put("tipo_vehiculo", v.getTipoVehiculo());
            m.put("capacidad_max", v.getCapacidadMax());
            m.put("color", v.getColor());
            m.put("es_privado", v.getEsPrivado());
            m.put("estado", v.getEstado());
            m.put("foto_auto_url", v.getFotoAutoUrl());
            m.put("foto_matricula_url", v.getFotoMatriculaUrl());
            m.put("foto_licencia_url", v.getFotoLicenciaUrl());
            m.put("licencia_tipo", v.getLicenciaTipo());
            m.put("licencia_vigencia", v.getLicenciaVigencia());
            Map<String, Object> choferMap = new HashMap<>();
            if (v.getChofer() != null) {
                choferMap.put("id", v.getChofer().getId());
                choferMap.put("nombre", v.getChofer().getNombre());
                choferMap.put("telefono", v.getChofer().getTelefono() != null ? v.getChofer().getTelefono() : "");
                choferMap.put("correo", v.getChofer().getCorreo() != null ? v.getChofer().getCorreo() : "");
            } else {
                choferMap.put("id", 0L);
                choferMap.put("nombre", "Sin Chofer Asignado");
                choferMap.put("telefono", "");
                choferMap.put("correo", "");
            }
            m.put("chofer", choferMap);
            return m;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/vehiculos/estado")
    public ResponseEntity<Map<String, Object>> cambiarEstadoVehiculo(@RequestBody Map<String, Object> payload) {
        Long vehiculoId = Long.parseLong(payload.get("vehiculo_id").toString());
        String estado = (String) payload.get("estado");
        
        Vehiculo v = adminService.cambiarEstadoVehiculo(vehiculoId, estado);
        return ResponseEntity.ok(Map.of(
                "message", "Vehículo " + v.getEstado() + " correctamente"
        ));
    }

    @GetMapping("/usuarios")
    public ResponseEntity<List<Map<String, Object>>> getUsuarios(
            @RequestParam(value = "rol", required = false) String rol,
            @RequestParam(value = "search", required = false) String search,
            @RequestParam(value = "activo", required = false) Boolean activo,
            @RequestParam(value = "fecha_viaje", required = false) String fechaViajeStr,
            @RequestParam(value = "duracion_minutos", required = false) Integer duracionMinutos) {

        LocalDateTime fechaViaje = null;
        if (fechaViajeStr != null && !fechaViajeStr.isBlank()) {
            try {
                fechaViaje = LocalDateTime.parse(fechaViajeStr.replace(" ", "T"));
            } catch (Exception e) {
                fechaViaje = null;
            }
        }

        List<Map<String, Object>> list = adminService.getAllUsers(rol, search, activo, fechaViaje, duracionMinutos);
        return ResponseEntity.ok(list);
    }

    @PostMapping("/usuarios/toggle_status")
    public ResponseEntity<Map<String, Object>> toggleUsuarioStatus(@RequestBody Map<String, Object> payload) {
        Long usuarioId = Long.parseLong(payload.get("usuario_id").toString());
        Usuario u = adminService.toggleUserStatus(usuarioId);
        return ResponseEntity.ok(Map.of(
                "mensaje", "Usuario " + (u.getActivo() ? "activado" : "desactivado") + " correctamente",
                "activo", u.getActivo()
        ));
    }

    @PostMapping("/usuarios/update")
    public ResponseEntity<Map<String, Object>> updateUsuarioAdmin(@RequestBody Map<String, Object> payload) {
        Long usuarioId = Long.parseLong(payload.get("usuario_id").toString());
        
        Usuario data = Usuario.builder()
                .rol((String) payload.get("rol"))
                .activo(payload.get("activo") != null ? Boolean.parseBoolean(payload.get("activo").toString()) : null)
                .nombre((String) payload.get("nombre"))
                .correo((String) payload.get("correo"))
                .cedula((String) payload.get("cedula"))
                .telefono((String) payload.get("telefono"))
                .build();

        Usuario u = adminService.updateUserAdmin(usuarioId, data);
        return ResponseEntity.ok(Map.of(
                "mensaje", "Usuario actualizado correctamente",
                "usuario", Map.of(
                        "id", u.getId(),
                        "nombre", u.getNombre(),
                        "rol", u.getRol(),
                        "activo", u.getActivo()
                )
        ));
    }

    @GetMapping("/pagos")
    public ResponseEntity<List<Map<String, Object>>> getPagos(@RequestParam(value = "estado", defaultValue = "pendientes") String estadoFiltro) {
        String estadoDb = "comprobante_subido";
        if ("aprobados".equalsIgnoreCase(estadoFiltro)) {
            estadoDb = "aprobado";
        } else if ("rechazados".equalsIgnoreCase(estadoFiltro)) {
            estadoDb = "rechazado";
        }
        
        final String searchState = estadoDb;
        
        List<Pago> pagos = pagoRepository.findAll();
        List<Map<String, Object>> response = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        
        for (Pago p : pagos) {
            Viaje v = p.getViaje();
            if (v != null && (searchState.equalsIgnoreCase(v.getEstadoPago()) || 
                ("aprobado".equalsIgnoreCase(searchState) && "pagado".equalsIgnoreCase(v.getEstadoPago())))) {
                
                Usuario cliente = v.getCliente();
                Map<String, Object> map = new HashMap<>();
                map.put("pago_id", p.getId());
                map.put("viaje_id", v.getId());
                map.put("cliente_id", cliente != null ? cliente.getId() : null);
                map.put("cliente_nombre", cliente != null ? cliente.getNombre() : "Desconocido");
                map.put("cliente_correo", cliente != null ? cliente.getCorreo() : "N/A");
                map.put("monto", p.getMontoPagado() != null ? p.getMontoPagado().doubleValue() : 0.0);
                map.put("comprobante_url", p.getComprobanteUrl());
                map.put("origen", v.getDirOrigen());
                map.put("destino", v.getDirDestino());
                map.put("tipo_servicio", v.getTipoServicio());
                map.put("estado_pago", v.getEstadoPago());
                map.put("fecha", p.getFechaPago() != null ? p.getFechaPago().format(formatter) : "");
                
                response.add(map);
            }
        }
        
        // Sort descending by payment ID (newest first)
        response.sort((a, b) -> ((Long) b.get("pago_id")).compareTo((Long) a.get("pago_id")));
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/aprobar_pago")
    public ResponseEntity<Map<String, Object>> aprobarPago(@RequestBody Map<String, Object> payload) {
        Long pagoId = Long.parseLong(payload.get("pago_id").toString());
        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado con el ID: " + pagoId));
        
        Viaje v = pago.getViaje();
        v.setEstadoPago("aprobado");
        v.setEstadoLogistico("buscando_chofer");
        viajeRepository.save(v);
        
        // Generate TicketQR if not exists
        TicketQR ticket = ticketQRRepository.findByViajeId(v.getId()).orElse(null);
        if (ticket == null) {
            ticket = TicketQR.builder()
                    .viaje(v)
                    .codigoHash(UUID.randomUUID().toString())
                    .estado("generado")
                    .build();
            ticketQRRepository.save(ticket);
        }
        
        // Broadcast Socket.IO events to notify passenger and all drivers
        if (v.getCliente() != null) {
            socketIOService.broadcastPagoActualizado(v.getId(), v.getCliente().getId(), "aprobado", "buscando_chofer");
        }
        socketIOService.broadcastNuevoViajeDisponible(v);
        
        return ResponseEntity.ok(Map.of(
                "mensaje", "Pago aprobado, buscando chofer",
                "viaje_id", v.getId(),
                "pago_id", pago.getId()
        ));
    }

    @PostMapping("/rechazar_pago")
    public ResponseEntity<Map<String, Object>> rechazarPago(@RequestBody Map<String, Object> payload) {
        Long pagoId = Long.parseLong(payload.get("pago_id").toString());
        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado con el ID: " + pagoId));
        
        String motivo = (String) payload.get("motivo");
        Viaje v = pago.getViaje();
        v.setEstadoPago("rechazado");
        v.setEstadoLogistico("pendiente");
        v.setFechaLimitePago(LocalDateTime.now().plusMinutes(15)); // Give 15 minutes to upload a new proof
        v.setComentarioRechazo(motivo != null ? motivo.trim() : null);
        viajeRepository.save(v);
        
        // Broadcast Socket.IO event to notify passenger
        if (v.getCliente() != null) {
            socketIOService.broadcastPagoActualizado(v.getId(), v.getCliente().getId(), "rechazado", "pendiente");
        }
        
        return ResponseEntity.ok(Map.of(
                "mensaje", "Pago rechazado correctamente",
                "pago_id", pago.getId()
        ));
    }

    @GetMapping("/inbox")
    public ResponseEntity<List<Map<String, Object>>> getInbox() {
        List<MensajeChat> adminMessages = mensajeRepository.findAllAdminMessagesWithUsers();
        
        Map<Long, List<MensajeChat>> messagesByClient = new HashMap<>();

        
        for (MensajeChat m : adminMessages) {
            Usuario remitente = m.getRemitente();
            Usuario destinatario = m.getDestinatario();
            if (remitente == null) continue;
            
            Usuario client = !"admin".equalsIgnoreCase(remitente.getRol()) ? remitente : destinatario;
            if (client == null) continue;
            
            messagesByClient.computeIfAbsent(client.getId(), k -> new ArrayList<>()).add(m);
        }
        
        List<Map<String, Object>> inboxList = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        
        for (Map.Entry<Long, List<MensajeChat>> entry : messagesByClient.entrySet()) {
            Long clientId = entry.getKey();
            List<MensajeChat> msgs = entry.getValue();
            
            // Sort to get latest message
            msgs.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
            MensajeChat latestMsg = msgs.get(0);
            
            Usuario clientUser = usuarioRepository.findById(clientId).orElse(null);
            if (clientUser == null) continue;
            
            long unread = msgs.stream()
                    .filter(m -> m.getRemitente().getId().equals(clientId) && !m.getLeido())
                    .count();
                    
            // Get client's latest trip payment status
            List<Viaje> clientTrips = viajeRepository.findByClienteIdOrderByIdDesc(clientId);
            String estadoPago = clientTrips.isEmpty() ? "n/a" : clientTrips.get(0).getEstadoPago();
            
            Usuario soporte = null;
            String categoria = "General";
            String estado = "resuelto";
            
            // First pass: determine the state of the conversation
            for (MensajeChat m : msgs) {
                if (!"resuelto".equalsIgnoreCase(m.getEstado())) {
                    estado = "abierto";
                }
            }
            
            // Second pass: extract support and category
            for (MensajeChat m : msgs) {
                if ("abierto".equals(estado)) {
                    // If open, support and category must only come from active (non-resolved) messages
                    if (!"resuelto".equalsIgnoreCase(m.getEstado())) {
                        if (m.getSoporteAsignado() != null) {
                            soporte = m.getSoporteAsignado();
                        }
                        if (m.getCategoria() != null) {
                            categoria = m.getCategoria();
                        }
                    }
                } else {
                    // If resolved, support and category come from the latest message
                    if (m.getSoporteAsignado() != null) {
                        soporte = m.getSoporteAsignado();
                    }
                    if (m.getCategoria() != null) {
                        categoria = m.getCategoria();
                    }
                }
            }

            Map<String, Object> map = new HashMap<>();
            map.put("cliente_id", clientUser.getId());
            map.put("cliente_nombre", clientUser.getNombre());
            map.put("ultimo_mensaje", latestMsg.getContenido());
            map.put("fecha_ultimo_mensaje", latestMsg.getTimestamp().format(formatter));
            map.put("unread", unread);
            map.put("viaje_id", latestMsg.getViaje() != null ? latestMsg.getViaje().getId() : null);
            map.put("estado_pago", estadoPago);
            map.put("foto_perfil_url", clientUser.getFotoPerfilUrl() != null ? clientUser.getFotoPerfilUrl() : "");
            
            // Campos del soporte
            map.put("soporte_asignado_id", soporte != null ? soporte.getId() : null);
            map.put("soporte_asignado_nombre", soporte != null ? soporte.getNombre() : "Sin Asignar");
            map.put("soporte_asignado_avatar", soporte != null && soporte.getFotoPerfilUrl() != null ? soporte.getFotoPerfilUrl() : "");
            map.put("categoria", categoria);
            map.put("estado", estado);
            
            inboxList.add(map);
        }
        
        // Sort inbox by latest message timestamp descending
        inboxList.sort((a, b) -> ((String) b.get("fecha_ultimo_mensaje")).compareTo((String) a.get("fecha_ultimo_mensaje")));
        
        return ResponseEntity.ok(inboxList);
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @RequestParam(value = "period", defaultValue = "month") String period,
            @RequestParam(value = "start_date", required = false) String startDateStr,
            @RequestParam(value = "end_date", required = false) String endDateStr) {
        
        List<Viaje> allTrips = viajeRepository.findAll();
        
        LocalDateTime startLimit = null;
        LocalDateTime endLimit = null;

        if ("today".equalsIgnoreCase(period)) {
            startLimit = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
            endLimit = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        } else if ("week".equalsIgnoreCase(period)) {
            startLimit = LocalDateTime.now().minus(6, ChronoUnit.DAYS).withHour(0).withMinute(0).withSecond(0).withNano(0);
            endLimit = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        } else if ("month".equalsIgnoreCase(period)) {
            startLimit = LocalDateTime.now().minus(29, ChronoUnit.DAYS).withHour(0).withMinute(0).withSecond(0).withNano(0);
            endLimit = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        } else if ("year".equalsIgnoreCase(period)) {
            startLimit = LocalDateTime.now().withDayOfYear(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            endLimit = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        } else if ("custom".equalsIgnoreCase(period)) {
            if (startDateStr != null && !startDateStr.isBlank()) {
                try {
                    startLimit = java.time.LocalDate.parse(startDateStr).atStartOfDay();
                } catch (Exception e) {
                    try {
                        startLimit = LocalDateTime.parse(startDateStr.replace(" ", "T"));
                    } catch (Exception ex) {
                        startLimit = null;
                    }
                }
            }
            if (endDateStr != null && !endDateStr.isBlank()) {
                try {
                    endLimit = java.time.LocalDate.parse(endDateStr).atTime(23, 59, 59, 999999999);
                } catch (Exception e) {
                    try {
                        endLimit = LocalDateTime.parse(endDateStr.replace(" ", "T"));
                    } catch (Exception ex) {
                        endLimit = null;
                    }
                }
            }
        }

        final LocalDateTime finalStart = startLimit;
        final LocalDateTime finalEnd = endLimit;
        
        List<Viaje> filteredTrips = allTrips;
        if (finalStart != null || finalEnd != null) {
            filteredTrips = allTrips.stream()
                    .filter(v -> v.getFechaCreacion() != null)
                    .filter(v -> finalStart == null || v.getFechaCreacion().isAfter(finalStart) || v.getFechaCreacion().isEqual(finalStart))
                    .filter(v -> finalEnd == null || v.getFechaCreacion().isBefore(finalEnd) || v.getFechaCreacion().isEqual(finalEnd))
                    .collect(Collectors.toList());
        }

        // 1. Total revenue (viajes con pago aprobado/pagado) en el periodo filtrado
        double totalRevenue = filteredTrips.stream()
                .filter(v -> "aprobado".equalsIgnoreCase(v.getEstadoPago()) || "pagado".equalsIgnoreCase(v.getEstadoPago()))
                .mapToDouble(v -> v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0)
                .sum();
                
        // 2. Active trips
        long activeTrips = filteredTrips.stream()
                .filter(v -> Arrays.asList("en_curso", "recogiendo", "aceptado").contains(v.getEstadoLogistico().toLowerCase()))
                .count();
                
        // 3. Pending payments
        long pendingPayments = filteredTrips.stream()
                .filter(v -> "pendiente".equalsIgnoreCase(v.getEstadoPago()) || "comprobante_subido".equalsIgnoreCase(v.getEstadoPago()))
                .count();
                
        // 4. Online drivers
        long onlineDrivers = usuarioRepository.findAll().stream()
                .filter(u -> "chofer".equalsIgnoreCase(u.getRol()) && u.getActivo() == true)
                .count();
                
        Map<String, Object> kpis = new HashMap<>();
        kpis.put("ingresos_totales", totalRevenue);
        kpis.put("viajes_activos", activeTrips);
        kpis.put("pagos_pendientes", pendingPayments);
        kpis.put("choferes_online", onlineDrivers);
        
        // 5. Chart 1: Revenue in the selected period
        long daysBetween = 30;
        LocalDateTime startForChart = LocalDateTime.now().minus(29, ChronoUnit.DAYS);
        
        if ("today".equalsIgnoreCase(period)) {
            daysBetween = 1;
            startForChart = LocalDateTime.now();
        } else if ("week".equalsIgnoreCase(period)) {
            daysBetween = 7;
            startForChart = LocalDateTime.now().minus(6, ChronoUnit.DAYS);
        } else if ("month".equalsIgnoreCase(period)) {
            daysBetween = 30;
            startForChart = LocalDateTime.now().minus(29, ChronoUnit.DAYS);
        } else if ("year".equalsIgnoreCase(period)) {
            startForChart = LocalDateTime.now().withDayOfYear(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startForChart.toLocalDate(), java.time.LocalDate.now()) + 1;
            if (daysBetween <= 0) daysBetween = 1;
        } else if ("custom".equalsIgnoreCase(period) && startLimit != null && endLimit != null) {
            daysBetween = java.time.temporal.ChronoUnit.DAYS.between(startLimit.toLocalDate(), endLimit.toLocalDate()) + 1;
            if (daysBetween <= 0) daysBetween = 1;
            if (daysBetween > 90) daysBetween = 90; // Límite para evitar sobrecargas
            startForChart = startLimit;
        }

        Map<String, Double> revenueByDate = new TreeMap<>();
        DateTimeFormatter dateFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        for (int i = 0; i < daysBetween; i++) {
            revenueByDate.put(startForChart.plus(i, ChronoUnit.DAYS).format(dateFormatter), 0.0);
        }
        
        filteredTrips.stream()
                .filter(v -> "aprobado".equalsIgnoreCase(v.getEstadoPago()) || "pagado".equalsIgnoreCase(v.getEstadoPago()))
                .forEach(v -> {
                    String dateStr = v.getFechaCreacion().format(dateFormatter);
                    if (revenueByDate.containsKey(dateStr)) {
                        revenueByDate.put(dateStr, revenueByDate.get(dateStr) + 
                                (v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0));
                    }
                });
                
        Map<String, Object> revenueChart = new HashMap<>();
        revenueChart.put("labels", new ArrayList<>(revenueByDate.keySet()));
        revenueChart.put("data", new ArrayList<>(revenueByDate.values()));
        
        // 6. Chart 2: Trip Distribution
        Map<String, Long> distributionMap = filteredTrips.stream()
                .filter(v -> v.getEstadoLogistico() != null)
                .collect(Collectors.groupingBy(Viaje::getEstadoLogistico, Collectors.counting()));
                
        Map<String, Object> distributionChart = new HashMap<>();
        distributionChart.put("labels", new ArrayList<>(distributionMap.keySet()));
        distributionChart.put("data", new ArrayList<>(distributionMap.values()));
        
        // 7. Chart 3: Top Routes
        Map<String, Long> routesMap = filteredTrips.stream()
                .filter(v -> v.getDirOrigen() != null && v.getDirDestino() != null)
                .collect(Collectors.groupingBy(v -> v.getDirOrigen() + " -> " + v.getDirDestino(), Collectors.counting()));
                
        List<Map<String, Object>> routesList = routesMap.entrySet().stream()
                .map(e -> {
                    Map<String, Object> rm = new HashMap<>();
                    rm.put("ruta", e.getKey());
                    rm.put("cantidad", e.getValue());
                    return rm;
                })
                .sorted((a, b) -> ((Long) b.get("cantidad")).compareTo((Long) a.get("cantidad")))
                .limit(5)
                .collect(Collectors.toList());
                
        // 8. Chart 4: Service Type Stats
        Map<String, Long> servicesMap = filteredTrips.stream()
                .filter(v -> v.getTipoServicio() != null)
                .collect(Collectors.groupingBy(Viaje::getTipoServicio, Collectors.counting()));
                
        Map<String, Object> servicesChart = new HashMap<>();
        servicesChart.put("labels", new ArrayList<>(servicesMap.keySet()));
        servicesChart.put("data", new ArrayList<>(servicesMap.values()));
        
        // 9. Movements: Last 10 trips
        List<Viaje> recentTrips = filteredTrips.stream()
                .sorted((a, b) -> b.getFechaCreacion().compareTo(a.getFechaCreacion()))
                .limit(10)
                .collect(Collectors.toList());
                
        List<Map<String, Object>> movements = recentTrips.stream().map(v -> {
            Usuario cl = v.getCliente();
            Map<String, Object> m = new HashMap<>();
            m.put("id", v.getId());
            m.put("cliente", cl != null ? cl.getNombre() : "Sistema");
            m.put("monto", v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0);
            m.put("estado", v.getEstadoLogistico());
            m.put("fecha", v.getFechaCreacion() != null ? v.getFechaCreacion().toString() : "");
            return m;
        }).collect(Collectors.toList());
        
        Map<String, Object> response = new HashMap<>();
        response.put("kpis", kpis);
        
        Map<String, Object> charts = new HashMap<>();
        charts.put("revenue", revenueChart);
        charts.put("distribution", distributionChart);
        charts.put("routes", routesList);
        charts.put("services", servicesChart);
        response.put("charts", charts);
        
        response.put("movements", movements);
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/usuarios/update_photo")
    public ResponseEntity<Map<String, Object>> updateUsuarioPhoto(
            @RequestParam("usuario_id") Long usuarioId,
            @RequestParam("foto") MultipartFile file) throws IOException {
        
        Usuario user = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + usuarioId));

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No se envió ningún archivo"));
        }

        String userDir = System.getProperty("user.dir");
        String uploadDir = Paths.get(userDir, "uploads", "avatars").toString();
        File folder = new File(uploadDir);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        String filename = "user_" + user.getId() + "_avatar_" + UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir, filename);
        Files.write(filePath, file.getBytes());

        String avatarUrl = "uploads/avatars/" + filename;
        user.setFotoPerfilUrl(avatarUrl);
        Usuario updated = usuarioRepository.save(user);

        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Foto de perfil actualizada correctamente");
        response.put("foto_perfil_url", updated.getFotoPerfilUrl());
        
        response.put("usuario", usuarioMapper.toDTO(updated));

        return ResponseEntity.ok(response);
    }
}
