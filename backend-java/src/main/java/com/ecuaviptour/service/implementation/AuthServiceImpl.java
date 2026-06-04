package com.ecuaviptour.service.implementation;

import com.ecuaviptour.model.Usuario;
import com.ecuaviptour.repository.UsuarioRepository;
import com.ecuaviptour.service.interfaces.AuthService;
import com.ecuaviptour.util.JwtUtil;
import com.ecuaviptour.exception.*;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
public class AuthServiceImpl implements AuthService {

    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;
    private final BCryptPasswordEncoder passwordEncoder;

    public AuthServiceImpl(UsuarioRepository usuarioRepository, JwtUtil jwtUtil) {
        this.usuarioRepository = usuarioRepository;
        this.jwtUtil = jwtUtil;
        this.passwordEncoder = new BCryptPasswordEncoder();
    }

    @Override
    @Transactional
    public Usuario register(Usuario usuario) {
        if (usuarioRepository.findByCorreo(usuario.getCorreo()).isPresent()) {
            throw new ConflictException("El correo ya está registrado en el sistema.");
        }
        if (usuario.getCedula() != null && usuarioRepository.findByCedula(usuario.getCedula()).isPresent()) {
            throw new ConflictException("La cédula ya está registrada en el sistema.");
        }

        // Hashing password using BCrypt
        usuario.setPasswordHash(passwordEncoder.encode(usuario.getPasswordHash()));
        return usuarioRepository.save(usuario);
    }

    @Override
    public String login(String correo, String password) {
        Usuario usuario = usuarioRepository.findByCorreo(correo)
                .orElseThrow(() -> new UnauthorizedException("Credenciales incorrectas: correo no registrado."));

        boolean isCorrect = false;
        if (usuario.getPasswordHash() != null && usuario.getPasswordHash().startsWith("scrypt:")) {
            isCorrect = verifyWerkzeugScrypt(password, usuario.getPasswordHash());
        } else {
            isCorrect = passwordEncoder.matches(password, usuario.getPasswordHash());
            if (!isCorrect) {
                isCorrect = password.equals(usuario.getPasswordHash());
            }
        }

        if (!isCorrect) {
            throw new UnauthorizedException("Credenciales incorrectas: contraseña inválida.");
        }

        // Return JWT Token with same claims as Python Flask API
        return jwtUtil.generateToken(usuario.getCorreo(), usuario.getId(), usuario.getRol());
    }

    private boolean verifyWerkzeugScrypt(String password, String hashed) {
        try {
            if (hashed == null || !hashed.startsWith("scrypt:")) {
                return false;
            }

            String[] parts = hashed.split("\\$");
            if (parts.length < 3) {
                return false;
            }

            // Format: scrypt:32768:8:1
            String[] params = parts[0].split(":");
            if (params.length < 4) {
                return false;
            }

            int N = Integer.parseInt(params[1]);
            int r = Integer.parseInt(params[2]);
            int p = Integer.parseInt(params[3]);

            String salt = parts[1];
            String hexHash = parts[2];
            int dkLen = hexHash.length() / 2;

            byte[] derivedKey = org.bouncycastle.crypto.generators.SCrypt.generate(
                    password.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                    salt.getBytes(java.nio.charset.StandardCharsets.UTF_8),
                    N, r, p, dkLen
            );

            StringBuilder sb = new StringBuilder();
            for (byte b : derivedKey) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) {
                    sb.append('0');
                }
                sb.append(hex);
            }

            return sb.toString().equals(hexHash);
        } catch (Exception e) {
            System.err.println("Error verifying Werkzeug scrypt hash: " + e.getMessage());
            return false;
        }
    }

    @Override
    public Optional<Usuario> getUsuarioById(Long id) {
        return usuarioRepository.findById(id);
    }

    @Override
    @Transactional
    public Usuario updateProfile(Long userId, String nombre, String telefono, String fotoPerfilUrl) {
        return updateProfile(userId, nombre, telefono, fotoPerfilUrl, null, null, null);
    }

    @Override
    @Transactional
    public Usuario updateProfile(Long userId, String nombre, String telefono, String fotoPerfilUrl, String cedula, String password) {
        return updateProfile(userId, nombre, telefono, fotoPerfilUrl, cedula, password, null);
    }

    @Override
    @Transactional
    public Usuario updateProfile(Long userId, String nombre, String telefono, String fotoPerfilUrl, String cedula, String password, String correo) {
        Usuario u = usuarioRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado."));
        if (nombre != null) u.setNombre(nombre);
        if (telefono != null) u.setTelefono(telefono);
        if (fotoPerfilUrl != null) u.setFotoPerfilUrl(fotoPerfilUrl);

        if (cedula != null) {
            String trimmed = cedula.trim();
            u.setCedula(trimmed.isBlank() || "No Registrada".equalsIgnoreCase(trimmed) ? null : trimmed);
        }
        if (correo != null && !correo.trim().isBlank()) {
            u.setCorreo(correo.trim());
        }
        if (password != null && !password.isBlank()) {
            u.setPasswordHash(passwordEncoder.encode(password));
        }
        return usuarioRepository.save(u);
    }
}
