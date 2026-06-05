package com.ecuaviptour.service.implementation;

import com.ecuaviptour.model.MensajeChat;
import com.ecuaviptour.model.Usuario;
import com.ecuaviptour.model.Viaje;
import com.ecuaviptour.repository.MensajeRepository;
import com.ecuaviptour.repository.UsuarioRepository;
import com.ecuaviptour.repository.ViajeRepository;
import com.ecuaviptour.service.interfaces.ChatService;
import com.ecuaviptour.exception.BadRequestException;
import com.ecuaviptour.exception.ConflictException;
import com.ecuaviptour.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Implementación de los servicios para gestionar la mensajería del chat y soporte.
 * Implementa lógica de colisiones de asignación de soporte, apertura automática de tickets,
 * asignaciones de agentes en tiempo real y lectura masiva de mensajes.
 *
 * @author Santiago T.
 * @version 1.0
 */
@Service
public class ChatServiceImpl implements ChatService {

    private final MensajeRepository mensajeRepository;
    private final ViajeRepository viajeRepository;
    private final UsuarioRepository usuarioRepository;

    /**
     * Constructor para la inyección de repositorios encargados de la persistencia de mensajería y cuentas.
     *
     * @param mensajeRepository Repositorio de mensajes de chat.
     * @param viajeRepository   Repositorio de viajes.
     * @param usuarioRepository Repositorio de usuarios.
     */
    public ChatServiceImpl(MensajeRepository mensajeRepository, ViajeRepository viajeRepository, UsuarioRepository usuarioRepository) {
        this.mensajeRepository = mensajeRepository;
        this.viajeRepository = viajeRepository;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Envía y persiste de forma transaccional un nuevo mensaje de chat.
     * Realiza un control anti-colisiones para verificar que un administrador no responda a un caso
     * que esté asignado a otro agente. Autodetecta y gestiona el flujo de soporte del cliente.
     *
     * @param viajeId        Identificador opcional del viaje (para chats grupales de viajes).
     * @param remitenteId    Identificador único del usuario que envía el mensaje.
     * @param destinatarioId Identificador único del usuario destinatario (para chats privados).
     * @param contenido      Contenido en texto del mensaje.
     * @param tipoReceptor   Canal o tipo de receptor ('user', 'admin').
     * @return El {@link MensajeChat} persistido.
     * @throws ResourceNotFoundException Si el remitente especificado no se encuentra registrado.
     * @throws ConflictException         Si un administrador intenta escribir en un chat asignado a otro agente.
     */
    @Override
    @Transactional
    public MensajeChat enviarMensaje(Long viajeId, Long remitenteId, Long destinatarioId, String contenido, String tipoReceptor) {
        Viaje viaje = null;
        if (viajeId != null) {
            viaje = viajeRepository.findById(viajeId).orElse(null);
        }

        Usuario remitente = usuarioRepository.findById(remitenteId)
                .orElseThrow(() -> new ResourceNotFoundException("Remitente no encontrado con el ID: " + remitenteId));

        Usuario destinatario = null;
        if (destinatarioId != null) {
            destinatario = usuarioRepository.findById(destinatarioId).orElse(null);
        }

        // Identificar el ID del cliente de esta conversación
        Long clienteId = null;
        if ("admin".equalsIgnoreCase(remitente.getRol())) {
            clienteId = destinatarioId;
        } else if (destinatario != null && "admin".equalsIgnoreCase(destinatario.getRol())) {
            clienteId = remitenteId;
        } else if ("admin".equalsIgnoreCase(tipoReceptor)) {
            clienteId = remitenteId;
        }

        Usuario soporteAsignado = null;
        String categoria = "General";
        String estado = "abierto";

        if (clienteId != null) {
            // Buscar historial para ver si ya tiene asignado un soporte y categoría
            List<MensajeChat> historial = mensajeRepository.getHistorialSoporteCliente(clienteId);

            boolean tieneActivo = false;
            // Buscar si ya hay un soporte asignado en los mensajes previos de la conversación ACTIVA (no resuelta)
            for (MensajeChat m : historial) {
                if (!"resuelto".equalsIgnoreCase(m.getEstado())) {
                    tieneActivo = true;
                    if (m.getSoporteAsignado() != null) {
                        soporteAsignado = m.getSoporteAsignado();
                    }
                    if (m.getCategoria() != null) {
                        categoria = m.getCategoria();
                    }
                }
            }

            // LÓGICA DE REAPERTURA / NUEVO CHAT POR CLIENTE:
            // Si el remitente is el cliente (no es admin) y no hay mensajes activos (todos resueltos o vacío),
            // limpiamos la asignación de soporte para que el caso vuelva a estar "Sin Asignar" (estado abierto)
            if (!"admin".equalsIgnoreCase(remitente.getRol())) {
                if (!tieneActivo) {
                    soporteAsignado = null;
                    categoria = "General";
                }
            }

            // BLINDAJE ANTI-COLISIÓN:
            // Si el remitente es un admin diferente del que está asignado, lanzar excepción
            if ("admin".equalsIgnoreCase(remitente.getRol())) {
                if (soporteAsignado != null && !soporteAsignado.getId().equals(remitenteId)) {
                     throw new ConflictException("CONFLICTO_ASIGNACION: Este chat está asignado al agente " + soporteAsignado.getNombre());
                }
                // Si el chat es "Sin Asignar" y el admin escribe, auto-asignarlo automáticamente
                if (soporteAsignado == null) {
                    soporteAsignado = remitente;
                    // Actualizar todos los mensajes anteriores de este cliente para que queden asignados
                    for (MensajeChat prev : historial) {
                        if (!"resuelto".equalsIgnoreCase(prev.getEstado())) {
                            prev.setSoporteAsignado(remitente);
                            mensajeRepository.save(prev);
                        }
                    }
                }
            }
        }

        MensajeChat msg = MensajeChat.builder()
                .viaje(viaje)
                .remitente(remitente)
                .destinatario(destinatario)
                .soporteAsignado(soporteAsignado)
                .categoria(categoria)
                .estado(estado)
                .contenido(contenido)
                .tipoReceptor(tipoReceptor != null ? tipoReceptor : "admin")
                .timestamp(LocalDateTime.now())
                .leido(false)
                .build();

        return mensajeRepository.save(msg);
    }

    /**
     * Asigna un administrador o agente de soporte a un cliente específico para la atención del ticket.
     * Si no existía una conversación activa con el cliente, genera e inyecta un mensaje automático de bienvenida.
     *
     * @param clienteId Identificador único del cliente.
     * @param soporteId Identificador único del agente de soporte (administrador).
     * @param categoria Categoría del caso de soporte (por ejemplo: pagos, reportes).
     * @throws ResourceNotFoundException Si el agente de soporte no se encuentra registrado.
     * @throws BadRequestException       Si el usuario a asignar no posee el rol de administrador.
     * @throws ConflictException         Si el caso activo ya se encuentra tomado por otro administrador de soporte.
     */
    @Override
    @Transactional
    public void asignarSoporte(Long clienteId, Long soporteId, String categoria) {
        List<MensajeChat> chats = mensajeRepository.getHistorialSoporteCliente(clienteId);
        Usuario soporte = usuarioRepository.findById(soporteId)
                .orElseThrow(() -> new ResourceNotFoundException("Administrador de soporte no encontrado"));

        if (!"admin".equalsIgnoreCase(soporte.getRol())) {
            throw new BadRequestException("El usuario asignado debe ser un administrador");
        }

        // Verificar si ya está asignado a otro administrador en los mensajes activos
        for (MensajeChat m : chats) {
            if (!"resuelto".equalsIgnoreCase(m.getEstado()) && m.getSoporteAsignado() != null && !m.getSoporteAsignado().getId().equals(soporteId)) {
                throw new ConflictException("CONFLICTO_ASIGNACION: El caso ya ha sido tomado por otro agente: " + m.getSoporteAsignado().getNombre());
            }
        }

        // Asignar en todos los mensajes anteriores activos
        for (MensajeChat m : chats) {
            if (!"resuelto".equalsIgnoreCase(m.getEstado())) {
                m.setSoporteAsignado(soporte);
                if (categoria != null) {
                    m.setCategoria(categoria);
                }
                mensajeRepository.save(m);
            }
        }

        // Si no había mensajes activos, crear un mensaje inicial del sistema
        boolean tieneActivo = chats.stream().anyMatch(c -> !"resuelto".equalsIgnoreCase(c.getEstado()));
        if (!tieneActivo) {
            MensajeChat msgInicial = MensajeChat.builder()
                    .remitente(soporte)
                    .destinatario(usuarioRepository.findById(clienteId).orElse(null))
                    .soporteAsignado(soporte)
                    .categoria(categoria != null ? categoria : "General")
                    .estado("abierto")
                    .contenido("Hola, mi nombre es " + soporte.getNombre() + " y estaré a cargo de tu soporte hoy. ¿En qué te puedo ayudar?")
                    .tipoReceptor("admin")
                    .timestamp(LocalDateTime.now())
                    .leido(true)
                    .build();
            mensajeRepository.save(msgInicial);
        }
    }

    /**
     * Resuelve de manera transaccional un caso de soporte activo archivando y marcando todos
     * los mensajes de chat asociados al cliente con el estado "resuelto", insertando además
     * un mensaje de sistema para dejar constancia de la resolución.
     *
     * @param clienteId Identificador único del cliente cuyo caso de soporte se cerrará.
     * @param adminId   Identificador único del administrador que resuelve el caso.
     * @return El mensaje de chat de sistema creado para registrar la resolución.
     */
    @Override
    @Transactional
    public MensajeChat resolverCaso(Long clienteId, Long adminId) {
        List<MensajeChat> chats = mensajeRepository.getHistorialSoporteCliente(clienteId);
        Usuario admin = usuarioRepository.findById(adminId)
                .orElseThrow(() -> new ResourceNotFoundException("Administrador de soporte no encontrado"));

        for (MensajeChat m : chats) {
            m.setEstado("resuelto");
            mensajeRepository.save(m);
        }

        MensajeChat resMsg = MensajeChat.builder()
                .remitente(admin)
                .destinatario(usuarioRepository.findById(clienteId).orElse(null))
                .soporteAsignado(admin)
                .categoria("General")
                .estado("resuelto")
                .contenido("SISTEMA_RESOLUCION: Caso resuelto por " + admin.getNombre())
                .tipoReceptor("admin")
                .timestamp(LocalDateTime.now())
                .leido(true)
                .build();

        return mensajeRepository.save(resMsg);
    }

    /**
     * Obtiene todo el historial de chat de un viaje particular ordenado cronológicamente.
     *
     * @param viajeId Identificador único del viaje.
     * @return Lista de {@link MensajeChat} de dicho viaje.
     */
    @Override
    public List<MensajeChat> getHistorialPorViaje(Long viajeId) {
        return mensajeRepository.findByViajeIdOrderByTimestampAsc(viajeId);
    }

    /**
     * Obtiene el historial de mensajes bidireccional entre dos usuarios específicos.
     *
     * @param userId1 Identificador del primer participante del chat.
     * @param userId2 Identificador del segundo participante del chat.
     * @return Lista de {@link MensajeChat} compartidos.
     */
    @Override
    public List<MensajeChat> getHistorialEntreUsuarios(Long userId1, Long userId2) {
        return mensajeRepository.getChatHistoryBetweenUsers(userId1, userId2);
    }

    /**
     * Obtiene el historial de mensajes del canal de soporte asociado a un cliente específico.
     *
     * @param clienteId Identificador único del cliente.
     * @return Lista de {@link MensajeChat} correspondientes a los chats de soporte de dicho cliente.
     */
    @Override
    public List<MensajeChat> getHistorialSoporteCliente(Long clienteId) {
        return mensajeRepository.getHistorialSoporteCliente(clienteId);
    }

    /**
     * Marca un conjunto de mensajes como leídos de forma masiva en la base de datos.
     *
     * @param mensajeIds Lista de identificadores de mensajes a marcar como leídos.
     */
    @Override
    @Transactional
    public void marcarComoLeidos(List<Long> mensajeIds) {
        List<MensajeChat> mensajes = mensajeRepository.findAllById(mensajeIds);
        mensajes.forEach(m -> m.setLeido(true));
        mensajeRepository.saveAll(mensajes);
    }
}

