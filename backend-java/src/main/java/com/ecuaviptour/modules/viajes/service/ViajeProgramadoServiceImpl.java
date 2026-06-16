package com.ecuaviptour.modules.viajes.service;

import com.ecuaviptour.modules.users.domain.Usuario;
import com.ecuaviptour.modules.users.repository.UsuarioRepository;
import com.ecuaviptour.modules.vehiculos.domain.Vehiculo;
import com.ecuaviptour.modules.vehiculos.repository.VehiculoRepository;
import com.ecuaviptour.modules.viajes.domain.ViajeProgramado;
import com.ecuaviptour.modules.viajes.repository.ViajeProgramadoRepository;
import com.ecuaviptour.exception.BadRequestException;
import com.ecuaviptour.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

/**
 * Implementación concreta de la interfaz {@link ViajeProgramadoService} para
 * gestionar las frecuencias programadas en la plataforma.
 * 
 * @author Antigravity
 * @version 1.1
 */
@Service
public class ViajeProgramadoServiceImpl implements ViajeProgramadoService {

    private final ViajeProgramadoRepository viajeProgramadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final VehiculoRepository vehiculoRepository;

    public ViajeProgramadoServiceImpl(ViajeProgramadoRepository viajeProgramadoRepository,
                                      UsuarioRepository usuarioRepository,
                                      VehiculoRepository vehiculoRepository) {
        this.viajeProgramadoRepository = viajeProgramadoRepository;
        this.usuarioRepository = usuarioRepository;
        this.vehiculoRepository = vehiculoRepository;
    }

    @Override
    @Transactional
    public ViajeProgramado crearFrecuencia(ViajeProgramado viajeProgramado, Long choferId, Long vehiculoId) {
        if (viajeProgramado == null) {
            throw new BadRequestException("Los datos de la frecuencia no pueden ser nulos.");
        }
        if (choferId == null) {
            throw new BadRequestException("Se debe asignar un chofer a la frecuencia.");
        }
        if (vehiculoId == null) {
            throw new BadRequestException("Se debe asignar un vehículo a la frecuencia.");
        }

        Usuario chofer = usuarioRepository.findById(choferId)
                .orElseThrow(() -> new ResourceNotFoundException("Chofer no encontrado con el ID: " + choferId));

        if (!"chofer".equalsIgnoreCase(chofer.getRol())) {
            throw new BadRequestException("El usuario asignado no tiene el rol de chofer.");
        }

        Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo no encontrado con el ID: " + vehiculoId));

        if (viajeProgramado.getDirOrigen() == null || viajeProgramado.getDirOrigen().trim().isEmpty()) {
            throw new BadRequestException("La dirección de origen es obligatoria.");
        }
        if (viajeProgramado.getDirDestino() == null || viajeProgramado.getDirDestino().trim().isEmpty()) {
            throw new BadRequestException("La dirección de destino es obligatoria.");
        }
        if (viajeProgramado.getFechaHoraSalida() == null) {
            throw new BadRequestException("La fecha y hora de salida es obligatoria.");
        }
        if (viajeProgramado.getFechaHoraSalida().isBefore(LocalDateTime.now())) {
            throw new BadRequestException("La fecha y hora de salida debe ser en el futuro.");
        }
        if (viajeProgramado.getPrecioAsiento() == null || viajeProgramado.getPrecioAsiento().compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("El precio por asiento debe ser un valor positivo.");
        }

        viajeProgramado.setChofer(chofer);
        viajeProgramado.setVehiculo(vehiculo);
        viajeProgramado.setEstado("PROGRAMADO");
        viajeProgramado.setFechaCreacion(LocalDateTime.now());

        if (viajeProgramado.getCapacidadTotal() == null || viajeProgramado.getCapacidadTotal() <= 0) {
            viajeProgramado.setCapacidadTotal(15);
        }

        return viajeProgramadoRepository.save(viajeProgramado);
    }

    @Override
    public List<ViajeProgramado> getFrecuenciasDisponibles() {
        List<ViajeProgramado> programados = viajeProgramadoRepository.findByEstado("PROGRAMADO");
        List<ViajeProgramado> enRuta = viajeProgramadoRepository.findByEstado("EN_RUTA");
        
        List<ViajeProgramado> disponibles = new ArrayList<>(programados);
        disponibles.addAll(enRuta);
        return disponibles;
    }

    @Override
    public Optional<ViajeProgramado> getFrecuenciaById(Long id) {
        if (id == null) {
            return Optional.empty();
        }
        return viajeProgramadoRepository.findById(id);
    }

    @Override
    @Transactional
    public ViajeProgramado actualizarEstado(Long id, String nuevoEstado) {
        if (id == null) {
            throw new BadRequestException("El identificador de la frecuencia no puede ser nulo.");
        }
        if (nuevoEstado == null || nuevoEstado.trim().isEmpty()) {
            throw new BadRequestException("El nuevo estado no puede ser vacío.");
        }

        String estadoUpper = nuevoEstado.toUpperCase().trim();
        if (!"PROGRAMADO".equals(estadoUpper) && !"EN_RUTA".equals(estadoUpper) && !"FINALIZADO".equals(estadoUpper)) {
            throw new BadRequestException("El estado '" + nuevoEstado + "' no es un estado válido de frecuencia. Valores admitidos: PROGRAMADO, EN_RUTA, FINALIZADO.");
        }

        ViajeProgramado viajeProgramado = viajeProgramadoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Frecuencia no encontrada con el ID: " + id));

        viajeProgramado.setEstado(estadoUpper);
        return viajeProgramadoRepository.save(viajeProgramado);
    }
}
