package com.ecuaviptour.modules.viajes.service;

import com.ecuaviptour.modules.users.domain.Usuario;
import com.ecuaviptour.modules.users.repository.UsuarioRepository;
import com.ecuaviptour.modules.viajes.domain.Reserva;
import com.ecuaviptour.modules.viajes.domain.ViajeProgramado;
import com.ecuaviptour.modules.viajes.repository.ReservaRepository;
import com.ecuaviptour.modules.viajes.repository.ViajeProgramadoRepository;
import com.ecuaviptour.exception.BadRequestException;
import com.ecuaviptour.exception.ConflictException;
import com.ecuaviptour.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Random;

/**
 * Implementación concreta del servicio de reservas de pasajes individuales.
 * Maneja lógica transaccional, control de colisiones de asientos y expiración.
 * 
 * @author Antigravity
 * @version 1.1
 */
@Service
public class ReservaServiceImpl implements ReservaService {

    private final ReservaRepository reservaRepository;
    private final ViajeProgramadoRepository viajeProgramadoRepository;
    private final UsuarioRepository usuarioRepository;
    private final Random random = new Random();

    public ReservaServiceImpl(ReservaRepository reservaRepository,
                              ViajeProgramadoRepository viajeProgramadoRepository,
                              UsuarioRepository usuarioRepository) {
        this.reservaRepository = reservaRepository;
        this.viajeProgramadoRepository = viajeProgramadoRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    @Transactional
    public Reserva crearReserva(Long viajeProgramadoId, Long usuarioId, Integer numeroAsiento, String puntoAbordaje) {
        if (viajeProgramadoId == null) {
            throw new BadRequestException("El identificador de la frecuencia es obligatorio.");
        }
        if (usuarioId == null) {
            throw new BadRequestException("El identificador del usuario es obligatorio.");
        }
        if (numeroAsiento == null || numeroAsiento <= 0) {
            throw new BadRequestException("El número de asiento debe ser mayor a cero.");
        }
        if (puntoAbordaje == null || puntoAbordaje.trim().isEmpty()) {
            throw new BadRequestException("El punto de abordaje es obligatorio.");
        }

        ViajeProgramado viajeProgramado = viajeProgramadoRepository.findById(viajeProgramadoId)
                .orElseThrow(() -> new ResourceNotFoundException("Frecuencia de viaje no encontrada con el ID: " + viajeProgramadoId));

        Usuario usuario = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con el ID: " + usuarioId));

        if (numeroAsiento > viajeProgramado.getCapacidadTotal()) {
            throw new BadRequestException("El número de asiento " + numeroAsiento + " excede la capacidad total de " + viajeProgramado.getCapacidadTotal() + " asientos de la van.");
        }

        // Validar colisiones de asientos
        Optional<Reserva> existingOpt = reservaRepository.findByViajeProgramadoIdAndNumeroAsiento(viajeProgramadoId, numeroAsiento);
        if (existingOpt.isPresent()) {
            Reserva existing = existingOpt.get();
            if ("PENDIENTE".equalsIgnoreCase(existing.getEstadoPago()) || "CONFIRMADO".equalsIgnoreCase(existing.getEstadoPago())) {
                throw new ConflictException("El asiento " + numeroAsiento + " ya se encuentra reservado u ocupado para esta frecuencia.");
            } else if ("CANCELADO".equalsIgnoreCase(existing.getEstadoPago())) {
                // Para respetar la restricción única física de la tabla (uq_reserva_asiento),
                // eliminamos la reserva cancelada antes de guardar una nueva para el mismo asiento.
                reservaRepository.delete(existing);
                reservaRepository.flush();
            }
        }

        // Generar PIN dinámico de 4 dígitos
        String pinAbordaje = String.format("%04d", random.nextInt(10000));
        LocalDateTime fechaReserva = LocalDateTime.now();
        LocalDateTime fechaLimitePago = fechaReserva.plusMinutes(15);

        Reserva reserva = Reserva.builder()
                .viajeProgramado(viajeProgramado)
                .usuario(usuario)
                .numeroAsiento(numeroAsiento)
                .puntoAbordaje(puntoAbordaje)
                .estadoPago("PENDIENTE")
                .pinAbordaje(pinAbordaje)
                .fechaReserva(fechaReserva)
                .fechaLimitePago(fechaLimitePago)
                .build();

        return reservaRepository.save(reserva);
    }

    @Override
    public List<Reserva> getReservasUsuario(Long usuarioId) {
        if (usuarioId == null) {
            throw new BadRequestException("El identificador del usuario es obligatorio.");
        }
        return reservaRepository.findByUsuarioId(usuarioId);
    }

    @Override
    public List<Reserva> getReservasFrecuencia(Long viajeProgramadoId) {
        if (viajeProgramadoId == null) {
            throw new BadRequestException("El identificador de la frecuencia es obligatorio.");
        }
        return reservaRepository.findByViajeProgramadoId(viajeProgramadoId);
    }

    @Override
    @Transactional
    public boolean validarAbordaje(Long reservaId, String pin) {
        if (reservaId == null) {
            throw new BadRequestException("El identificador de la reserva es obligatorio.");
        }
        if (pin == null || pin.trim().isEmpty()) {
            throw new BadRequestException("El PIN de abordaje es obligatorio.");
        }

        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con el ID: " + reservaId));

        if (!"CONFIRMADO".equalsIgnoreCase(reserva.getEstadoPago()) && !"ABORDO".equalsIgnoreCase(reserva.getEstadoPago())) {
            throw new BadRequestException("La reserva no puede ser abordada porque su pago no está confirmado o la reserva fue cancelada. Estado actual: " + reserva.getEstadoPago());
        }

        Long viajeId = reserva.getViajeProgramado().getId();
        Long usuarioId = reserva.getUsuario().getId();
        List<Reserva> allReservas = reservaRepository.findByViajeProgramadoId(viajeId);

        // Validar si el PIN coincide con la reserva principal o cualquiera de sus reservas hermanas
        boolean valid = false;
        for (Reserva r : allReservas) {
            Long rUsuarioId = (r.getUsuario() != null) ? r.getUsuario().getId() : null;
            if (rUsuarioId != null && rUsuarioId.equals(usuarioId)) {
                if (r.getPinAbordaje() != null && pin.trim().equalsIgnoreCase(r.getPinAbordaje().trim())) {
                    valid = true;
                    break;
                }
            }
        }

        if (valid) {
            // Marcar todas las reservas confirmadas de este usuario como ABORDO
            for (Reserva r : allReservas) {
                Long rUsuarioId = (r.getUsuario() != null) ? r.getUsuario().getId() : null;
                if (rUsuarioId != null && rUsuarioId.equals(usuarioId) && "CONFIRMADO".equalsIgnoreCase(r.getEstadoPago())) {
                    r.setEstadoPago("ABORDO");
                    reservaRepository.saveAndFlush(r);
                }
            }
            reserva.setEstadoPago("ABORDO");
            reservaRepository.saveAndFlush(reserva);
        }
        return valid;
    }

    @Override
    @Transactional
    public void cancelarReservasExpiradas() {
        LocalDateTime now = LocalDateTime.now();
        List<Reserva> expiredReservations = reservaRepository.findExpiredReservations(now);

        for (Reserva r : expiredReservations) {
            System.out.println("[Scheduler] Cancelando reserva expirada ID: " + r.getId() + ". Límite de pago: " + r.getFechaLimitePago());
            r.setEstadoPago("CANCELADO");
            reservaRepository.save(r);
        }
    }

    @Override
    @Transactional
    public Reserva subirComprobante(Long reservaId, String comprobanteUrl) {
        if (reservaId == null) {
            throw new BadRequestException("El identificador de la reserva es obligatorio.");
        }
        if (comprobanteUrl == null || comprobanteUrl.trim().isEmpty()) {
            throw new BadRequestException("La URL del comprobante de pago no puede estar vacía.");
        }

        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con el ID: " + reservaId));

        if ("CANCELADO".equalsIgnoreCase(reserva.getEstadoPago())) {
            throw new BadRequestException("La reserva ya ha sido cancelada por expiración de tiempo de pago.");
        }

        // Buscar y actualizar reservas hermanas del mismo usuario para la misma frecuencia
        Long viajeId = reserva.getViajeProgramado().getId();
        Long usuarioId = reserva.getUsuario().getId();
        System.out.println("[subirComprobante] reservaId: " + reservaId + ", viajeId: " + viajeId + ", usuarioId: " + usuarioId);
        List<Reserva> allReservas = reservaRepository.findByViajeProgramadoId(viajeId);
        System.out.println("[subirComprobante] Encontradas " + allReservas.size() + " reservas en la frecuencia " + viajeId);
        for (Reserva r : allReservas) {
            Long rUsuarioId = (r.getUsuario() != null) ? r.getUsuario().getId() : null;
            System.out.println("[subirComprobante] Evaluando reserva ID: " + r.getId() + ", usuario ID: " + rUsuarioId + ", estado: " + r.getEstadoPago());
            if (rUsuarioId != null && rUsuarioId.equals(usuarioId) && "PENDIENTE".equalsIgnoreCase(r.getEstadoPago())) {
                System.out.println("[subirComprobante] -> Actualizando reserva hermana ID: " + r.getId() + " a COMPROBANTE_SUBIDO");
                r.setComprobanteUrl(comprobanteUrl);
                r.setEstadoPago("COMPROBANTE_SUBIDO");
                reservaRepository.saveAndFlush(r);
            }
        }

        reserva.setComprobanteUrl(comprobanteUrl);
        reserva.setEstadoPago("COMPROBANTE_SUBIDO");
        return reservaRepository.saveAndFlush(reserva);
    }

    @Override
    @Transactional
    public void cancelarReservaAdmin(Long id) {
        if (id == null) {
            throw new BadRequestException("El identificador de la reserva es obligatorio.");
        }
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con el ID: " + id));
        
        reserva.setEstadoPago("CANCELADO");
        reservaRepository.save(reserva);
    }

    @Override
    @Transactional
    public void reprogramarReserva(Long id, Long nuevoViajeProgramadoId) {
        if (id == null) {
            throw new BadRequestException("El identificador de la reserva es obligatorio.");
        }
        if (nuevoViajeProgramadoId == null) {
            throw new BadRequestException("El identificador del nuevo viaje es obligatorio.");
        }
        Reserva reserva = reservaRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con el ID: " + id));
        ViajeProgramado nuevoViaje = viajeProgramadoRepository.findById(nuevoViajeProgramadoId)
                .orElseThrow(() -> new ResourceNotFoundException("Frecuencia de viaje no encontrada con el ID: " + nuevoViajeProgramadoId));

        Integer seatNum = reserva.getNumeroAsiento();
        Optional<Reserva> existingSeat = reservaRepository.findByViajeProgramadoIdAndNumeroAsiento(nuevoViajeProgramadoId, seatNum);
        
        if (existingSeat.isPresent() && 
            ("PENDIENTE".equalsIgnoreCase(existingSeat.get().getEstadoPago()) || 
             "CONFIRMADO".equalsIgnoreCase(existingSeat.get().getEstadoPago()) ||
             "ABORDO".equalsIgnoreCase(existingSeat.get().getEstadoPago()))) {
            
            List<Reserva> existingReservations = reservaRepository.findByViajeProgramadoId(nuevoViajeProgramadoId);
            java.util.Set<Integer> occupiedSeats = new java.util.HashSet<>();
            for (Reserva r : existingReservations) {
                if (!"CANCELADO".equalsIgnoreCase(r.getEstadoPago())) {
                    occupiedSeats.add(r.getNumeroAsiento());
                }
            }
            
            int foundSeat = -1;
            for (int i = 1; i <= nuevoViaje.getCapacidadTotal(); i++) {
                if (!occupiedSeats.contains(i)) {
                    foundSeat = i;
                    break;
                }
            }
            if (foundSeat == -1) {
                throw new ConflictException("La nueva frecuencia de viaje no tiene asientos disponibles.");
            }
            seatNum = foundSeat;
        }

        reserva.setViajeProgramado(nuevoViaje);
        reserva.setNumeroAsiento(seatNum);
        reservaRepository.save(reserva);
    }
}
