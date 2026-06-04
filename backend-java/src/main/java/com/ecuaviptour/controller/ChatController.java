package com.ecuaviptour.controller;

import com.ecuaviptour.model.MensajeChat;
import com.ecuaviptour.model.Usuario;
import com.ecuaviptour.service.interfaces.ChatService;
import com.ecuaviptour.dto.MensajeChatDTO;
import com.ecuaviptour.mapper.MensajeChatMapper;
import com.ecuaviptour.exception.*;
import java.util.stream.Collectors;
import com.ecuaviptour.repository.UsuarioRepository;
import com.ecuaviptour.repository.MensajeRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import java.util.*;

import com.ecuaviptour.service.interfaces.SocketIOService;

@RestController
@RequestMapping("/api/chat")
public class ChatController {

    private final ChatService chatService;
    private final UsuarioRepository usuarioRepository;
    private final MensajeRepository mensajeRepository;
    private final SocketIOService socketIOService;
    private final MensajeChatMapper mensajeChatMapper;

    public ChatController(ChatService chatService, 
                          UsuarioRepository usuarioRepository, 
                          MensajeRepository mensajeRepository,
                          SocketIOService socketIOService,
                          MensajeChatMapper mensajeChatMapper) {
        this.chatService = chatService;
        this.usuarioRepository = usuarioRepository;
        this.mensajeRepository = mensajeRepository;
        this.socketIOService = socketIOService;
        this.mensajeChatMapper = mensajeChatMapper;
    }

    @GetMapping("/history/{targetId}")
    @Transactional
    public ResponseEntity<List<MensajeChatDTO>> getHistory(
            @PathVariable Long targetId,
            @RequestParam(value = "viaje_id", required = false) Long viajeId,
            @RequestParam(value = "tipo_receptor", defaultValue = "admin") String tipoReceptor) {

        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        List<MensajeChat> list;
        if ("chofer".equalsIgnoreCase(tipoReceptor) && viajeId != null) {
            list = chatService.getHistorialPorViaje(viajeId);
        } else {
            // Support chat: load all support messages involving this client
            Long clienteId = "admin".equalsIgnoreCase(user.getRol()) ? targetId : user.getId();
            list = chatService.getHistorialSoporteCliente(clienteId);
        }

        // Implicitly mark support messages as read if the recipient fetches them
        for (MensajeChat m : list) {
            if (m.getRemitente() != null && !m.getRemitente().getId().equals(user.getId()) && !m.getLeido()) {
                m.setLeido(true);
                mensajeRepository.save(m);
            }
        }

        List<MensajeChatDTO> dtoList = list.stream()
                .map(mensajeChatMapper::toDTO)
                .collect(Collectors.toList());
        return ResponseEntity.ok(dtoList);
    }


    @PostMapping("/mark_read/{otroId}")
    public ResponseEntity<Map<String, Object>> markRead(@PathVariable Long otroId) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        List<MensajeChat> history = chatService.getHistorialEntreUsuarios(user.getId(), otroId);
        boolean updated = false;
        for (MensajeChat m : history) {
            if (m.getRemitente() != null && m.getRemitente().getId().equals(otroId) && !m.getLeido()) {
                m.setLeido(true);
                mensajeRepository.save(m);
                updated = true;
            }
        }

        return ResponseEntity.ok(Map.of(
                "message", "Mensajes marcados como leídos",
                "updated", updated
        ));
    }

    @GetMapping("/admin-info")
    public ResponseEntity<Map<String, Object>> getAdminInfo() {
        Optional<Usuario> admin = usuarioRepository.findAll().stream()
                .filter(u -> "admin".equalsIgnoreCase(u.getRol()))
                .findFirst();

        Map<String, Object> map = new HashMap<>();
        if (admin.isPresent()) {
            map.put("admin_id", admin.get().getId());
            map.put("admin_nombre", admin.get().getNombre());
        } else {
            map.put("admin_id", 1L);
            map.put("admin_nombre", "Soporte Ecuavip");
        }
        return ResponseEntity.ok(map);
    }

    @PostMapping("/assign/{clienteId}")
    public ResponseEntity<Map<String, Object>> assignSupport(
            @PathVariable Long clienteId,
            @RequestBody Map<String, String> payload) {
        
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Long adminId = Long.parseLong(userIdStr);
        String categoria = payload.get("categoria");

        try {
            chatService.asignarSoporte(clienteId, adminId, categoria);
            
            // Broadcast real-time support assignment event
            Usuario supportAgent = usuarioRepository.findById(adminId)
                    .orElseThrow(() -> new ResourceNotFoundException("Agente de soporte no encontrado con el ID: " + adminId));
            socketIOService.broadcastSupportAssign(
                    clienteId,
                    categoria,
                    supportAgent.getId(),
                    supportAgent.getNombre(),
                    supportAgent.getFotoPerfilUrl()
            );

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Chat asignado correctamente"
            ));
        } catch (IllegalStateException e) {
            return ResponseEntity.status(409).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).body(Map.of(
                    "success", false,
                    "error", e.getMessage()
            ));
        }
    }

    @PostMapping("/resolve/{clienteId}")
    public ResponseEntity<Map<String, Object>> resolveCase(@PathVariable Long clienteId) {
        try {
            chatService.resolverCaso(clienteId);
            
            // Broadcast real-time case resolution event
            socketIOService.broadcastCaseResolve(clienteId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Conversación marcada como resuelta"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                    "success", false,
                    "error", "No se pudo resolver el caso: " + e.getMessage()
            ));
        }
    }
}
