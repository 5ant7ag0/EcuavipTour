package com.ecuaviptour.mapper;

import com.ecuaviptour.dto.UsuarioDTO;
import com.ecuaviptour.model.Usuario;
import org.springframework.stereotype.Component;

@Component
public class UsuarioMapper {
    
    public UsuarioDTO toDTO(Usuario entity) {
        if (entity == null) {
            return null;
        }
        return new UsuarioDTO(
                entity.getId(),
                entity.getNombre(),
                entity.getCorreo(),
                entity.getTelefono(),
                entity.getCedula(),
                entity.getFotoPerfilUrl(),
                entity.getRol(),
                entity.getActivo(),
                entity.getFechaRegistro()
        );
    }

    public Usuario toEntity(UsuarioDTO dto) {
        if (dto == null) {
            return null;
        }
        return Usuario.builder()
                .id(dto.getId())
                .nombre(dto.getNombre())
                .correo(dto.getCorreo())
                .telefono(dto.getTelefono())
                .cedula(dto.getCedula())
                .fotoPerfilUrl(dto.getFotoPerfilUrl())
                .rol(dto.getRol())
                .activo(dto.getActivo())
                .fechaRegistro(dto.getFechaRegistro())
                .build();
    }
}
