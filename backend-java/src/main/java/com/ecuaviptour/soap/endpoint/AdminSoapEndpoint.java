package com.ecuaviptour.soap.endpoint;

import com.ecuaviptour.model.*;
import com.ecuaviptour.repository.*;
import com.ecuaviptour.service.interfaces.AdminService;
import com.ecuaviptour.service.interfaces.PagoService;
import com.ecuaviptour.service.interfaces.SocketIOService;
import com.ecuaviptour.soap.admin.*;
import com.ecuaviptour.exception.ResourceNotFoundException;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Endpoint del servicio web SOAP destinado a las tareas de administración de EcuavipTour.
 * Gestiona operaciones de auditoría, listados de usuarios, flujos de validación financiera de pagos,
 * asignaciones de soporte técnico, aprobación de vehículos y cálculo de indicadores de rendimiento (KPIs).
 *
 * @author Santiago T.
 * @version 1.0
 */
@Endpoint
@Transactional
public class AdminSoapEndpoint {

    private static final String NAMESPACE_URI = "http://ecuaviptour.com/soap/admin";

    private final AdminService adminService;
    private final PagoService pagoService;
    private final ViajeRepository viajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final PagoRepository pagoRepository;
    private final MensajeRepository mensajeRepository;
    private final TicketQRRepository ticketQRRepository;
    private final ReservaAsientoRepository reservaAsientoRepository;
    private final SocketIOService socketIOService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Constructor para la inyección de dependencias de servicios y repositorios de administración.
     *
     * @param adminService             Servicio de administración de flota y cuentas.
     * @param pagoService              Servicio de gestión financiera.
     * @param viajeRepository          Repositorio de viajes.
     * @param usuarioRepository        Repositorio de usuarios.
     * @param pagoRepository           Repositorio de pagos.
     * @param mensajeRepository        Repositorio de mensajes de chat de soporte.
     * @param ticketQRRepository       Repositorio de tickets de abordaje QR.
     * @param reservaAsientoRepository Repositorio de reservas de asientos.
     * @param socketIOService          Servicio para notificaciones en tiempo real por sockets.
     */
    public AdminSoapEndpoint(AdminService adminService,
                             PagoService pagoService,
                             ViajeRepository viajeRepository,
                             UsuarioRepository usuarioRepository,
                             PagoRepository pagoRepository,
                             MensajeRepository mensajeRepository,
                             TicketQRRepository ticketQRRepository,
                             ReservaAsientoRepository reservaAsientoRepository,
                             SocketIOService socketIOService) {
        this.adminService = adminService;
        this.pagoService = pagoService;
        this.viajeRepository = viajeRepository;
        this.usuarioRepository = usuarioRepository;
        this.pagoRepository = pagoRepository;
        this.mensajeRepository = mensajeRepository;
        this.ticketQRRepository = ticketQRRepository;
        this.reservaAsientoRepository = reservaAsientoRepository;
        this.socketIOService = socketIOService;
    }

    /**
     * Obtiene el listado de vehículos registrados en el sistema aplicando filtros opcionales de estado y búsqueda.
     * Mapeado al request XML {@link GetVehiculosRequest}.
     *
     * @param request Payload XML que contiene los criterios de filtro (estado, término de búsqueda).
     * @return {@link GetVehiculosResponse} que envuelve la lista de vehículos compatibles.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getVehiculosRequest")
    @ResponsePayload
    public GetVehiculosResponse getVehiculos(@RequestPayload GetVehiculosRequest request) {
        List<Vehiculo> list = adminService.getVehiculosFiltrados(request.getEstado(), request.getSearch());
        GetVehiculosResponse response = new GetVehiculosResponse();

        for (Vehiculo v : list) {
            VehiculoSoapType soap = new VehiculoSoapType();
            soap.setId(v.getId());
            soap.setPlaca(v.getPlaca());
            soap.setMarca(v.getMarca());
            soap.setModelo(v.getModelo());
            soap.setAnio(v.getAnio() != null ? v.getAnio() : 0);
            soap.setTipo(v.getTipoVehiculo());
            soap.setCapacidadMax(v.getCapacidadMax() != null ? v.getCapacidadMax() : 15);
            soap.setColor(v.getColor());
            soap.setEstado(v.getEstado());
            soap.setFotoAutoUrl(v.getFotoAutoUrl());
            soap.setFotoMatriculaUrl(v.getFotoMatriculaUrl());
            soap.setFotoLicenciaUrl(v.getFotoLicenciaUrl());

            if (v.getChofer() != null) {
                soap.setChoferId(v.getChofer().getId());
                soap.setChoferNombre(v.getChofer().getNombre());
            } else {
                soap.setChoferId(0L);
                soap.setChoferNombre("Sin Chofer Asignado");
            }
            response.getVehiculos().add(soap);
        }
        return response;
    }

    /**
     * Cambia el estado de aprobación de un vehículo e inicia la promoción de rol del propietario a chofer.
     * Mapeado al request XML {@link CambiarEstadoVehiculoRequest}.
     *
     * @param request Payload XML con el identificador del vehículo y su nuevo estado.
     * @return {@link CambiarEstadoVehiculoResponse} que indica el resultado de la operación.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "cambiarEstadoVehiculoRequest")
    @ResponsePayload
    public CambiarEstadoVehiculoResponse cambiarEstadoVehiculo(@RequestPayload CambiarEstadoVehiculoRequest request) {
        Vehiculo v = adminService.cambiarEstadoVehiculo(request.getVehiculoId(), request.getEstado());
        CambiarEstadoVehiculoResponse response = new CambiarEstadoVehiculoResponse();
        response.setSuccess(true);
        response.setMessage("Vehículo " + v.getEstado() + " correctamente");
        return response;
    }

    /**
     * Obtiene el listado de usuarios del sistema con filtros de búsqueda parcial, rol, estado y disponibilidad.
     * Mapeado al request XML {@link GetUsuariosRequest}.
     *
     * @param request Payload XML con filtros (rol, búsqueda, activo, fecha del viaje propuesta).
     * @return {@link GetUsuariosResponse} que envuelve la lista de usuarios coincidentes.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getUsuariosRequest")
    @ResponsePayload
    public GetUsuariosResponse getUsuarios(@RequestPayload GetUsuariosRequest request) {
        LocalDateTime fechaViaje = null;
        if (request.getFechaViaje() != null && !request.getFechaViaje().isBlank()) {
            try {
                fechaViaje = LocalDateTime.parse(request.getFechaViaje().replace(" ", "T"));
            } catch (Exception e) {
                fechaViaje = null;
            }
        }

        Boolean activo = null;
        if (request.getActivo() != null && !request.getActivo().isBlank()) {
            activo = Boolean.parseBoolean(request.getActivo());
        }

        List<Map<String, Object>> users = adminService.getAllUsers(request.getRol(), request.getSearch(), activo, fechaViaje, request.getDuracionMinutos());
        GetUsuariosResponse response = new GetUsuariosResponse();

        for (Map<String, Object> uMap : users) {
            UsuarioSoapType soap = new UsuarioSoapType();
            soap.setId(Long.parseLong(uMap.get("id").toString()));
            soap.setNombre((String) uMap.get("nombre"));
            soap.setCorreo((String) uMap.get("correo"));
            soap.setTelefono((String) uMap.get("telefono"));
            soap.setCedula((String) uMap.get("cedula"));
            soap.setRol((String) uMap.get("rol"));
            soap.setActivo(Boolean.parseBoolean(uMap.get("activo").toString()));
            soap.setFechaRegistro(uMap.get("fecha_registro") != null ? uMap.get("fecha_registro").toString() : "");
            soap.setFotoPerfilUrl((String) uMap.get("foto_perfil_url"));
            response.getUsuarios().add(soap);
        }
        return response;
    }

    /**
     * Habilita o deshabilita la cuenta de un usuario.
     * Mapeado al request XML {@link ToggleUsuarioStatusRequest}.
     *
     * @param request Payload XML con el identificador del usuario.
     * @return {@link ToggleUsuarioStatusResponse} con el nuevo estado de activación del usuario.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "toggleUsuarioStatusRequest")
    @ResponsePayload
    public ToggleUsuarioStatusResponse toggleUsuarioStatus(@RequestPayload ToggleUsuarioStatusRequest request) {
        Usuario u = adminService.toggleUserStatus(request.getUsuarioId());
        ToggleUsuarioStatusResponse response = new ToggleUsuarioStatusResponse();
        response.setSuccess(true);
        response.setMessage("Usuario " + (u.getActivo() ? "activado" : "desactivado") + " correctamente");
        response.setActivo(u.getActivo());
        return response;
    }

    /**
     * Actualiza la información de perfil y privilegios de un usuario por parte del administrador.
     * Mapeado al request XML {@link UpdateUsuarioAdminRequest}.
     *
     * @param request Payload XML con los nuevos campos de nombre, correo, cédula, teléfono, contraseña y rol.
     * @return {@link UpdateUsuarioAdminResponse} que encapsula el usuario modificado.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "updateUsuarioAdminRequest")
    @ResponsePayload
    public UpdateUsuarioAdminResponse updateUsuarioAdmin(@RequestPayload UpdateUsuarioAdminRequest request) {
        Usuario data = Usuario.builder()
                .rol(request.getRol())
                .activo(null) // maintained separately
                .nombre(request.getNombre())
                .correo(request.getCorreo())
                .cedula(request.getCedula())
                .telefono(request.getTelefono())
                .passwordHash(request.getPassword())
                .build();

        Usuario u = adminService.updateUserAdmin(request.getUsuarioId(), data);

        UpdateUsuarioAdminResponse response = new UpdateUsuarioAdminResponse();
        response.setSuccess(true);
        response.setMessage("Usuario actualizado correctamente");

        UsuarioSoapType soap = new UsuarioSoapType();
        soap.setId(u.getId());
        soap.setNombre(u.getNombre());
        soap.setCorreo(u.getCorreo());
        soap.setRol(u.getRol());
        soap.setActivo(u.getActivo() != null ? u.getActivo() : true);
        response.setUsuario(soap);
        return response;
    }

    /**
     * Recupera todos los pagos cargados por transferencia bancaria filtrados por su estado financiero (pendientes, aprobados, rechazados).
     * Mapeado al request XML {@link GetPagosRequest}.
     *
     * @param request Payload XML conteniendo el filtro de estado del pago.
     * @return {@link GetPagosResponse} con el listado detallado de transacciones.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getPagosRequest")
    @ResponsePayload
    public GetPagosResponse getPagos(@RequestPayload GetPagosRequest request) {
        String estadoFiltro = request.getEstado() != null ? request.getEstado() : "pendientes";
        String estadoDb = "comprobante_subido";
        if ("aprobados".equalsIgnoreCase(estadoFiltro)) {
            estadoDb = "aprobado";
        } else if ("rechazados".equalsIgnoreCase(estadoFiltro)) {
            estadoDb = "rechazado";
        }

        final String searchState = estadoDb;
        List<Pago> pagos = pagoRepository.findAll();
        List<PagoSoapType> list = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        for (Pago p : pagos) {
            Viaje v = p.getViaje();
            if (v != null && (searchState.equalsIgnoreCase(v.getEstadoPago()) ||
                    ("aprobado".equalsIgnoreCase(searchState) && "pagado".equalsIgnoreCase(v.getEstadoPago())))) {

                Usuario cliente = v.getCliente();
                PagoSoapType soap = new PagoSoapType();
                soap.setId(p.getId());
                soap.setComprobanteUrl(p.getComprobanteUrl());
                soap.setFechaSubida(p.getFechaPago() != null ? p.getFechaPago().format(formatter) : "");
                soap.setEstado(v.getEstadoPago());
                soap.setViajeId(v.getId());
                soap.setMontoTotal(p.getMontoPagado() != null ? p.getMontoPagado().doubleValue() : 0.0);
                soap.setClienteNombre(cliente != null ? cliente.getNombre() : "Desconocido");
                soap.setClienteCedula(cliente != null ? cliente.getCedula() : "N/A");
                soap.setOrigen(v.getDirOrigen());
                soap.setDestino(v.getDirDestino());

                list.add(soap);
            }
        }

        // Sort descending by ID (newest first)
        list.sort((a, b) -> Long.compare(b.getId(), a.getId()));

        GetPagosResponse response = new GetPagosResponse();
        response.getPagos().addAll(list);
        return response;
    }

    /**
     * Aprueba financieramente un pago, promueve el viaje a "buscando_chofer",
     * genera el boleto QR electrónico y difunde notificaciones a los clientes y conductores.
     * Mapeado al request XML {@link AprobarPagoRequest}.
     *
     * @param request Payload XML con el identificador único del pago.
     * @return {@link AprobarPagoResponse} informando del éxito de la validación.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "aprobarPagoRequest")
    @ResponsePayload
    public AprobarPagoResponse aprobarPago(@RequestPayload AprobarPagoRequest request) {
        Long pagoId = request.getPagoId();
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

        if (v.getCliente() != null) {
            socketIOService.broadcastPagoActualizado(v.getId(), v.getCliente().getId(), "aprobado", "buscando_chofer");
        }
        socketIOService.broadcastNuevoViajeDisponible(v);

        AprobarPagoResponse response = new AprobarPagoResponse();
        response.setSuccess(true);
        response.setMessage("Pago aprobado, buscando chofer");
        return response;
    }

    /**
     * Rechaza transaccionalmente un depósito, regresa el viaje a "pendiente" con un plazo
     * de 15 minutos para reenviar el comprobante y guarda el comentario de rechazo para el cliente.
     * Mapeado al request XML {@link RechazarPagoRequest}.
     *
     * @param request Payload XML con el identificador del pago y el motivo del rechazo.
     * @return {@link RechazarPagoResponse} de éxito de rechazo.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "rechazarPagoRequest")
    @ResponsePayload
    public RechazarPagoResponse rechazarPago(@RequestPayload RechazarPagoRequest request) {
        Long pagoId = request.getPagoId();
        Pago pago = pagoRepository.findById(pagoId)
                .orElseThrow(() -> new ResourceNotFoundException("Pago no encontrado con el ID: " + pagoId));

        String motivo = request.getMotivo();
        Viaje v = pago.getViaje();
        v.setEstadoPago("rechazado");
        v.setEstadoLogistico("pendiente");
        v.setFechaLimitePago(LocalDateTime.now().plusMinutes(15));
        v.setComentarioRechazo(motivo != null ? motivo.trim() : null);
        viajeRepository.save(v);

        if (v.getCliente() != null) {
            socketIOService.broadcastPagoActualizado(v.getId(), v.getCliente().getId(), "rechazado", "pendiente");
        }

        RechazarPagoResponse response = new RechazarPagoResponse();
        response.setSuccess(true);
        response.setMessage("Pago rechazado correctamente");
        return response;
    }

    /**
     * Obtiene la bandeja de entrada unificada de conversaciones de soporte técnico.
     * Agrupa mensajes por cliente y calcula metadatos como cantidad de mensajes sin leer,
     * agente asignado, estado general de resolución y el último mensaje cronológico.
     * Mapeado al request XML {@link GetInboxRequest}.
     *
     * @param request Payload XML de la petición.
     * @return {@link GetInboxResponse} que envuelve la lista de chats activos en bandeja.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getInboxRequest")
    @ResponsePayload
    public GetInboxResponse getInbox(@RequestPayload GetInboxRequest request) {
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

        List<InboxChatSoapType> list = new ArrayList<>();
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");

        for (Map.Entry<Long, List<MensajeChat>> entry : messagesByClient.entrySet()) {
            Long clientId = entry.getKey();
            List<MensajeChat> msgs = entry.getValue();

            msgs.sort((a, b) -> b.getTimestamp().compareTo(a.getTimestamp()));
            MensajeChat latestMsg = msgs.get(0);

            Usuario clientUser = usuarioRepository.findById(clientId).orElse(null);
            if (clientUser == null) continue;

            int unread = (int) msgs.stream()
                    .filter(m -> m.getRemitente().getId().equals(clientId) && !m.getLeido())
                    .count();

            Usuario soporte = null;
            String categoria = "General";
            String estado = "resuelto";

            for (MensajeChat m : msgs) {
                if (!"resuelto".equalsIgnoreCase(m.getEstado())) {
                    estado = "abierto";
                }
            }

            for (MensajeChat m : msgs) {
                if ("abierto".equals(estado)) {
                    if (!"resuelto".equalsIgnoreCase(m.getEstado())) {
                        if (m.getSoporteAsignado() != null) {
                            soporte = m.getSoporteAsignado();
                        }
                        if (m.getCategoria() != null) {
                            categoria = m.getCategoria();
                        }
                    }
                } else {
                    if (m.getSoporteAsignado() != null) {
                        soporte = m.getSoporteAsignado();
                    }
                    if (m.getCategoria() != null) {
                        categoria = m.getCategoria();
                    }
                }
            }

            InboxChatSoapType soap = new InboxChatSoapType();
            soap.setId(latestMsg.getId());
            soap.setClienteId(clientUser.getId());
            soap.setClienteNombre(clientUser.getNombre());
            soap.setClienteFotoUrl(clientUser.getFotoPerfilUrl() != null ? clientUser.getFotoPerfilUrl() : "");
            soap.setUltimoMensaje(latestMsg.getContenido());
            soap.setLeido(latestMsg.getLeido() != null ? latestMsg.getLeido() : false);
            soap.setUnread(unread);
            soap.setFecha(latestMsg.getTimestamp().format(formatter));
            soap.setAsignadoA(soporte != null ? soporte.getNombre() : "Sin Asignar");
            soap.setSoporteAsignadoId(soporte != null ? soporte.getId() : null);
            soap.setCategoria(categoria);
            soap.setResuelto("resuelto".equalsIgnoreCase(estado));

            list.add(soap);
        }

        // Sort descending by date
        list.sort((a, b) -> b.getFecha().compareTo(a.getFecha()));

        GetInboxResponse response = new GetInboxResponse();
        response.getChats().addAll(list);
        return response;
    }

    /**
     * Calcula y compila estadísticas globales del sistema y tendencias financieras/operativas,
     * retornando un objeto serializado en formato JSON.
     * Mapeado al request XML {@link GetStatsRequest}.
     *
     * @param request Payload XML especificando el período o rangos de fecha personalizados.
     * @return {@link GetStatsResponse} que contiene la estructura JSON con ingresos, KPIs y movimientos.
     * @throws JsonProcessingException Si se presentan fallos al serializar las estructuras a formato JSON.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getStatsRequest")
    @ResponsePayload
    public GetStatsResponse getStats(@RequestPayload GetStatsRequest request) throws JsonProcessingException {
        String period = request.getPeriod() != null ? request.getPeriod() : "month";
        String startDateStr = request.getStartDate();
        String endDateStr = request.getEndDate();

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

        double totalRevenue = filteredTrips.stream()
                .filter(v -> "aprobado".equalsIgnoreCase(v.getEstadoPago()) || "pagado".equalsIgnoreCase(v.getEstadoPago()))
                .mapToDouble(v -> v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0)
                .sum();

        long activeTrips = filteredTrips.stream()
                .filter(v -> Arrays.asList("en_curso", "recogiendo", "aceptado").contains(v.getEstadoLogistico().toLowerCase()))
                .count();

        long pendingPayments = filteredTrips.stream()
                .filter(v -> "pendiente".equalsIgnoreCase(v.getEstadoPago()) || "comprobante_subido".equalsIgnoreCase(v.getEstadoPago()))
                .count();

        long onlineDrivers = usuarioRepository.findAll().stream()
                .filter(u -> "chofer".equalsIgnoreCase(u.getRol()) && u.getActivo() == true)
                .count();

        Map<String, Object> kpis = new HashMap<>();
        kpis.put("ingresos_totales", totalRevenue);
        kpis.put("viajes_activos", activeTrips);
        kpis.put("pagos_pendientes", pendingPayments);
        kpis.put("choferes_online", onlineDrivers);

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
            if (daysBetween > 90) daysBetween = 90;
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

        Map<String, Long> distributionMap = filteredTrips.stream()
                .filter(v -> v.getEstadoLogistico() != null)
                .collect(Collectors.groupingBy(Viaje::getEstadoLogistico, Collectors.counting()));

        Map<String, Object> distributionChart = new HashMap<>();
        distributionChart.put("labels", new ArrayList<>(distributionMap.keySet()));
        distributionChart.put("data", new ArrayList<>(distributionMap.values()));

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

        Map<String, Long> servicesMap = filteredTrips.stream()
                .filter(v -> v.getTipoServicio() != null)
                .collect(Collectors.groupingBy(Viaje::getTipoServicio, Collectors.counting()));

        Map<String, Object> servicesChart = new HashMap<>();
        servicesChart.put("labels", new ArrayList<>(servicesMap.keySet()));
        servicesChart.put("data", new ArrayList<>(servicesMap.values()));

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

        Map<String, Object> statsData = new HashMap<>();
        statsData.put("kpis", kpis);

        Map<String, Object> charts = new HashMap<>();
        charts.put("revenue", revenueChart);
        charts.put("distribution", distributionChart);
        charts.put("routes", routesList);
        charts.put("services", servicesChart);
        statsData.put("charts", charts);
        statsData.put("movements", movements);

        String json = objectMapper.writeValueAsString(statsData);

        GetStatsResponse response = new GetStatsResponse();
        response.setStatsJson(json);
        return response;
    }

    /**
     * Sube, decodifica y guarda de manera física una foto de avatar para un usuario del sistema.
     * Mapeado al request XML {@link UpdateUsuarioPhotoAdminRequest}.
     *
     * @param request Payload XML que contiene el identificador del usuario, el nombre de archivo y la codificación Base64 de la imagen.
     * @return {@link UpdateUsuarioPhotoAdminResponse} con el estado de la subida y la dirección URL del nuevo avatar.
     * @throws IOException Si ocurren problemas al escribir el archivo decodificado en el disco.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "updateUsuarioPhotoAdminRequest")
    @ResponsePayload
    public UpdateUsuarioPhotoAdminResponse updateUsuarioPhotoAdmin(@RequestPayload UpdateUsuarioPhotoAdminRequest request) throws IOException {
        Usuario user = usuarioRepository.findById(request.getUsuarioId())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con ID: " + request.getUsuarioId()));

        String base64Data = request.getFileBase64();
        if (base64Data == null || base64Data.isEmpty()) {
            throw new IllegalArgumentException("No se envio ningun archivo");
        }

        if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }
        byte[] decoded = Base64.getDecoder().decode(base64Data);

        String userDir = System.getProperty("user.dir");
        String uploadDir = Paths.get(userDir, "uploads", "avatars").toString();
        File folder = new File(uploadDir);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        String filename = "user_" + user.getId() + "_avatar_" + UUID.randomUUID().toString() + "_" + request.getFilename();
        Files.write(Paths.get(uploadDir, filename), decoded);

        String avatarUrl = "uploads/avatars/" + filename;
        user.setFotoPerfilUrl(avatarUrl);
        Usuario updated = usuarioRepository.save(user);

        UpdateUsuarioPhotoAdminResponse response = new UpdateUsuarioPhotoAdminResponse();
        response.setSuccess(true);
        response.setMessage("Foto de perfil actualizada correctamente");
        response.setFotoPerfilUrl(updated.getFotoPerfilUrl());
        return response;
    }
}
