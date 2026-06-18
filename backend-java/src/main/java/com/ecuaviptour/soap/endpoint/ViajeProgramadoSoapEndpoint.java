package com.ecuaviptour.soap.endpoint;

import com.ecuaviptour.modules.users.domain.Usuario;
import com.ecuaviptour.modules.users.repository.UsuarioRepository;
import com.ecuaviptour.modules.vehiculos.domain.Vehiculo;
import com.ecuaviptour.modules.viajes.domain.Reserva;
import com.ecuaviptour.modules.viajes.domain.ViajeProgramado;
import com.ecuaviptour.modules.viajes.service.ReservaService;
import com.ecuaviptour.modules.viajes.service.ViajeProgramadoService;
import com.ecuaviptour.shared.service.SocketIOService;
import com.ecuaviptour.soap.viajes.*;
import com.ecuaviptour.exception.BadRequestException;
import com.ecuaviptour.exception.UnauthorizedException;
import com.ecuaviptour.modules.viajes.repository.ReservaRepository;
import com.ecuaviptour.modules.users.repository.CalificacionRepository;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;
import java.util.Objects;

/**
 * Endpoint del servicio web SOAP dedicado para la gestión y reserva de frecuencias programadas (viajes compartidos).
 * Evita la saturación del endpoint general y centraliza el flujo de reservas y check-in por PIN en tiempo real.
 * 
 * @author Antigravity
 * @version 1.1
 */
@Endpoint
@Transactional
public class ViajeProgramadoSoapEndpoint {

    private static final String NAMESPACE_URI = "http://ecuaviptour.com/soap/viajes";

    private final ViajeProgramadoService viajeProgramadoService;
    private final ReservaService reservaService;
    private final UsuarioRepository usuarioRepository;
    private final SocketIOService socketIOService;
    private final ReservaRepository reservaRepository;
    private final CalificacionRepository calificacionRepository;

    public ViajeProgramadoSoapEndpoint(ViajeProgramadoService viajeProgramadoService,
                                      ReservaService reservaService,
                                      UsuarioRepository usuarioRepository,
                                      SocketIOService socketIOService,
                                      ReservaRepository reservaRepository,
                                      CalificacionRepository calificacionRepository) {
        this.viajeProgramadoService = viajeProgramadoService;
        this.reservaService = reservaService;
        this.usuarioRepository = usuarioRepository;
        this.socketIOService = socketIOService;
        this.reservaRepository = reservaRepository;
        this.calificacionRepository = calificacionRepository;
    }

    /**
     * Crea una nueva frecuencia de viaje programada (solo para administradores).
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "createViajeProgramadoRequest")
    @ResponsePayload
    public CreateViajeProgramadoResponse createViajeProgramado(@RequestPayload CreateViajeProgramadoRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario activeUser = usuarioRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        if (!"admin".equalsIgnoreCase(activeUser.getRol())) {
            throw new UnauthorizedException("Acceso denegado. Solo administradores pueden crear frecuencias.");
        }

        LocalDateTime fechaHoraSalida;
        try {
            String fechaStr = request.getFechaHoraSalida().trim().replace(" ", "T");
            if (fechaStr.length() == 16) {
                fechaHoraSalida = LocalDateTime.parse(fechaStr);
            } else if (fechaStr.length() > 16) {
                fechaHoraSalida = LocalDateTime.parse(fechaStr.substring(0, 16));
            } else {
                fechaHoraSalida = LocalDateTime.parse(fechaStr);
            }
        } catch (Exception e) {
            throw new BadRequestException("Formato de fecha de salida inválido. Se espera yyyy-MM-dd HH:mm");
        }

        ViajeProgramado vp = ViajeProgramado.builder()
                .dirOrigen(request.getDirOrigen())
                .dirDestino(request.getDirDestino())
                .fechaHoraSalida(fechaHoraSalida)
                .precioAsiento(request.getPrecioAsiento())
                .capacidadTotal(request.getCapacidadTotal() != null ? request.getCapacidadTotal() : 15)
                .estado("PROGRAMADO")
                .build();

        ViajeProgramado saved = viajeProgramadoService.crearFrecuencia(vp, request.getChoferId(), request.getVehiculoId());

        CreateViajeProgramadoResponse response = new CreateViajeProgramadoResponse();
        response.setViajeProgramado(mapViajeProgramadoToSoap(saved));
        response.setMensaje("Frecuencia de viaje creada con éxito");
        return response;
    }

    /**
     * Actualiza una frecuencia de viaje programada (Admin).
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "updateViajeProgramadoRequest")
    @ResponsePayload
    public UpdateViajeProgramadoResponse updateViajeProgramado(@RequestPayload UpdateViajeProgramadoRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario activeUser = usuarioRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        if (!"admin".equalsIgnoreCase(activeUser.getRol())) {
            throw new UnauthorizedException("Acceso denegado. Solo administradores pueden editar frecuencias.");
        }

        LocalDateTime fechaHoraSalida = null;
        if (request.getFechaHoraSalida() != null && !request.getFechaHoraSalida().trim().isEmpty()) {
            try {
                String fechaStr = request.getFechaHoraSalida().trim().replace(" ", "T");
                if (fechaStr.length() == 16) {
                    fechaHoraSalida = LocalDateTime.parse(fechaStr);
                } else if (fechaStr.length() > 16) {
                    fechaHoraSalida = LocalDateTime.parse(fechaStr.substring(0, 16));
                } else {
                    fechaHoraSalida = LocalDateTime.parse(fechaStr);
                }
            } catch (Exception e) {
                throw new BadRequestException("Formato de fecha de salida inválido. Se espera yyyy-MM-dd HH:mm");
            }
        }

        ViajeProgramado vp = ViajeProgramado.builder()
                .dirOrigen(request.getDirOrigen())
                .dirDestino(request.getDirDestino())
                .fechaHoraSalida(fechaHoraSalida)
                .precioAsiento(request.getPrecioAsiento())
                .capacidadTotal(request.getCapacidadTotal() != null ? request.getCapacidadTotal() : null)
                .build();

        ViajeProgramado updated = viajeProgramadoService.actualizarFrecuencia(
                request.getId(),
                vp,
                request.getChoferId(),
                request.getVehiculoId()
        );

        UpdateViajeProgramadoResponse response = new UpdateViajeProgramadoResponse();
        response.setViajeProgramado(mapViajeProgramadoToSoap(updated));
        response.setMensaje("Frecuencia de viaje actualizada con éxito");
        return response;
    }

    /**
     * Elimina una frecuencia de viaje programada (solo para administradores).
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "deleteViajeProgramadoRequest")
    @ResponsePayload
    public DeleteViajeProgramadoResponse deleteViajeProgramado(@RequestPayload DeleteViajeProgramadoRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario activeUser = usuarioRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        if (!"admin".equalsIgnoreCase(activeUser.getRol())) {
            throw new UnauthorizedException("Acceso denegado. Solo administradores pueden eliminar frecuencias.");
        }

        viajeProgramadoService.eliminarFrecuencia(request.getId());

        DeleteViajeProgramadoResponse response = new DeleteViajeProgramadoResponse();
        response.setMensaje("Frecuencia de viaje eliminada con éxito");
        return response;
    }

    /**
     * Cancela y reembolsa una reserva individual (Admin).
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "cancelarReservaRequest")
    @ResponsePayload
    public CancelarReservaResponse cancelarReserva(@RequestPayload CancelarReservaRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario activeUser = usuarioRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        if (!"admin".equalsIgnoreCase(activeUser.getRol())) {
            throw new UnauthorizedException("Acceso denegado. Solo administradores pueden gestionar reservas.");
        }

        reservaService.cancelarReservaAdmin(request.getReservaId());

        CancelarReservaResponse response = new CancelarReservaResponse();
        response.setMensaje("Reserva cancelada y reembolsada con éxito");
        response.setExito(true);
        return response;
    }

    /**
     * Reprograma una reserva individual a otra frecuencia (Admin).
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "reprogramarReservaRequest")
    @ResponsePayload
    public ReprogramarReservaResponse reprogramarReserva(@RequestPayload ReprogramarReservaRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario activeUser = usuarioRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        if (!"admin".equalsIgnoreCase(activeUser.getRol())) {
            throw new UnauthorizedException("Acceso denegado. Solo administradores pueden reprogramar reservas.");
        }

        reservaService.reprogramarReserva(request.getReservaId(), request.getNuevoViajeProgramadoId());

        ReprogramarReservaResponse response = new ReprogramarReservaResponse();
        response.setMensaje("Reserva reprogramada con éxito");
        response.setExito(true);
        return response;
    }

    /**
     * Obtiene el listado de frecuencias disponibles para reservas (estados PROGRAMADO y EN_RUTA).
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getViajesProgramadosRequest")
    @ResponsePayload
    public GetViajesProgramadosResponse getViajesProgramados(@RequestPayload GetViajesProgramadosRequest request) {
        List<ViajeProgramado> list = viajeProgramadoService.getFrecuenciasDisponibles();
        GetViajesProgramadosResponse response = new GetViajesProgramadosResponse();
        for (ViajeProgramado vp : list) {
            response.getViajesProgramados().add(mapViajeProgramadoToSoap(vp));
        }
        return response;
    }

    /**
     * Reserva un asiento individual para el usuario autenticado en una frecuencia específica.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "reservarViajeCompartidoRequest")
    @ResponsePayload
    public ReservarViajeCompartidoResponse reservarViajeCompartido(@RequestPayload ReservarViajeCompartidoRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario activeUser = usuarioRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado."));

        Reserva r = reservaService.crearReserva(
                request.getViajeProgramadoId(),
                activeUser.getId(),
                request.getNumeroAsiento(),
                request.getPuntoAbordaje()
        );

        ReservarViajeCompartidoResponse response = new ReservarViajeCompartidoResponse();
        response.setReserva(mapReservaToSoap(r));
        response.setMensaje("Asiento reservado correctamente. Tienes 15 minutos para realizar el pago.");
        return response;
    }

    /**
     * Obtiene el historial de reservas de pasajes individuales asociadas al usuario autenticado.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getMisReservasRequest")
    @ResponsePayload
    public GetMisReservasResponse getMisReservas(@RequestPayload GetMisReservasRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Long userId;
        try {
            userId = Long.parseLong(userIdStr);
        } catch (NumberFormatException e) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario activeUser = usuarioRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("Usuario no encontrado."));

        List<Reserva> list = reservaService.getReservasUsuario(activeUser.getId());
        GetMisReservasResponse response = new GetMisReservasResponse();
        for (Reserva r : list) {
            response.getReservas().add(mapReservaToSoap(r));
        }
        return response;
    }

    /**
     * Valida el PIN de abordaje de una reserva (Check-in para choferes).
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "validarPinAbordajeRequest")
    @ResponsePayload
    public ValidarPinAbordajeResponse validarPinAbordaje(@RequestPayload ValidarPinAbordajeRequest request) {
        boolean exito = reservaService.validarAbordaje(request.getReservaId(), request.getPin());

        ValidarPinAbordajeResponse response = new ValidarPinAbordajeResponse();
        response.setExito(exito);
        if (exito) {
            response.setMensaje("Abordaje validado con éxito. PIN correcto.");
            reservaRepository.findById(request.getReservaId()).ifPresent(r -> {
                Long choferId = (r.getViajeProgramado() != null && r.getViajeProgramado().getChofer() != null)
                        ? r.getViajeProgramado().getChofer().getId() : null;
                
                Long viajeProgramadoId = r.getViajeProgramado().getId();
                Long usuarioId = r.getUsuario().getId();
                
                List<Reserva> siblings = reservaRepository.findByViajeProgramadoId(viajeProgramadoId).stream()
                        .filter(sib -> sib.getUsuario() != null && Objects.equals(sib.getUsuario().getId(), usuarioId))
                        .collect(java.util.stream.Collectors.toList());

                String estadoLogistico = r.getViajeProgramado().getEstado().toLowerCase();
                
                // Broadcast for the main reservation ID
                socketIOService.broadcastPagoActualizado(r.getId(), r.getUsuario().getId(), "abordo", estadoLogistico, choferId);
                socketIOService.broadcastViajeActualizado(r.getId(), r.getUsuario().getId(), estadoLogistico);

                // Broadcast for each sibling reservation ID
                for (Reserva sib : siblings) {
                    if (!sib.getId().equals(r.getId())) {
                        socketIOService.broadcastPagoActualizado(sib.getId(), sib.getUsuario().getId(), "abordo", estadoLogistico, choferId);
                        socketIOService.broadcastViajeActualizado(sib.getId(), sib.getUsuario().getId(), estadoLogistico);
                    }
                }

                // Also notify about the frequency status for general components (driver manifest, mis-viajes list refresh)
                socketIOService.broadcastPagoActualizado(viajeProgramadoId, r.getUsuario().getId(), "abordo", estadoLogistico, choferId);
            });
        } else {
            response.setMensaje("PIN de abordaje incorrecto.");
        }
        return response;
    }

    /**
     * Actualiza el estado logístico de una frecuencia programada (Iniciar/Finalizar viaje).
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "updateEstadoFrecuenciaRequest")
    @ResponsePayload
    public UpdateEstadoFrecuenciaResponse updateEstadoFrecuencia(@RequestPayload UpdateEstadoFrecuenciaRequest request) {
        ViajeProgramado vp = viajeProgramadoService.actualizarEstado(request.getViajeProgramadoId(), request.getEstado());
        
        // Notify all checked-in / approved passengers in real-time
        List<Reserva> list = reservaService.getReservasFrecuencia(vp.getId());
        Long choferId = vp.getChofer() != null ? vp.getChofer().getId() : null;
        for (Reserva r : list) {
            String estadoPago = r.getEstadoPago() != null ? r.getEstadoPago().toLowerCase() : "pendiente";
            String estadoLogistico = vp.getEstado().toLowerCase(); // programado, en_ruta, finalizado
            
            socketIOService.broadcastPagoActualizado(r.getId(), r.getUsuario().getId(), estadoPago, estadoLogistico, choferId);
            socketIOService.broadcastViajeActualizado(r.getId(), r.getUsuario().getId(), estadoLogistico);
            if ("finalizado".equalsIgnoreCase(estadoLogistico)) {
                socketIOService.broadcastViajeFinalizado(r.getId(), r.getUsuario().getId());
            }
        }

        UpdateEstadoFrecuenciaResponse response = new UpdateEstadoFrecuenciaResponse();
        response.setExito(true);
        response.setMensaje("Estado de frecuencia actualizado con éxito a: " + vp.getEstado());
        response.setEstado(vp.getEstado());
        return response;
    }

    /**
     * Registra el comprobante de pago para una reserva individual (Frecuencia).
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "subirComprobanteReservaRequest")
    @ResponsePayload
    public SubirComprobanteReservaResponse subirComprobanteReserva(@RequestPayload SubirComprobanteReservaRequest request) throws IOException {
        String base64Data = request.getFileBase64();
        if (base64Data == null || base64Data.isEmpty()) {
            throw new BadRequestException("No se envió ningún archivo comprobante.");
        }

        if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }
        byte[] decoded = Base64.getDecoder().decode(base64Data);

        String userDir = System.getProperty("user.dir");
        String uploadDir = Paths.get(userDir, "uploads", "comprobantes").toString();
        File folder = new File(uploadDir);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        String filename = "reserva_" + request.getReservaId() + "_comprobante_" + UUID.randomUUID().toString() + "_" + request.getFilename();
        Files.write(Paths.get(uploadDir, filename), decoded);

        String dbUrl = "uploads/comprobantes/" + filename;
        Reserva saved = reservaService.subirComprobante(request.getReservaId(), dbUrl);

        // Emit real-time notification to admin console
        socketIOService.broadcastNuevoComprobante(saved.getId() + 100000000L, saved.getUsuario().getId());

        SubirComprobanteReservaResponse response = new SubirComprobanteReservaResponse();
        response.setMessage("Comprobante subido exitosamente para la reserva.");
        response.setComprobanteUrl(saved.getComprobanteUrl());
        return response;
    }

    /**
     * Obtiene el listado de números de asientos ocupados para una frecuencia de viaje específica.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getAsientosOcupadosFrecuenciaRequest")
    @ResponsePayload
    public GetAsientosOcupadosFrecuenciaResponse getAsientosOcupadosFrecuencia(@RequestPayload GetAsientosOcupadosFrecuenciaRequest request) {
        List<Reserva> reservas = reservaService.getReservasFrecuencia(request.getViajeProgramadoId());

        List<Integer> occupiedSeats = reservas.stream()
                .filter(r -> !"CANCELADO".equalsIgnoreCase(r.getEstadoPago()))
                .map(Reserva::getNumeroAsiento)
                .toList();

        GetAsientosOcupadosFrecuenciaResponse response = new GetAsientosOcupadosFrecuenciaResponse();
        response.getAsientos().addAll(occupiedSeats);
        return response;
    }

    /**
     * Obtiene el listado completo de reservas (manifiesto de pasajeros) para una frecuencia de viaje específica.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getReservasFrecuenciaRequest")
    @ResponsePayload
    public GetReservasFrecuenciaResponse getReservasFrecuencia(@RequestPayload GetReservasFrecuenciaRequest request) {
        List<Reserva> list = reservaService.getReservasFrecuencia(request.getViajeProgramadoId());
        GetReservasFrecuenciaResponse response = new GetReservasFrecuenciaResponse();
        for (Reserva r : list) {
            if ("CONFIRMADO".equalsIgnoreCase(r.getEstadoPago()) || "ABORDO".equalsIgnoreCase(r.getEstadoPago())) {
                response.getReservas().add(mapReservaToSoap(r));
            }
        }
        return response;
    }

    // ==========================================
    // Mapeadores de Entidades a Clases SOAP (JAXB)
    // ==========================================

    private ViajeProgramadoSoapType mapViajeProgramadoToSoap(ViajeProgramado vp) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        ViajeProgramadoSoapType soap = new ViajeProgramadoSoapType();
        soap.setId(vp.getId());
        soap.setDirOrigen(vp.getDirOrigen());
        soap.setDirDestino(vp.getDirDestino());
        soap.setFechaHoraSalida(vp.getFechaHoraSalida() != null ? vp.getFechaHoraSalida().format(formatter) : "");
        soap.setPrecioAsiento(vp.getPrecioAsiento());
        soap.setCapacidadTotal(vp.getCapacidadTotal());
        soap.setAsientosDisponibles(getAsientosDisponibles(vp));
        soap.setEstado(vp.getEstado());

        if (vp.getChofer() != null) {
            soap.setChofer(mapUsuarioToSoap(vp.getChofer()));
        }
        if (vp.getVehiculo() != null) {
            soap.setVehiculo(mapVehiculoToSoap(vp.getVehiculo()));
        }
        return soap;
    }

    private ReservaSoapType mapReservaToSoap(Reserva r) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        ReservaSoapType soap = new ReservaSoapType();
        soap.setId(r.getId());
        soap.setViajeProgramadoId(r.getViajeProgramado().getId());
        soap.setDirOrigen(r.getViajeProgramado().getDirOrigen());
        soap.setDirDestino(r.getViajeProgramado().getDirDestino());
        soap.setFechaHoraSalida(r.getViajeProgramado().getFechaHoraSalida() != null ? r.getViajeProgramado().getFechaHoraSalida().format(formatter) : "");
        soap.setUsuarioId(r.getUsuario().getId());
        soap.setNombreUsuario(r.getUsuario().getNombre());
        soap.setNumeroAsiento(r.getNumeroAsiento());
        soap.setPuntoAbordaje(r.getPuntoAbordaje());
        soap.setEstadoPago(r.getEstadoPago());
        soap.setPinAbordaje(r.getPinAbordaje());
        soap.setFechaReserva(r.getFechaReserva() != null ? r.getFechaReserva().format(formatter) : "");
        if (r.getFechaLimitePago() != null) {
            soap.setFechaLimitePago(r.getFechaLimitePago().format(formatter));
        }
        soap.setComprobanteUrl(r.getComprobanteUrl());
        soap.setFotoUsuarioUrl(r.getUsuario().getFotoPerfilUrl());
        soap.setPrecioAsiento(r.getViajeProgramado().getPrecioAsiento() != null ? r.getViajeProgramado().getPrecioAsiento().doubleValue() : 0.0);

        if (r.getViajeProgramado().getChofer() != null) {
            soap.setChofer(mapUsuarioToSoap(r.getViajeProgramado().getChofer()));
        }
        if (r.getViajeProgramado().getVehiculo() != null) {
            soap.setVehiculo(mapVehiculoToSoap(r.getViajeProgramado().getVehiculo()));
        }
        soap.setEstadoLogistico(r.getViajeProgramado().getEstado());

        calificacionRepository.findByReservaIdAndClienteId(r.getId(), r.getUsuario().getId()).ifPresent(calif -> {
            CalificacionSoapType cSoap = new CalificacionSoapType();
            cSoap.setEstrellas(calif.getEstrellas());
            cSoap.setComentario(calif.getComentario());
            soap.setCalificacion(cSoap);
        });

        return soap;
    }

    private UsuarioSoapType mapUsuarioToSoap(Usuario u) {
        UsuarioSoapType soap = new UsuarioSoapType();
        soap.setId(u.getId());
        soap.setNombre(u.getNombre());
        soap.setCorreo(u.getCorreo());
        soap.setTelefono(u.getTelefono());
        soap.setCedula(u.getCedula());
        soap.setFotoPerfilUrl(u.getFotoPerfilUrl());
        soap.setRol(u.getRol());
        soap.setActivo(u.getActivo() != null ? u.getActivo() : true);
        if (u.getFechaRegistro() != null) {
            soap.setFechaRegistro(u.getFechaRegistro().toString());
        }
        return soap;
    }

    private VehiculoSoapType mapVehiculoToSoap(Vehiculo veh) {
        VehiculoSoapType vSoap = new VehiculoSoapType();
        vSoap.setId(veh.getId());
        vSoap.setPlaca(veh.getPlaca());
        vSoap.setMarca(veh.getMarca());
        vSoap.setModelo(veh.getModelo());
        vSoap.setAnio(veh.getAnio() != null ? veh.getAnio() : 0);
        vSoap.setTipo(veh.getTipoVehiculo());
        vSoap.setFotoAutoUrl(veh.getFotoAutoUrl());
        vSoap.setCapacidadMax(veh.getCapacidadMax() != null ? veh.getCapacidadMax() : 15);
        vSoap.setColor(veh.getColor());
        vSoap.setEstado(veh.getEstado());
        return vSoap;
    }

    private int getAsientosDisponibles(ViajeProgramado vp) {
        List<Reserva> reservas = reservaService.getReservasFrecuencia(vp.getId());
        long activeCount = reservas.stream()
                .filter(r -> !"CANCELADO".equalsIgnoreCase(r.getEstadoPago()))
                .count();
        return (int) (vp.getCapacidadTotal() - activeCount);
    }
}
