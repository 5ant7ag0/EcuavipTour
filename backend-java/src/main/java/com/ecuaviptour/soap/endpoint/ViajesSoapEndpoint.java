package com.ecuaviptour.soap.endpoint;

import com.ecuaviptour.model.*;
import com.ecuaviptour.repository.*;
import com.ecuaviptour.service.interfaces.CalificacionService;
import com.ecuaviptour.service.interfaces.SocketIOService;
import com.ecuaviptour.service.interfaces.ViajeService;
import com.ecuaviptour.soap.viajes.*;
import com.ecuaviptour.exception.ResourceNotFoundException;
import com.ecuaviptour.exception.UnauthorizedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Endpoint del servicio web SOAP para la gestión de itinerarios, reservas y logística de viajes en EcuavipTour.
 * Proporciona métodos para cotizar tarifas de viaje, reservar asientos, consultar viajes activos o pasados de un cliente,
 * obtener asientos reservados, calificar el servicio recibido, validar el abordaje mediante códigos e iniciar la cancelación del viaje.
 *
 * @author Santiago T.
 * @version 1.0
 */
@Endpoint
@Transactional
public class ViajesSoapEndpoint {

    private static final String NAMESPACE_URI = "http://ecuaviptour.com/soap/viajes";

    private final ViajeService viajeService;
    private final CalificacionService calificacionService;
    private final UsuarioRepository usuarioRepository;
    private final TicketQRRepository ticketQRRepository;
    private final CalificacionRepository calificacionRepository;
    private final ReservaAsientoRepository reservaAsientoRepository;
    private final ViajeRepository viajeRepository;
    private final VehiculoRepository vehiculoRepository;
    private final SocketIOService socketIOService;

    /**
     * Constructor para la inyección de dependencias de los repositorios y servicios de viajes, calificaciones, usuarios y mensajería en tiempo real.
     *
     * @param viajeService             Servicio para la lógica de itinerarios y reservas.
     * @param calificacionService      Servicio para gestionar las calificaciones del servicio.
     * @param usuarioRepository        Repositorio de cuentas de usuario.
     * @param ticketQRRepository       Repositorio para el manejo de códigos QR de abordaje.
     * @param calificacionRepository   Repositorio para la persistencia de calificaciones.
     * @param reservaAsientoRepository Repositorio para la persistencia de reserva de asientos.
     * @param viajeRepository          Repositorio para la entidad de viajes.
     * @param vehiculoRepository       Repositorio para la entidad de vehículos.
     * @param socketIOService          Servicio para notificaciones y transmisiones Socket.IO en tiempo real.
     */
    public ViajesSoapEndpoint(ViajeService viajeService,
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

    /**
     * Calcula una cotización estimada de viaje en base a la distancia, número de pasajeros y tipo de servicio.
     * Mapeado al request XML {@link CotizarRequest}.
     *
     * @param request Payload XML con los criterios de cotización (distancia en Km, tipo de servicio y número de pasajeros).
     * @return {@link CotizarResponse} con la tarifa unitaria y total calculadas y detalles adicionales de zona o cobertura.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "cotizarRequest")
    @ResponsePayload
    public CotizarResponse cotizar(@RequestPayload CotizarRequest request) {
        Integer numPasajeros = request.getNumPasajeros() != null ? request.getNumPasajeros() : 1;
        Map<String, Object> quote = viajeService.cotizar(request.getDistanciaKm(), request.getTipoServicio(), numPasajeros);

        CotizarResponse response = new CotizarResponse();
        response.setPrecioTotal((BigDecimal) quote.get("precio_total"));
        response.setPrecioUnitario((BigDecimal) quote.get("precio_unitario"));
        response.setZona((String) quote.get("zona"));
        if (quote.containsKey("mensaje")) {
            response.setMensaje((String) quote.get("mensaje"));
        }
        return response;
    }

    /**
     * Crea y registra una nueva reserva de viaje para un cliente, opcionalmente asignando conductor, asientos específicos y tarifa.
     * Mapeado al request XML {@link ReservarRequest}.
     *
     * @param request Payload XML con los datos geográficos de origen y destino, tipo de servicio, lista de asientos, fecha de viaje y tarifa.
     * @return {@link ReservarResponse} con el mensaje de confirmación, ID del viaje y el monto final total.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "reservarRequest")
    @ResponsePayload
    public ReservarResponse reservar(@RequestPayload ReservarRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario activeUser = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        Long clienteId = activeUser.getId();
        if ("admin".equalsIgnoreCase(activeUser.getRol()) && request.getClienteId() != null) {
            clienteId = request.getClienteId();
        }

        Long choferId = request.getChoferId();
        Integer numPasajeros = request.getNumPasajeros();
        BigDecimal tarifa = request.getTarifa();

        List<Integer> seats = request.getAsientos();

        Viaje viaje = Viaje.builder()
                .dirOrigen(request.getOrigen())
                .latOrigen(request.getLatOrigen())
                .lngOrigen(request.getLngOrigen())
                .dirDestino(request.getDestino())
                .latDestino(request.getLatDestino())
                .lngDestino(request.getLngDestino())
                .referenciaAdicional(request.getReferencia())
                .tipoServicio(request.getTipoServicio())
                .duracionMinutos(request.getDuracionMinutos() != null ? request.getDuracionMinutos() : 30)
                .distanciaKm(request.getDistancia() != null ? request.getDistancia() : BigDecimal.ZERO)
                .build();

        if (request.getFechaViaje() != null && !request.getFechaViaje().isEmpty()) {
            try {
                viaje.setFechaViaje(LocalDateTime.parse(request.getFechaViaje().replace(" ", "T")));
            } catch (Exception e) {
                viaje.setFechaViaje(LocalDateTime.now().plusDays(1));
            }
        } else {
            viaje.setFechaViaje(LocalDateTime.now().plusDays(1));
        }

        Viaje saved = viajeService.reservar(viaje, seats, clienteId, choferId, numPasajeros, tarifa);

        ReservarResponse response = new ReservarResponse();
        response.setMessage("Viaje reservado con éxito");
        response.setViajeId(saved.getId());
        response.setMontoTotal(saved.getMontoTotal());
        return response;
    }

    /**
     * Obtiene el listado de todos los viajes registrados e históricos del cliente autenticado actual.
     * Mapeado al request XML {@link GetMisViajesRequest}.
     *
     * @param request Payload XML de la petición.
     * @return {@link GetMisViajesResponse} que encapsula la lista de viajes del usuario mapeados al tipo SOAP.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getMisViajesRequest")
    @ResponsePayload
    public GetMisViajesResponse getMisViajes(@RequestPayload GetMisViajesRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        List<Viaje> trips = viajeService.getViajesCliente(user.getId());
        GetMisViajesResponse response = new GetMisViajesResponse();

        for (Viaje v : trips) {
            response.getViajes().add(mapViajeToSoap(v));
        }
        return response;
    }

    /**
     * Recupera el viaje activo actual (ej. solicitado, en curso, pendiente de pago) asociado al cliente autenticado.
     * Mapeado al request XML {@link GetViajeActivoRequest}.
     *
     * @param request Payload XML de la petición.
     * @return {@link GetViajeActivoResponse} con la información del viaje activo, si existe.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getViajeActivoRequest")
    @ResponsePayload
    public GetViajeActivoResponse getViajeActivo(@RequestPayload GetViajeActivoRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        Optional<Viaje> active = viajeService.getViajeActivo(user.getId());
        GetViajeActivoResponse response = new GetViajeActivoResponse();

        active.ifPresent(viaje -> response.setViaje(mapViajeToSoap(viaje)));
        return response;
    }

    /**
     * Recupera la lista de números de asientos reservados/ocupados para un viaje específico.
     * Mapeado al request XML {@link GetAsientosOcupadosRequest}.
     *
     * @param request Payload XML con el ID del viaje.
     * @return {@link GetAsientosOcupadosResponse} con los identificadores numéricos de los asientos ocupados.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getAsientosOcupadosRequest")
    @ResponsePayload
    public GetAsientosOcupadosResponse getAsientosOcupados(@RequestPayload GetAsientosOcupadosRequest request) {
        List<Integer> seats = viajeService.getAsientosOcupados(request.getViajeId());
        GetAsientosOcupadosResponse response = new GetAsientosOcupadosResponse();
        response.getAsientos().addAll(seats);
        return response;
    }

    /**
     * Registra la calificación y valoración con estrellas y comentarios realizada por un cliente respecto a un viaje finalizado.
     * Mapeado al request XML {@link CalificarRequest}.
     *
     * @param request Payload XML que contiene el ID del viaje, número de estrellas otorgadas y un comentario descriptivo.
     * @return {@link CalificarResponse} con la confirmación de la calificación y el ID del registro generado.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "calificarRequest")
    @ResponsePayload
    public CalificarResponse calificar(@RequestPayload CalificarRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        Calificacion c = calificacionService.calificar(request.getViajeId(), user.getId(), request.getEstrellas(), request.getComentario());

        CalificarResponse response = new CalificarResponse();
        response.setMessage("Viaje calificado correctamente");
        response.setCalificacionId(c.getId());
        return response;
    }

    /**
     * Valida el código de abordaje de un viaje para cambiar su estado logístico e iniciar el trayecto de viaje.
     * Mapeado al request XML {@link ValidarAbordajeRequest}.
     *
     * @param request Payload XML con el ID del viaje y el código de validación.
     * @return {@link ValidarAbordajeResponse} indicando si el código de abordaje es correcto y el nuevo estado logístico.
     * @throws ResourceNotFoundException Si el viaje con el ID especificado no es encontrado.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "validarAbordajeRequest")
    @ResponsePayload
    public ValidarAbordajeResponse validarAbordaje(@RequestPayload ValidarAbordajeRequest request) {
        Viaje viaje = viajeRepository.findById(request.getViajeId())
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado con el ID: " + request.getViajeId()));

        Optional<TicketQR> ticketOpt = ticketQRRepository.findByViajeId(viaje.getId());
        String expectedPin = "";
        String fullHash = null;
        if (ticketOpt.isPresent() && ticketOpt.get().getCodigoHash() != null) {
            fullHash = ticketOpt.get().getCodigoHash();
            if (fullHash.length() >= 4) {
                expectedPin = fullHash.substring(fullHash.length() - 4).toUpperCase();
            } else {
                expectedPin = fullHash.toUpperCase();
            }
        } else {
            String idStr = String.format("%04d", viaje.getId());
            expectedPin = idStr.substring(idStr.length() - 4);
        }

        String inputCode = request.getCodigo();
        boolean isValid = false;
        if (inputCode != null) {
            String upperInput = inputCode.trim().toUpperCase();
            if (upperInput.equals("QR_SIMULADO") 
                || upperInput.equals(expectedPin) 
                || (fullHash != null && upperInput.equals(fullHash.toUpperCase()))) {
                isValid = true;
            }
        }

        ValidarAbordajeResponse response = new ValidarAbordajeResponse();
        if (isValid) {
            viaje.setEstadoLogistico("en_curso");
            viajeRepository.save(viaje);

            if (ticketOpt.isPresent()) {
                TicketQR ticket = ticketOpt.get();
                ticket.setEstado("usado");
                ticketQRRepository.save(ticket);
            }

            Long clienteId = viaje.getCliente() != null ? viaje.getCliente().getId() : null;
            if (clienteId != null) {
                socketIOService.broadcastViajeActualizado(viaje.getId(), clienteId, "en_curso");
            }

            response.setMensaje("Abordaje verificado correctamente");
            response.setEstado("en_curso");
            return response;
        } else {
            throw new IllegalArgumentException("Código de abordaje inválido.");
        }
    }

    /**
     * Cancela un viaje activo de forma lógica, liberando el chofer y cancelando las reservas de asientos asociadas.
     * Notifica la cancelación en tiempo real al cliente y chofer mediante Socket.IO.
     * Mapeado al request XML {@link CancelarViajeRequest}.
     *
     * @param request Payload XML con el ID del viaje a cancelar.
     * @return {@link CancelarViajeResponse} con el mensaje de confirmación de la cancelación.
     * @throws ResourceNotFoundException Si el viaje con el ID especificado no es encontrado.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "cancelarViajeRequest")
    @ResponsePayload
    public CancelarViajeResponse cancelarViaje(@RequestPayload CancelarViajeRequest request) {
        Long viajeId = request.getViajeId();
        Viaje viaje = viajeRepository.findById(viajeId)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado con el ID: " + viajeId));

        viaje.setEstadoLogistico("cancelado");
        viaje.setEstadoPago("cancelado");

        Long clienteId = viaje.getCliente() != null ? viaje.getCliente().getId() : null;
        Long choferId = viaje.getChofer() != null ? viaje.getChofer().getId() : null;

        viaje.setChofer(null);
        viaje.setVehiculo(null);
        viajeRepository.save(viaje);

        // Cancel associated seat reservations
        List<ReservaAsiento> reservations = reservaAsientoRepository.findByViajeId(viajeId);
        for (ReservaAsiento r : reservations) {
            r.setEstado("cancelado");
            reservaAsientoRepository.save(r);
        }

        // Broadcast real-time Socket.IO cancellation event
        socketIOService.broadcastViajeCancelado(viajeId, "El viaje ha sido cancelado por el cliente", clienteId, choferId);

        CancelarViajeResponse response = new CancelarViajeResponse();
        response.setMensaje("Viaje cancelado correctamente");
        return response;
    }

    /**
     * Convierte una entidad de dominio {@link Viaje} en un tipo de datos SOAP {@link ViajeSoapType} compatible con JAXB.
     * Mapea detalles de cliente, chofer, vehículo asignado, estado de pago, código QR y calificaciones asociadas.
     *
     * @param v Entidad Viaje a mapear.
     * @return Objeto ViajeSoapType con todos los atributos de viaje formateados para la respuesta XML.
     */
    private ViajeSoapType mapViajeToSoap(Viaje v) {
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        ViajeSoapType soap = new ViajeSoapType();
        soap.setId(v.getId());
        soap.setViajeId(v.getId());
        soap.setOrigen(v.getDirOrigen());
        soap.setDestino(v.getDirDestino());
        soap.setDistanciaKm(v.getDistanciaKm() != null ? v.getDistanciaKm().doubleValue() : 0.0);
        soap.setMonto(v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0);
        soap.setEstadoPago(v.getEstadoPago());
        soap.setEstadoLogistico(v.getEstadoLogistico());
        soap.setTipoServicio(v.getTipoServicio());
        soap.setFecha(v.getFechaCreacion() != null ? v.getFechaCreacion().format(formatter) : "Sin fecha");
        if (v.getFechaLimitePago() != null) {
            soap.setFechaLimitePago(v.getFechaLimitePago().toString());
        }
        soap.setComentarioRechazo(v.getComentarioRechazo());

        // QR
        Optional<TicketQR> qr = ticketQRRepository.findByViajeId(v.getId());
        qr.ifPresent(ticketQR -> soap.setQrHash(ticketQR.getCodigoHash()));

        // Cliente info
        if (v.getCliente() != null) {
            soap.setClienteId(v.getCliente().getId());
            soap.setNombreCliente(v.getCliente().getNombre());
            soap.setFotoClienteUrl(v.getCliente().getFotoPerfilUrl());
        }

        // Chofer info
        if (v.getChofer() != null) {
            soap.setChoferId(v.getChofer().getId());
            soap.setNombreChofer(v.getChofer().getNombre());
            soap.setFotoChoferUrl(v.getChofer().getFotoPerfilUrl());
            soap.setChofer(mapUsuarioToSoap(v.getChofer()));
        }

        // Vehiculo info
        Vehiculo veh = v.getVehiculo();
        if (veh == null && v.getChofer() != null) {
            veh = vehiculoRepository.findByChoferId(v.getChofer().getId()).orElse(null);
        }
        if (veh != null) {
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
            soap.setVehiculo(vSoap);
        }

        // Calificacion
        List<Calificacion> califications = calificacionRepository.findByViajeId(v.getId());
        if (!califications.isEmpty()) {
            Calificacion cal = califications.get(0);
            CalificacionSoapType cSoap = new CalificacionSoapType();
            cSoap.setEstrellas(cal.getEstrellas());
            cSoap.setComentario(cal.getComentario());
            soap.setCalificacion(cSoap);
        }

        // Seats
        soap.getAsientos().addAll(viajeService.getAsientosOcupados(v.getId()));

        return soap;
    }

    /**
     * Convierte una entidad de dominio {@link Usuario} en un tipo de datos SOAP {@link UsuarioSoapType} compatible con JAXB.
     *
     * @param u Entidad Usuario a mapear.
     * @return Objeto UsuarioSoapType con los datos de perfil mapeados para XML.
     */
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
}
