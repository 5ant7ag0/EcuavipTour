package com.ecuaviptour.mapper;

import com.ecuaviptour.dto.MensajeChatDTO;
import com.ecuaviptour.model.MensajeChat;
import org.springframework.stereotype.Component;

@Component
public class MensajeChatMapper {

    private final ViajeMapper viajeMapper;
    private final UsuarioMapper usuarioMapper;

    public MensajeChatMapper(ViajeMapper viajeMapper, UsuarioMapper usuarioMapper) {
        this.viajeMapper = viajeMapper;
        this.usuarioMapper = usuarioMapper;
    }

    public MensajeChatDTO toDTO(MensajeChat entity) {
        if (entity == null) {
            return null;
        }
        return new MensajeChatDTO(
                entity.getId(),
                viajeMapper.toDTO(entity.getViaje()),
                usuarioMapper.toDTO(entity.getRemitente()),
                usuarioMapper.toDTO(entity.getDestinatario()),
                usuarioMapper.toDTO(entity.getSoporteAsignado()),
                entity.getCategoria(),
                entity.getEstado(),
                entity.getTipoReceptor(),
                entity.getContenido(),
                entity.getLeido(),
                entity.getTimestamp()
        );
    }

    public MensajeChat toEntity(MensajeChatDTO dto) {
        if (dto == null) {
            return null;
        }
        return new MensajeChat(
                dto.getId(),
                viajeMapper.toEntity(dto.getViaje()),
                usuarioMapper.toEntity(dto.getRemitente()),
                usuarioMapper.toEntity(dto.getDestinatario()),
                usuarioMapper.toEntity(dto.getSoporteAsignado()),
                dto.getCategoria(),
                dto.getEstado(),
                dto.getTipoReceptor(),
                dto.getContenido(),
                dto.getLeido(),
                dto.getTimestamp()
        );
    }
}
