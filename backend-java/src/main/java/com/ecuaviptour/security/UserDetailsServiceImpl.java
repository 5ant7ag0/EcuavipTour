package com.ecuaviptour.security;

import com.ecuaviptour.modules.users.domain.Usuario;
import com.ecuaviptour.modules.users.repository.UsuarioRepository;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;

import java.util.Collections;

/**
 * Servicio para cargar los detalles del usuario desde la base de datos PostgreSQL
 * para los procesos de autenticación y autorización de Spring Security.
 */
@Service
public class UserDetailsServiceImpl implements UserDetailsService {

    private final UsuarioRepository usuarioRepository;

    public UserDetailsServiceImpl(UsuarioRepository usuarioRepository) {
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario u;
        try {
            Long userId = Long.parseLong(username);
            u = usuarioRepository.findById(userId)
                    .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con ID: " + username));
        } catch (NumberFormatException e) {
            u = usuarioRepository.findByCorreo(username)
                    .orElseThrow(() -> new UsernameNotFoundException("Usuario no encontrado con correo: " + username));
        }

        String role = u.getRol() != null ? u.getRol() : "cliente";
        return new User(
                String.valueOf(u.getId()),
                u.getPasswordHash() != null ? u.getPasswordHash() : "",
                Collections.singletonList(new SimpleGrantedAuthority("ROLE_" + role))
        );
    }
}
