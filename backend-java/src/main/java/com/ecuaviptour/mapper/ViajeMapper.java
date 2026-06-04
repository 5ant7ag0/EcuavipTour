package com.ecuaviptour.mapper;

import com.ecuaviptour.dto.ViajeDTO;
import com.ecuaviptour.model.Viaje;
import org.springframework.stereotype.Component;

@Component
public class ViajeMapper {

    private final UsuarioMapper usuarioMapper;
    private final VehiculoMapper vehiculoMapper;

    public ViajeMapper(UsuarioMapper usuarioMapper, VehiculoMapper vehiculoMapper) {
        this.usuarioMapper = usuarioMapper;
        this.vehiculoMapper = vehiculoMapper;
    }

    public ViajeDTO toDTO(Viaje entity) {
        if (entity == null) {
            return null;
        }
        return new ViajeDTO(
                entity.getId(),
                usuarioMapper.toDTO(entity.getCliente()),
                usuarioMapper.toDTO(entity.getChofer()),
                vehiculoMapper.toDTO(entity.getVehiculo()),
                entity.getDirOrigen(),
                entity.getLatOrigen(),
                entity.getLngOrigen(),
                entity.getDirDestino(),
                entity.getLatDestino(),
                entity.getLngDestino(),
                entity.getReferenciaAdicional(),
                entity.getDistanciaKm(),
                entity.getMontoTotal(),
                entity.getTipoServicio(),
                entity.getTipoModalidad(),
                entity.getEstadoPago(),
                entity.getEstadoLogistico(),
                entity.getFechaLimitePago(),
                entity.getFechaCreacion(),
                entity.getFechaViaje(),
                entity.getDuracionMinutos()
        );
    }

    public Viaje toEntity(ViajeDTO dto) {
        if (dto == null) {
            return null;
        }
        return new Viaje(
                dto.getId(),
                usuarioMapper.toEntity(dto.getCliente()),
                usuarioMapper.toEntity(dto.getChofer()),
                vehiculoMapper.toEntity(dto.getVehiculo()),
                dto.getDirOrigen(),
                dto.getLatOrigen(),
                dto.getLngOrigen(),
                dto.getDirDestino(),
                dto.getLatDestino(),
                dto.getLngDestino(),
                dto.getReferenciaAdicional(),
                dto.getDistanciaKm(),
                dto.getMontoTotal(),
                dto.getTipoServicio(),
                dto.getTipoModalidad(),
                dto.getEstadoPago(),
                dto.getEstadoLogistico(),
                dto.getFechaLimitePago(),
                dto.getFechaCreacion(),
                dto.getFechaViaje(),
                dto.getDuracionMinutos()
        );
    }
}
