package com.ecuaviptour.mapper;

import com.ecuaviptour.dto.VehiculoDTO;
import com.ecuaviptour.model.Vehiculo;
import org.springframework.stereotype.Component;

@Component
public class VehiculoMapper {

    private final UsuarioMapper usuarioMapper;

    public VehiculoMapper(UsuarioMapper usuarioMapper) {
        this.usuarioMapper = usuarioMapper;
    }

    public VehiculoDTO toDTO(Vehiculo entity) {
        if (entity == null) {
            return null;
        }
        return new VehiculoDTO(
                entity.getId(),
                entity.getPlaca(),
                entity.getMarca(),
                entity.getModelo(),
                entity.getAnio(),
                entity.getTipoVehiculo(),
                entity.getCapacidadMax(),
                entity.getColor(),
                entity.getEsPrivado(),
                entity.getEstado(),
                entity.getFotoAutoUrl(),
                entity.getFotoMatriculaUrl(),
                entity.getFotoLicenciaUrl(),
                entity.getLicenciaTipo(),
                entity.getLicenciaVigencia(),
                usuarioMapper.toDTO(entity.getChofer())
        );
    }

    public Vehiculo toEntity(VehiculoDTO dto) {
        if (dto == null) {
            return null;
        }
        return new Vehiculo(
                dto.getId(),
                dto.getPlaca(),
                dto.getMarca(),
                dto.getModelo(),
                dto.getAnio(),
                dto.getTipoVehiculo(),
                dto.getCapacidadMax(),
                dto.getColor(),
                dto.getEsPrivado(),
                dto.getEstado(),
                dto.getFotoAutoUrl(),
                dto.getFotoMatriculaUrl(),
                dto.getFotoLicenciaUrl(),
                dto.getLicenciaTipo(),
                dto.getLicenciaVigencia(),
                usuarioMapper.toEntity(dto.getChofer())
        );
    }
}
