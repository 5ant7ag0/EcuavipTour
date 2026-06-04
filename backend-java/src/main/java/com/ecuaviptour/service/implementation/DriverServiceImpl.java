package com.ecuaviptour.service.implementation;

import com.ecuaviptour.model.Usuario;
import com.ecuaviptour.model.Vehiculo;
import com.ecuaviptour.repository.UsuarioRepository;
import com.ecuaviptour.repository.VehiculoRepository;
import com.ecuaviptour.service.interfaces.DriverService;
import com.ecuaviptour.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Optional;

@Service
public class DriverServiceImpl implements DriverService {

    private final VehiculoRepository vehiculoRepository;
    private final UsuarioRepository usuarioRepository;

    public DriverServiceImpl(VehiculoRepository vehiculoRepository, UsuarioRepository usuarioRepository) {
        this.vehiculoRepository = vehiculoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public Optional<Vehiculo> getVehiculoByChoferId(Long choferId) {
        return vehiculoRepository.findByChoferId(choferId);
    }

    @Override
    @Transactional
    public Vehiculo updateVehiculo(Long choferId, Vehiculo data) {
        Usuario chofer = usuarioRepository.findById(choferId)
                .orElseThrow(() -> new ResourceNotFoundException("Chofer no encontrado con el ID: " + choferId));

        Vehiculo v = vehiculoRepository.findByChoferId(choferId)
                .orElseGet(() -> Vehiculo.builder()
                        .chofer(chofer)
                        .estado("pendiente")
                        .capacidadMax(15)
                        .placa("")
                        .build());

        if ("activo".equalsIgnoreCase(v.getEstado())) {
            // Strict business rule: lock sensitive documents and identity fields once approved!
            if (data.getMarca() != null) v.setMarca(data.getMarca());
            if (data.getModelo() != null) v.setModelo(data.getModelo());
            if (data.getAnio() != null) v.setAnio(data.getAnio());
            if (data.getCapacidadMax() != null) v.setCapacidadMax(data.getCapacidadMax());
            if (data.getColor() != null) v.setColor(data.getColor());
        } else {
            // Allow all edits during pending or rejected states
            if (data.getPlaca() != null) v.setPlaca(data.getPlaca());
            if (data.getMarca() != null) v.setMarca(data.getMarca());
            if (data.getModelo() != null) v.setModelo(data.getModelo());
            if (data.getAnio() != null) v.setAnio(data.getAnio());
            if (data.getTipoVehiculo() != null) v.setTipoVehiculo(data.getTipoVehiculo());
            if (data.getCapacidadMax() != null) v.setCapacidadMax(data.getCapacidadMax());
            if (data.getColor() != null) v.setColor(data.getColor());

            if (data.getLicenciaTipo() != null) v.setLicenciaTipo(data.getLicenciaTipo());
            if (data.getLicenciaVigencia() != null) v.setLicenciaVigencia(data.getLicenciaVigencia());
            if (data.getFotoAutoUrl() != null) v.setFotoAutoUrl(data.getFotoAutoUrl());
            if (data.getFotoMatriculaUrl() != null) v.setFotoMatriculaUrl(data.getFotoMatriculaUrl());
            if (data.getFotoLicenciaUrl() != null) v.setFotoLicenciaUrl(data.getFotoLicenciaUrl());
        }

        // Revert to pending for re-validation if it was rejected previously
        if ("rechazado".equalsIgnoreCase(v.getEstado())) {
            v.setEstado("pendiente");
        }

        return vehiculoRepository.save(v);
    }
}
