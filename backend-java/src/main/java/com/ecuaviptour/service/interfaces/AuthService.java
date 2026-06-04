package com.ecuaviptour.service.interfaces;

import com.ecuaviptour.model.Usuario;
import java.util.Optional;

public interface AuthService {
    
    Usuario register(Usuario usuario);
    
    String login(String correo, String password);
    
    Optional<Usuario> getUsuarioById(Long id);
    
    Usuario updateProfile(Long userId, String nombre, String telefono, String fotoPerfilUrl);
    
    Usuario updateProfile(Long userId, String nombre, String telefono, String fotoPerfilUrl, String cedula, String password);
    
    Usuario updateProfile(Long userId, String nombre, String telefono, String fotoPerfilUrl, String cedula, String password, String correo);
}
