package com.ecuaviptour.modules.viajes.service;

import com.ecuaviptour.modules.users.domain.Usuario;
import com.ecuaviptour.modules.users.repository.UsuarioRepository;
import com.ecuaviptour.modules.vehiculos.domain.Vehiculo;
import com.ecuaviptour.modules.vehiculos.repository.VehiculoRepository;
import com.ecuaviptour.modules.viajes.domain.ViajeProgramado;
import com.ecuaviptour.modules.viajes.repository.ViajeProgramadoRepository;
import com.ecuaviptour.exception.BadRequestException;
import com.ecuaviptour.exception.ResourceNotFoundException;
import com.ecuaviptour.modules.viajes.repository.ReservaRepository;
import com.ecuaviptour.modules.viajes.domain.Reserva;
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
    private final ReservaRepository reservaRepository;

    public ViajeProgramadoServiceImpl(ViajeProgramadoRepository viajeProgramadoRepository,
                                      UsuarioRepository usuarioRepository,
                                      VehiculoRepository vehiculoRepository,
                                      ReservaRepository reservaRepository) {
        this.viajeProgramadoRepository = viajeProgramadoRepository;
        this.usuarioRepository = usuarioRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.reservaRepository = reservaRepository;
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

        // Validate driver schedule conflicts before saving
        validarConflictoChofer(null, choferId, viajeProgramado.getFechaHoraSalida(), viajeProgramado.getDirOrigen(), viajeProgramado.getDirDestino());

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

    @Override
    @Transactional
    public ViajeProgramado actualizarFrecuencia(Long id, ViajeProgramado data, Long choferId, Long vehiculoId) {
        if (id == null) {
            throw new BadRequestException("El identificador de la frecuencia no puede ser nulo.");
        }
        if (data == null) {
            throw new BadRequestException("Los datos de la frecuencia no pueden ser nulos.");
        }

        ViajeProgramado vp = viajeProgramadoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Frecuencia no encontrada con el ID: " + id));

        if ("FINALIZADO".equalsIgnoreCase(vp.getEstado())) {
            throw new BadRequestException("No se puede editar una frecuencia que ya ha finalizado.");
        }

        // Resolve driver
        if (choferId != null) {
            Usuario chofer = usuarioRepository.findById(choferId)
                    .orElseThrow(() -> new ResourceNotFoundException("Chofer no encontrado con el ID: " + choferId));
            if (!"chofer".equalsIgnoreCase(chofer.getRol())) {
                throw new BadRequestException("El usuario asignado no tiene el rol de chofer.");
            }
            vp.setChofer(chofer);
        }

        // Resolve vehicle
        if (vehiculoId != null) {
            Vehiculo vehiculo = vehiculoRepository.findById(vehiculoId)
                    .orElseThrow(() -> new ResourceNotFoundException("Vehículo no encontrado con el ID: " + vehiculoId));
            vp.setVehiculo(vehiculo);
        }

        // Update other fields
        if (data.getDirOrigen() != null && !data.getDirOrigen().trim().isEmpty()) {
            vp.setDirOrigen(data.getDirOrigen());
        }
        if (data.getDirDestino() != null && !data.getDirDestino().trim().isEmpty()) {
            vp.setDirDestino(data.getDirDestino());
        }
        if (data.getFechaHoraSalida() != null) {
            vp.setFechaHoraSalida(data.getFechaHoraSalida());
        }
        if (data.getPrecioAsiento() != null && data.getPrecioAsiento().compareTo(BigDecimal.ZERO) > 0) {
            vp.setPrecioAsiento(data.getPrecioAsiento());
        }
        if (data.getCapacidadTotal() != null && data.getCapacidadTotal() > 0) {
            vp.setCapacidadTotal(data.getCapacidadTotal());
        }

        // Validate driver schedule conflicts before saving
        Long cId = vp.getChofer() != null ? vp.getChofer().getId() : null;
        validarConflictoChofer(id, cId, vp.getFechaHoraSalida(), vp.getDirOrigen(), vp.getDirDestino());

        return viajeProgramadoRepository.save(vp);
    }

    public static int estimarDuracionRuta(String origen, String destino) {
        if (origen == null || destino == null) {
            return 90; // Default fallback
        }
        String o = origen.toLowerCase();
        String d = destino.toLowerCase();
        
        if (o.trim().equals(d.trim())) {
            return 0;
        }
        
        if (o.contains("ambato") && d.contains("ambato")) return 15;
        if (o.contains("quito") && d.contains("quito")) return 20;
        if (o.contains("riobamba") && d.contains("riobamba")) return 15;
        if (o.contains("baños") && d.contains("baños")) return 15;
        
        boolean oQuito = o.contains("quito");
        boolean oAmbato = o.contains("ambato");
        boolean oRiobamba = o.contains("riobamba");
        boolean oBanos = o.contains("baños") || o.contains("banos");
        
        boolean dQuito = d.contains("quito");
        boolean dAmbato = d.contains("ambato");
        boolean dRiobamba = d.contains("riobamba");
        boolean dBanos = d.contains("baños") || d.contains("banos");
        
        if ((oQuito && dAmbato) || (oAmbato && dQuito)) {
            return 120; // 2 hours
        }
        if ((oQuito && dRiobamba) || (oRiobamba && dQuito)) {
            return 180; // 3 hours
        }
        if ((oQuito && dBanos) || (oBanos && dQuito)) {
            return 180; // 3 hours
        }
        if ((oAmbato && dRiobamba) || (oRiobamba && oAmbato)) {
            return 60; // 1 hour
        }
        if ((oAmbato && dBanos) || (oBanos && dAmbato)) {
            return 45; // 45 mins
        }
        if ((oRiobamba && dBanos) || (dBanos && oRiobamba)) {
            return 90; // 1.5 hours
        }
        
        return 90; // Default fallback
    }

    private void validarConflictoChofer(Long idAExcluir, Long choferId, LocalDateTime proposedSalida, String proposedOrigen, String proposedDestino) {
        if (choferId == null || proposedSalida == null || proposedOrigen == null || proposedDestino == null) {
            return;
        }

        List<ViajeProgramado> viajesChofer = viajeProgramadoRepository.findByChoferId(choferId);
        int duracionB = estimarDuracionRuta(proposedOrigen, proposedDestino);

        for (ViajeProgramado vp : viajesChofer) {
            if (idAExcluir != null && idAExcluir.equals(vp.getId())) {
                continue;
            }
            if ("FINALIZADO".equalsIgnoreCase(vp.getEstado()) || "CANCELADO".equalsIgnoreCase(vp.getEstado())) {
                continue;
            }

            // Verify only same day trips
            if (!vp.getFechaHoraSalida().toLocalDate().equals(proposedSalida.toLocalDate())) {
                continue;
            }

            int duracionA = estimarDuracionRuta(vp.getDirOrigen(), vp.getDirDestino());

            if (vp.getFechaHoraSalida().isBefore(proposedSalida) || vp.getFechaHoraSalida().isEqual(proposedSalida)) {
                // A is before B
                int traslado = estimarDuracionRuta(vp.getDirDestino(), proposedOrigen);
                LocalDateTime arrivalA = vp.getFechaHoraSalida().plusMinutes(duracionA);
                LocalDateTime availableTime = arrivalA.plusMinutes(traslado);

                boolean isTransferClose = traslado < 15 || vp.getDirDestino().toLowerCase().trim().equals(proposedOrigen.toLowerCase().trim());

                if (isTransferClose) {
                    if (proposedSalida.isBefore(arrivalA)) {
                        throw new BadRequestException("Conflicto de horario: El chofer se encuentra en ruta en el viaje anterior hasta las " +
                                arrivalA.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")) + ".");
                    }
                } else {
                    if (proposedSalida.isBefore(availableTime)) {
                        throw new BadRequestException("Conflicto de horario: El chofer requiere traslado hasta las " +
                                availableTime.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")) + ".");
                    }
                }
            } else {
                // B is before A
                int traslado = estimarDuracionRuta(proposedDestino, vp.getDirOrigen());
                LocalDateTime arrivalB = proposedSalida.plusMinutes(duracionB);
                LocalDateTime availableTime = arrivalB.plusMinutes(traslado);

                boolean isTransferClose = traslado < 15 || proposedDestino.toLowerCase().trim().equals(vp.getDirOrigen().toLowerCase().trim());

                if (isTransferClose) {
                    if (vp.getFechaHoraSalida().isBefore(arrivalB)) {
                        throw new BadRequestException("Conflicto de horario: El chofer tiene el siguiente viaje programado a las " +
                                vp.getFechaHoraSalida().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")) + 
                                ", y el viaje propuesto termina a las " + arrivalB.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")) + ".");
                    }
                } else {
                    if (vp.getFechaHoraSalida().isBefore(availableTime)) {
                        throw new BadRequestException("Conflicto de horario: El chofer tiene el siguiente viaje programado a las " +
                                vp.getFechaHoraSalida().format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")) + 
                                ", y requiere traslado hasta las " + availableTime.format(java.time.format.DateTimeFormatter.ofPattern("HH:mm")) + ".");
                    }
                }
            }
        }
    }

    @Override
    @Transactional
    public void eliminarFrecuencia(Long id) {
        if (id == null) {
            throw new BadRequestException("El identificador de la frecuencia no puede ser nulo.");
        }
        ViajeProgramado vp = viajeProgramadoRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Frecuencia no encontrada con el ID: " + id));

        // Check if frequency has already started
        if (!"PROGRAMADO".equalsIgnoreCase(vp.getEstado())) {
            throw new BadRequestException("No se puede eliminar la frecuencia porque ya ha iniciado o finalizado.");
        }

        // Check if there are active reservations
        List<Reserva> reservas = reservaRepository.findByViajeProgramadoId(id);
        if (reservas != null) {
            long activeReservations = reservas.stream()
                    .filter(r -> !"CANCELADO".equalsIgnoreCase(r.getEstadoPago()))
                    .count();
            if (activeReservations > 0) {
                throw new BadRequestException("No se puede eliminar la frecuencia porque tiene pasajeros asignados.");
            }
            // Delete cancelled ones just to clean up
            reservaRepository.deleteAll(reservas);
        }

        viajeProgramadoRepository.delete(vp);
    }
}
