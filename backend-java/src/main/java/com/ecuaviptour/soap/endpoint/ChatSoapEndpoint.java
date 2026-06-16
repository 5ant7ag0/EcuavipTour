package com.ecuaviptour.soap.endpoint;

import com.ecuaviptour.modules.chat.service.ChatService;

import com.ecuaviptour.modules.chat.repository.MensajeRepository;

import com.ecuaviptour.modules.chat.domain.MensajeChat;

import com.ecuaviptour.modules.chat.domain.MensajeChat;
import com.ecuaviptour.modules.users.domain.Usuario;
import com.ecuaviptour.modules.chat.repository.MensajeRepository;
import com.ecuaviptour.modules.users.repository.UsuarioRepository;
import com.ecuaviptour.modules.chat.service.ChatService;
import com.ecuaviptour.shared.service.SocketIOService;
import com.ecuaviptour.soap.chat.*;
import com.ecuaviptour.exception.ResourceNotFoundException;
import com.ecuaviptour.exception.UnauthorizedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

/**
 * Endpoint del servicio web SOAP para gestionar las operaciones de chat y soporte técnico en tiempo real.
 * Permite a los clientes y administradores consultar historiales de chat, marcar mensajes como leídos,
 * asignar agentes de soporte a tickets específicos y declarar la resolución final de incidencias.
 *
 * @author Santiago T.
 * @version 1.0
 */
@Endpoint
@Transactional
public class ChatSoapEndpoint {

    private static final String NAMESPACE_URI = "http://ecuaviptour.com/soap/chat";

    private final ChatService chatService;
    private final UsuarioRepository usuarioRepository;
    private final MensajeRepository mensajeRepository;
    private final SocketIOService socketIOService;

    /**
     * Constructor para la inyección de dependencias de lógica de chat, seguridad y sockets.
     *
     * @param chatService       Servicio de mensajería y persistencia de chat.
     * @param usuarioRepository Repositorio de usuarios.
     * @param mensajeRepository Repositorio de persistencia de mensajes.
     * @param socketIOService   Servicio de notificaciones Socket.IO en tiempo real.
     */
    public ChatSoapEndpoint(ChatService chatService,
                            UsuarioRepository usuarioRepository,
                            MensajeRepository mensajeRepository,
                            SocketIOService socketIOService) {
        this.chatService = chatService;
        this.usuarioRepository = usuarioRepository;
        this.mensajeRepository = mensajeRepository;
        this.socketIOService = socketIOService;
    }

    /**
     * Recupera el historial de chat (sea grupal de viaje o de canal de soporte directo).
     * Marca implícitamente como leídos aquellos mensajes recibidos al ser consultados.
     * Mapeado al request XML {@link GetHistoryRequest}.
     *
     * @param request Payload XML con los filtros (tipo de receptor, viaje ID, target ID).
     * @return {@link GetHistoryResponse} que envuelve la lista de mensajes en formato SOAP.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getHistoryRequest")
    @ResponsePayload
    public GetHistoryResponse getHistory(@RequestPayload GetHistoryRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        if (userIdStr == null || userIdStr.isBlank() || "anonymousUser".equalsIgnoreCase(userIdStr)) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        List<MensajeChat> list;
        String tipoReceptor = request.getTipoReceptor() != null ? request.getTipoReceptor() : "admin";
        if ("chofer".equalsIgnoreCase(tipoReceptor) && request.getViajeId() != null) {
            list = chatService.getHistorialPorViaje(request.getViajeId());
        } else {
            Long clienteId = "admin".equalsIgnoreCase(user.getRol()) ? request.getTargetId() : user.getId();
            list = chatService.getHistorialSoporteCliente(clienteId);
        }

        // Implicitly mark support messages as read if the recipient fetches them
        for (MensajeChat m : list) {
            if (m.getRemitente() != null && !m.getRemitente().getId().equals(user.getId()) && !m.getLeido()) {
                m.setLeido(true);
                mensajeRepository.save(m);
            }
        }

        GetHistoryResponse response = new GetHistoryResponse();
        for (MensajeChat m : list) {
            response.getMessages().add(mapMensajeToSoap(m));
        }
        return response;
    }

    /**
     * Marca como leídos todos los mensajes recibidos pendientes en una conversación bidireccional específica.
     * Mapeado al request XML {@link MarkReadRequest}.
     *
     * @param request Payload XML con el identificador del otro participante.
     * @return {@link MarkReadResponse} indicando si existieron mensajes actualizados.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "markReadRequest")
    @ResponsePayload
    public MarkReadResponse markRead(@RequestPayload MarkReadRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        if (userIdStr == null || userIdStr.isBlank() || "anonymousUser".equalsIgnoreCase(userIdStr)) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        List<MensajeChat> history = chatService.getHistorialEntreUsuarios(user.getId(), request.getOtroId());
        boolean updated = false;
        for (MensajeChat m : history) {
            if (m.getRemitente() != null && m.getRemitente().getId().equals(request.getOtroId()) && !m.getLeido()) {
                m.setLeido(true);
                mensajeRepository.save(m);
                updated = true;
            }
        }

        MarkReadResponse response = new MarkReadResponse();
        response.setMessage("Mensajes marcados como leidos");
        response.setUpdated(updated);
        return response;
    }

    /**
     * Obtiene información general del administrador principal de soporte para flujos iniciales de chat.
     * Mapeado al request XML {@link GetAdminInfoRequest}.
     *
     * @param request Payload XML de la petición.
     * @return {@link GetAdminInfoResponse} con el identificador y nombre del administrador disponible.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getAdminInfoRequest")
    @ResponsePayload
    public GetAdminInfoResponse getAdminInfo(@RequestPayload GetAdminInfoRequest request) {
        Optional<Usuario> admin = usuarioRepository.findAll().stream()
                .filter(u -> "admin".equalsIgnoreCase(u.getRol()))
                .findFirst();

        GetAdminInfoResponse response = new GetAdminInfoResponse();
        if (admin.isPresent()) {
            response.setAdminId(admin.get().getId());
            response.setAdminNombre(admin.get().getNombre());
        } else {
            response.setAdminId(1L);
            response.setAdminNombre("Soporte Ecuavip");
        }
        return response;
    }

    /**
     * Asigna formalmente el agente administrador autenticado a un canal de soporte técnico de un cliente.
     * Mapeado al request XML {@link AssignSupportRequest}.
     *
     * @param request Payload XML con el identificador del cliente y la categoría temática del ticket.
     * @return {@link AssignSupportResponse} indicando el éxito o fallo de la asignación.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "assignSupportRequest")
    @ResponsePayload
    public AssignSupportResponse assignSupport(@RequestPayload AssignSupportRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        if (userIdStr == null || userIdStr.isBlank() || "anonymousUser".equalsIgnoreCase(userIdStr)) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Long adminId = Long.parseLong(userIdStr);

        AssignSupportResponse response = new AssignSupportResponse();
        try {
            chatService.asignarSoporte(request.getClienteId(), adminId, request.getCategoria());

            Usuario supportAgent = usuarioRepository.findById(adminId)
                    .orElseThrow(() -> new ResourceNotFoundException("Agente de soporte no encontrado con el ID: " + adminId));
            socketIOService.broadcastSupportAssign(
                    request.getClienteId(),
                    request.getCategoria(),
                    supportAgent.getId(),
                    supportAgent.getNombre(),
                    supportAgent.getFotoPerfilUrl()
            );

            response.setSuccess(true);
            response.setMessage("Chat asignado correctamente");
        } catch (Exception e) {
            response.setSuccess(false);
            response.setMessage("No se pudo asignar soporte: " + e.getMessage());
        }
        return response;
    }

    /**
     * Resuelve y cierra de forma definitiva el ticket o chat activo de soporte técnico de un cliente.
     * Mapeado al request XML {@link ResolveCaseRequest}.
     *
     * @param request Payload XML con el identificador del cliente.
     * @return {@link ResolveCaseResponse} indicando el éxito del cierre de caso.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "resolveCaseRequest")
    @ResponsePayload
    public ResolveCaseResponse resolveCase(@RequestPayload ResolveCaseRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        if (userIdStr == null || userIdStr.isBlank() || "anonymousUser".equalsIgnoreCase(userIdStr)) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Long adminId = Long.parseLong(userIdStr);

        ResolveCaseResponse response = new ResolveCaseResponse();
        try {
            MensajeChat systemMsg = chatService.resolverCaso(request.getClienteId(), adminId);
            socketIOService.broadcastCaseResolve(request.getClienteId());
            socketIOService.broadcastSystemMessage(systemMsg);

            response.setSuccess(true);
            response.setMessage("Conversacion marcada como resuelta");
        } catch (Exception e) {
            response.setSuccess(false);
            response.setMessage("No se pudo resolver el caso: " + e.getMessage());
        }
        return response;
    }

    /**
     * Mapea un objeto {@link MensajeChat} de base de datos a su contraparte SOAP JAXB {@link MensajeChatSoapType}.
     *
     * @param m Objeto de entidad MensajeChat.
     * @return El tipo SOAP mapeado.
     */
    private MensajeChatSoapType mapMensajeToSoap(MensajeChat m) {
        MensajeChatSoapType soap = new MensajeChatSoapType();
        soap.setId(m.getId());
        if (m.getRemitente() != null) {
            soap.setRemitenteId(m.getRemitente().getId());
            soap.setRemitenteNombre(m.getRemitente().getNombre());
        }
        if (m.getDestinatario() != null) {
            soap.setReceptorId(m.getDestinatario().getId());
            soap.setReceptorNombre(m.getDestinatario().getNombre());
        }
        soap.setContenido(m.getContenido());
        soap.setLeido(m.getLeido() != null ? m.getLeido() : false);
        if (m.getTimestamp() != null) {
            soap.setFechaEnvio(m.getTimestamp().toString());
        }
        if (m.getViaje() != null) {
            soap.setViajeId(m.getViaje().getId());
        }
        soap.setTipoReceptor(m.getTipoReceptor());
        soap.setCategoria(m.getCategoria());
        soap.setEstado(m.getEstado());
        if (m.getSoporteAsignado() != null) {
            soap.setSoporteAsignadoId(m.getSoporteAsignado().getId());
            soap.setSoporteAsignadoNombre(m.getSoporteAsignado().getNombre());
            soap.setSoporteAsignadoFotoUrl(m.getSoporteAsignado().getFotoPerfilUrl());
        }
        return soap;
    }
}

