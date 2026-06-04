package com.ecuaviptour.controller;

import com.ecuaviptour.model.Usuario;
import com.ecuaviptour.service.interfaces.AuthService;
import com.ecuaviptour.repository.UsuarioRepository;
import com.ecuaviptour.dto.UsuarioDTO;
import com.ecuaviptour.mapper.UsuarioMapper;
import com.ecuaviptour.exception.ResourceNotFoundException;
import com.ecuaviptour.exception.UnauthorizedException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import com.ecuaviptour.util.JwtUtil;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;
    private final UsuarioMapper usuarioMapper;

    public AuthController(AuthService authService, UsuarioRepository usuarioRepository, JwtUtil jwtUtil, UsuarioMapper usuarioMapper) {
        this.authService = authService;
        this.usuarioRepository = usuarioRepository;
        this.jwtUtil = jwtUtil;
        this.usuarioMapper = usuarioMapper;
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody Usuario usuario) {
        Usuario registeredUser = authService.register(usuario);
        String token = jwtUtil.generateToken(registeredUser.getCorreo(), registeredUser.getId(), registeredUser.getRol());
        
        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Usuario registrado exitosamente");
        response.put("token", token);
        
        response.put("usuario", usuarioMapper.toDTO(registeredUser));
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/login")
    public ResponseEntity<Map<String, Object>> login(@RequestBody Map<String, String> credentials) {
        String token = authService.login(credentials.get("correo"), credentials.get("password"));
        
        Usuario user = usuarioRepository.findByCorreo(credentials.get("correo"))
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con correo: " + credentials.get("correo")));
        Map<String, Object> response = new HashMap<>();
        response.put("token", token);
        response.put("mensaje", "Login exitoso");
        
        response.put("usuario", usuarioMapper.toDTO(user));
        return ResponseEntity.ok(response);
    }

    @PostMapping("/update-profile")
    public ResponseEntity<Map<String, Object>> updateProfile(@RequestBody Map<String, String> data) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        Usuario updated = authService.updateProfile(
                user.getId(), 
                data.get("nombre"), 
                data.get("telefono"), 
                data.get("foto_perfil_url"), 
                data.get("cedula"), 
                data.get("password"),
                data.get("correo")
        );
        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Perfil actualizado correctamente");
        
        response.put("usuario", usuarioMapper.toDTO(updated));
        
        return ResponseEntity.ok(response);
    }

    @PostMapping("/upload-avatar")
    public ResponseEntity<Map<String, Object>> uploadAvatar(@RequestParam("foto") MultipartFile file) throws IOException {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

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
        Usuario updated = authService.updateProfile(user.getId(), null, null, avatarUrl, null, null);

        Map<String, Object> response = new HashMap<>();
        response.put("mensaje", "Foto de perfil actualizada correctamente");
        response.put("foto_perfil_url", updated.getFotoPerfilUrl());
        
        response.put("usuario", usuarioMapper.toDTO(updated));
        
        return ResponseEntity.ok(response);
    }
}
