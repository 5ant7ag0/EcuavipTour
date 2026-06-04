package com.ecuaviptour.service.implementation;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.ecuaviptour.model.MensajeChat;
import com.ecuaviptour.model.Usuario;
import com.ecuaviptour.model.Viaje;
import com.ecuaviptour.model.Vehiculo;
import com.ecuaviptour.repository.UsuarioRepository;
import com.ecuaviptour.repository.ViajeRepository;
import com.ecuaviptour.repository.VehiculoRepository;
import com.ecuaviptour.service.interfaces.SocketIOService;
import com.ecuaviptour.service.interfaces.ChatService;
import org.springframework.stereotype.Service;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.util.*;

@Service
public class SocketIOServiceImpl implements SocketIOService {

    private final SocketIOServer server;
    private final ChatService chatService;
    private final ViajeRepository viajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final VehiculoRepository vehiculoRepository;

    public SocketIOServiceImpl(SocketIOServer server, 
                               ChatService chatService, 
                               ViajeRepository viajeRepository, 
                               UsuarioRepository usuarioRepository,
                               VehiculoRepository vehiculoRepository) {
        this.server = server;
        this.chatService = chatService;
        this.viajeRepository = viajeRepository;
        this.usuarioRepository = usuarioRepository;
        this.vehiculoRepository = vehiculoRepository;
    }

    @Override
    @PostConstruct
    public void startServer() {
        // Connect Listener
        server.addConnectListener(client -> {
            System.out.println("[Socket.IO] Nuevo cliente conectado sid: " + client.getSessionId());
            client.sendEvent("server_message", Map.of("data", "Conexión Socket.IO exitosa con Spring Boot"));
        });

        // Disconnect Listener
        server.addDisconnectListener(client -> {
            System.out.println("[Socket.IO] Cliente desconectado sid: " + client.getSessionId());
        });

        // Event: join
        server.addEventListener("join", Map.class, (client, data, ackSender) -> {
            String role = data.get("role") != null ? data.get("role").toString().toLowerCase() : "";
            Object userIdObj = data.get("user_id");
            Long userId = userIdObj != null ? Long.parseLong(userIdObj.toString()) : null;

            System.out.println("[Socket.IO JOIN] role=" + role + " user_id=" + userId + " sid=" + client.getSessionId());

            if ("admin".equals(role)) {
                client.joinRoom("admins");
                System.out.println("   -> Usuario " + userId + " unido a sala 'admins'");
            } else if ("cliente".equals(role) && userId != null) {
                String room = "cliente_" + userId;
                client.joinRoom(room);
                System.out.println("   -> Usuario " + userId + " unido a sala '" + room + "'");
            } else if ("chofer".equals(role)) {
                client.joinRoom("choferes");
                if (userId != null) {
                    String room = "chofer_" + userId;
                    client.joinRoom(room);
                    System.out.println("   -> Chofer " + userId + " unido a sala '" + room + "'");
                }
                
                // Broadcast available trips to this new driver
                List<Viaje> viajesPendientes = viajeRepository.findByEstadoLogisticoOrderByIdDesc("buscando_chofer");
                for (Viaje v : viajesPendientes) {
                    Map<String, Object> payload = new HashMap<>();
                    payload.put("viaje_id", v.getId());
                    
                    Long clienteId = v.getCliente() != null ? v.getCliente().getId() : null;
                    payload.put("cliente_id", clienteId);
                    
                    String nombreCliente = "Cliente VIP";
                    String fotoClienteUrl = "";
                    if (clienteId != null) {
                        Optional<Usuario> clienteOpt = usuarioRepository.findById(clienteId);
                        if (clienteOpt.isPresent()) {
                            Usuario cliente = clienteOpt.get();
                            nombreCliente = cliente.getNombre();
                            fotoClienteUrl = cliente.getFotoPerfilUrl() != null ? cliente.getFotoPerfilUrl() : "";
                        }
                    }
                    payload.put("nombre_cliente", nombreCliente);
                    payload.put("foto_cliente_url", fotoClienteUrl);
                    
                    payload.put("origen", v.getDirOrigen());
                    payload.put("destino", v.getDirDestino());
                    payload.put("tarifa", v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0);
                    payload.put("tipo_servicio", v.getTipoServicio() != null ? v.getTipoServicio() : "");
                    
                    client.sendEvent("nuevo_viaje_disponible", payload);
                }
            }
        });

        // Event: enviar_mensaje
        server.addEventListener("enviar_mensaje", Map.class, (client, data, ackSender) -> {
            try {
                Object vIdObj = data.get("viaje_id");
                Long viajeId = vIdObj != null ? Long.parseLong(vIdObj.toString()) : null;
                Long remitenteId = Long.parseLong(data.get("remitente_id").toString());
                Object destIdObj = data.get("destinatario_id");
                Long destinatarioId = destIdObj != null ? Long.parseLong(destIdObj.toString()) : null;
                String contenido = (String) data.get("contenido");
                String tipoReceptor = (String) data.get("tipo_receptor");

                MensajeChat msg = chatService.enviarMensaje(viajeId, remitenteId, destinatarioId, contenido, tipoReceptor);
                
                Map<String, Object> messageDict = new HashMap<>();
                messageDict.put("id", msg.getId());
                messageDict.put("viaje_id", viajeId);
                messageDict.put("remitente_id", remitenteId);
                messageDict.put("destinatario_id", destinatarioId);
                messageDict.put("tipo_receptor", msg.getTipoReceptor());
                messageDict.put("contenido", msg.getContenido());
                messageDict.put("timestamp", msg.getTimestamp().toString());
                messageDict.put("estado", msg.getEstado());
                messageDict.put("categoria", msg.getCategoria());
                
                if (msg.getSoporteAsignado() != null) {
                    messageDict.put("soporteAsignado", Map.of(
                            "id", msg.getSoporteAsignado().getId(),
                            "nombre", msg.getSoporteAsignado().getNombre(),
                            "fotoPerfilUrl", msg.getSoporteAsignado().getFotoPerfilUrl() != null ? msg.getSoporteAsignado().getFotoPerfilUrl() : ""
                    ));
                }

                if (viajeId != null) {
                    Optional<Viaje> viajeOpt = viajeRepository.findById(viajeId);
                    if (viajeOpt.isPresent()) {
                        Viaje v = viajeOpt.get();
                        
                        // Si es chat de chofer para este viaje
                        if ("chofer".equalsIgnoreCase(tipoReceptor)) {
                            // Enviar a la sala específica de este viaje para cliente y chofer
                            server.getRoomOperations("cliente_" + v.getCliente().getId()).sendEvent("nuevo_mensaje", messageDict);
                            if (v.getChofer() != null) {
                                server.getRoomOperations("chofer_" + v.getChofer().getId()).sendEvent("nuevo_mensaje", messageDict);
                            }
                        } else {
                            // Support Chat: remitente o destinatario es el cliente
                            Long resolvedDestinatarioId = destinatarioId;
                            if (resolvedDestinatarioId == null) {
                                resolvedDestinatarioId = "admin".equalsIgnoreCase(msg.getRemitente().getRol()) ? msg.getDestinatario().getId() : msg.getRemitente().getId();
                            }
                            
                            messageDict.put("destinatario_id", resolvedDestinatarioId);
                            
                            server.getRoomOperations("cliente_" + v.getCliente().getId()).sendEvent("nuevo_mensaje", messageDict);
                            if (v.getChofer() != null) {
                                server.getRoomOperations("chofer_" + v.getChofer().getId()).sendEvent("nuevo_mensaje", messageDict);
                            }
                        }
                    } else if (destinatarioId != null) {
                        // Fallback direct chat
                        server.getRoomOperations("cliente_" + destinatarioId).sendEvent("nuevo_mensaje", messageDict);
                        server.getRoomOperations("chofer_" + destinatarioId).sendEvent("nuevo_mensaje", messageDict);
                        server.getRoomOperations("cliente_" + remitenteId).sendEvent("nuevo_mensaje", messageDict);
                        server.getRoomOperations("chofer_" + remitenteId).sendEvent("nuevo_mensaje", messageDict);
                    }
                } else {
                    // Support Chat (Admin <-> Client)
                    Optional<Usuario> remitenteOpt = usuarioRepository.findById(remitenteId);
                    if (remitenteOpt.isPresent() && "admin".equalsIgnoreCase(remitenteOpt.get().getRol())) {
                        // Admin replies -> send to specific client and all admins
                        if (destinatarioId != null) {
                            server.getRoomOperations("cliente_" + destinatarioId).sendEvent("nuevo_mensaje", messageDict);
                        }
                        server.getRoomOperations("admins").sendEvent("nuevo_mensaje", messageDict);
                    } else {
                        // Client writes -> send to admins and back to client
                        server.getRoomOperations("admins").sendEvent("nuevo_mensaje", messageDict);
                        server.getRoomOperations("cliente_" + remitenteId).sendEvent("nuevo_mensaje", messageDict);
                    }
                }
            } catch (IllegalStateException e) {
                client.sendEvent("error_mensaje", Map.of("error", e.getMessage()));
            }
        });

        // Event: aceptar_viaje
        server.addEventListener("aceptar_viaje", Map.class, (client, data, ackSender) -> {
            Long viajeId = Long.parseLong(data.get("viaje_id").toString());
            Long choferId = Long.parseLong(data.get("chofer_id").toString());

            Optional<Viaje> viajeOpt = viajeRepository.findById(viajeId);
            if (viajeOpt.isPresent()) {
                Viaje v = viajeOpt.get();
                if (v.getChofer() == null && "buscando_chofer".equalsIgnoreCase(v.getEstadoLogistico())) {
                    Optional<Usuario> choferOpt = usuarioRepository.findById(choferId);
                    if (choferOpt.isPresent()) {
                        Usuario chofer = choferOpt.get();
                        v.setChofer(chofer);
                        v.setEstadoLogistico("aceptado");

                        Optional<Vehiculo> vehOpt = vehiculoRepository.findByChoferId(choferId);
                        if (vehOpt.isPresent()) {
                            v.setVehiculo(vehOpt.get());
                        }
                        viajeRepository.save(v);

                        // Broadcast that this trip has been taken to all other drivers
                        server.getRoomOperations("choferes").sendEvent("viaje_ya_tomado", Map.of(
                                "viaje_id", viajeId,
                                "chofer_id", choferId,
                                "mensaje", "Lo sentimos, este viaje ya fue aceptado por otro chofer."
                        ));

                        client.sendEvent("viaje_confirmado_chofer", Map.of(
                                "viaje_id", viajeId,
                                "mensaje", "¡Viaje asignado con éxito!"
                        ));

                        Map<String, Object> choferAsignadoPayload = new HashMap<>();
                        choferAsignadoPayload.put("viaje_id", viajeId);
                        choferAsignadoPayload.put("chofer_id", choferId);
                        choferAsignadoPayload.put("nombre_chofer", chofer.getNombre());
                        choferAsignadoPayload.put("estado", "aceptado");
                        choferAsignadoPayload.put("foto_chofer_url", chofer.getFotoPerfilUrl());

                        if (vehOpt.isPresent()) {
                            Vehiculo veh = vehOpt.get();
                            choferAsignadoPayload.put("vehiculo", Map.of(
                                    "placa", veh.getPlaca() != null ? veh.getPlaca() : "",
                                    "marca", veh.getMarca() != null ? veh.getMarca() : "",
                                    "modelo", veh.getModelo() != null ? veh.getModelo() : "",
                                    "tipo", veh.getTipoVehiculo() != null ? veh.getTipoVehiculo() : "",
                                    "foto_auto_url", veh.getFotoAutoUrl() != null ? veh.getFotoAutoUrl() : ""
                            ));
                        } else {
                            choferAsignadoPayload.put("vehiculo", null);
                        }

                        server.getRoomOperations("cliente_" + v.getCliente().getId()).sendEvent("chofer_asignado", choferAsignadoPayload);

                        server.getRoomOperations("admins").sendEvent("viaje_actualizado_admin", Map.of(
                                "viaje_id", viajeId,
                                "estado", "aceptado"
                        ));
                    }
                } else {
                    client.sendEvent("viaje_ya_tomado", Map.of("mensaje", "Lo sentimos, este viaje ya fue aceptado por otro chofer."));
                }
            }
        });

        // Event: actualizar_ubicacion_chofer
        server.addEventListener("actualizar_ubicacion_chofer", Map.class, (client, data, ackSender) -> {
            Long viajeId = Long.parseLong(data.get("viaje_id").toString());
            Object lat = data.get("lat");
            Object lng = data.get("lng");

            Optional<Viaje> viajeOpt = viajeRepository.findById(viajeId);
            if (viajeOpt.isPresent()) {
                server.getRoomOperations("cliente_" + viajeOpt.get().getCliente().getId())
                        .sendEvent("ubicacion_chofer_actualizada", Map.of("lat", lat, "lng", lng));
            }
        });

        // Event: llegada_origen
        server.addEventListener("llegada_origen", Map.class, (client, data, ackSender) -> {
            Long viajeId = Long.parseLong(data.get("viaje_id").toString());
            Optional<Viaje> viajeOpt = viajeRepository.findById(viajeId);
            if (viajeOpt.isPresent()) {
                Viaje v = viajeOpt.get();
                v.setEstadoLogistico("esperando_cliente");
                viajeRepository.save(v);

                server.getRoomOperations("cliente_" + v.getCliente().getId()).sendEvent("chofer_en_punto", Map.of(
                        "viaje_id", viajeId,
                        "mensaje", "El chofer ha llegado al punto de inicio"
                ));

                server.getRoomOperations("admins").sendEvent("viaje_actualizado_admin", Map.of(
                        "viaje_id", viajeId,
                        "estado", "esperando_cliente"
                ));
            }
        });

        // Event: finalizar_viaje
        server.addEventListener("finalizar_viaje", Map.class, (client, data, ackSender) -> {
            Long viajeId = Long.parseLong(data.get("viaje_id").toString());
            Optional<Viaje> viajeOpt = viajeRepository.findById(viajeId);
            if (viajeOpt.isPresent()) {
                Viaje v = viajeOpt.get();
                v.setEstadoLogistico("finalizado");
                viajeRepository.save(v);

                server.getRoomOperations("cliente_" + v.getCliente().getId()).sendEvent("viaje_finalizado", Map.of(
                        "viaje_id", viajeId
                ));

                server.getRoomOperations("admins").sendEvent("viaje_actualizado_admin", Map.of(
                        "viaje_id", viajeId,
                        "estado", "finalizado"
                ));
            }
        });

        // Start the Socket.IO server asynchronously
        try {
            server.start();
            System.out.println("[Socket.IO] Servidor iniciado exitosamente en puerto: " + server.getConfiguration().getPort());
        } catch (Exception e) {
            System.err.println("[Socket.IO ERROR] Fallo al iniciar servidor Socket.IO: " + e.getMessage());
        }
    }

    @Override
    public void broadcastSupportAssign(Long clienteId, String categoria, Long soporteId, String soporteNombre, String soporteAvatar) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("cliente_id", clienteId);
        payload.put("categoria", categoria != null ? categoria : "General");
        payload.put("soporte_asignado_id", soporteId);
        payload.put("soporte_asignado_nombre", soporteNombre != null ? soporteNombre : "");
        payload.put("soporte_asignado_avatar", soporteAvatar != null ? soporteAvatar : "");

        try {
            server.getRoomOperations("admins").sendEvent("soporte_asignado", payload);
            server.getRoomOperations("cliente_" + clienteId).sendEvent("soporte_asignado", payload);
            System.out.println("[Socket.IO] Emitido 'soporte_asignado' para cliente " + clienteId);
        } catch (Exception e) {
            System.err.println("[Socket.IO ERROR] Fallo al emitir 'soporte_asignado': " + e.getMessage());
        }
    }

    @Override
    public void broadcastCaseResolve(Long clienteId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("cliente_id", clienteId);
        payload.put("estado", "resuelto");

        try {
            server.getRoomOperations("admins").sendEvent("caso_resuelto", payload);
            server.getRoomOperations("cliente_" + clienteId).sendEvent("caso_resuelto", payload);
            System.out.println("[Socket.IO] Emitido 'caso_resuelto' para cliente " + clienteId);
        } catch (Exception e) {
            System.err.println("[Socket.IO ERROR] Fallo al emitir 'caso_resuelto': " + e.getMessage());
        }
    }

    @Override
    public void broadcastViajeCancelado(Long viajeId, String mensaje, Long clienteId, Long choferId) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("viaje_id", viajeId);
        payload.put("mensaje", mensaje != null ? mensaje : "El viaje ha sido cancelado");

        try {
            if (clienteId != null) {
                server.getRoomOperations("cliente_" + clienteId).sendEvent("viaje_cancelado", payload);
            }
            if (choferId != null) {
                server.getRoomOperations("chofer_" + choferId).sendEvent("viaje_cancelado", payload);
            }
            Map<String, Object> adminPayload = new HashMap<>();
            adminPayload.put("viaje_id", viajeId);
            adminPayload.put("estado", "cancelado");
            server.getRoomOperations("admins").sendEvent("viaje_actualizado_admin", adminPayload);
            System.out.println("[Socket.IO] Emitido 'viaje_cancelado' para viaje " + viajeId);
        } catch (Exception e) {
            System.err.println("[Socket.IO ERROR] Fallo al emitir 'viaje_cancelado': " + e.getMessage());
        }
    }

    @Override
    public void broadcastNuevoViajeDisponible(Viaje v) {
        if (v == null) return;
        Map<String, Object> payload = new HashMap<>();
        payload.put("viaje_id", v.getId());
        
        Long clienteId = v.getCliente() != null ? v.getCliente().getId() : null;
        payload.put("cliente_id", clienteId);
        
        String nombreCliente = "Cliente VIP";
        String fotoClienteUrl = "";
        if (clienteId != null) {
            Optional<Usuario> clienteOpt = usuarioRepository.findById(clienteId);
            if (clienteOpt.isPresent()) {
                Usuario cliente = clienteOpt.get();
                nombreCliente = cliente.getNombre();
                fotoClienteUrl = cliente.getFotoPerfilUrl() != null ? cliente.getFotoPerfilUrl() : "";
            }
        }
        payload.put("nombre_cliente", nombreCliente);
        payload.put("foto_cliente_url", fotoClienteUrl);
        
        payload.put("origen", v.getDirOrigen());
        payload.put("destino", v.getDirDestino());
        payload.put("tarifa", v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0);
        payload.put("tipo_servicio", v.getTipoServicio() != null ? v.getTipoServicio() : "");

        try {
            server.getRoomOperations("choferes").sendEvent("nuevo_viaje_disponible", payload);
            System.out.println("[Socket.IO] Emitido 'nuevo_viaje_disponible' para choferes. Viaje ID: " + v.getId());
        } catch (Exception e) {
            System.err.println("[Socket.IO ERROR] Fallo al emitir 'nuevo_viaje_disponible': " + e.getMessage());
        }
    }

    @Override
    public void broadcastPagoActualizado(Long viajeId, Long clienteId, String estadoPago, String estadoLogistico) {
        Map<String, Object> payload = new HashMap<>();
        payload.put("viaje_id", viajeId);
        payload.put("estado_pago", estadoPago);
        payload.put("estado_logistico", estadoLogistico);

        try {
            if (clienteId != null) {
                server.getRoomOperations("cliente_" + clienteId).sendEvent("pago_actualizado", payload);
            }
            server.getRoomOperations("admins").sendEvent("pago_actualizado", payload);
            System.out.println("[Socket.IO] Emitido 'pago_actualizado' para cliente " + clienteId);
        } catch (Exception e) {
            System.err.println("[Socket.IO ERROR] Fallo al emitir 'pago_actualizado': " + e.getMessage());
        }
    }

    @Override
    public void broadcastNuevoComprobante(Long viajeId, Long clienteId) {
        try {
            // Broadcast pago_actualizado to notify about new review state
            Map<String, Object> payload = Map.of(
                "viaje_id", viajeId,
                "estado_pago", "comprobante_subido",
                "estado_logistico", "pendiente"
            );
            if (clienteId != null) {
                server.getRoomOperations("cliente_" + clienteId).sendEvent("pago_actualizado", payload);
            }
            server.getRoomOperations("admins").sendEvent("pago_actualizado", payload);

            // Broadcast nuevo_comprobante to trigger toast and lists reload in admin console
            server.getRoomOperations("admins").sendEvent("nuevo_comprobante", Map.of(
                "viaje_id", viajeId,
                "cliente_id", clienteId != null ? clienteId : 0L
            ));
            System.out.println("[Socket.IO] Emitido 'nuevo_comprobante' y 'pago_actualizado' para viaje " + viajeId);
        } catch (Exception e) {
            System.err.println("[Socket.IO ERROR] Fallo al emitir nuevo comprobante: " + e.getMessage());
        }
    }

    @Override
    @PreDestroy
    public void stopServer() {
        if (server != null) {
            server.stop();
            System.out.println("[Socket.IO] Servidor Socket.IO detenido.");
        }
    }
}
