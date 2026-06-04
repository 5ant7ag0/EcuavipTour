package com.ecuaviptour.mapper;

import com.ecuaviptour.dto.CalificacionDTO;
import com.ecuaviptour.model.Calificacion;
import org.springframework.stereotype.Component;

@Component
public class CalificacionMapper {

    private final ViajeMapper viajeMapper;
    private final UsuarioMapper usuarioMapper;

    public CalificacionMapper(ViajeMapper viajeMapper, UsuarioMapper usuarioMapper) {
        this.viajeMapper = viajeMapper;
        this.usuarioMapper = usuarioMapper;
    }

    public CalificacionDTO toDTO(Calificacion entity) {
        if (entity == null) {
            return null;
        }
        return new CalificacionDTO(
                entity.getId(),
                viajeMapper.toDTO(entity.getViaje()),
                usuarioMapper.toDTO(entity.getCliente()),
                entity.getEstrellas(),
                entity.getComentario(),
                entity.getFechaCalificacion()
        );
    }

    public Calificacion toEntity(CalificacionDTO dto) {
        if (dto == null) {
            return null;
        }
        return new Calificacion(
                dto.getId(),
                viajeMapper.toEntity(dto.getViaje()),
                usuarioMapper.toEntity(dto.getCliente()),
                dto.getEstrellas(),
                dto.getComentario(),
                dto.getFechaCalificacion()
        );
    }
}
