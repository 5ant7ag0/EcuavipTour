package com.ecuaviptour.modules.viajes.repository;

import com.ecuaviptour.modules.viajes.domain.Reserva;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio JPA para gestionar las operaciones sobre la entidad {@link Reserva}.
 * 
 * @author Antigravity
 * @version 1.1
 */
@Repository
public interface ReservaRepository extends JpaRepository<Reserva, Long> {

    /**
     * Busca las reservas asociadas a un viaje programado (frecuencia).
     *
     * @param viajeProgramadoId Identificador de la frecuencia.
     * @return Lista de reservas.
     */
    List<Reserva> findByViajeProgramadoId(Long viajeProgramadoId);

    /**
     * Busca las reservas asociadas a un usuario en particular (cliente).
     *
     * @param usuarioId Identificador del usuario.
     * @return Lista de reservas.
     */
    List<Reserva> findByUsuarioId(Long usuarioId);

    /**
     * Busca una reserva específica para validar colisión de asientos.
     *
     * @param viajeProgramadoId Identificador de la frecuencia.
     * @param numeroAsiento     Número de asiento consultado.
     * @return Opcional de la reserva encontrada.
     */
    Optional<Reserva> findByViajeProgramadoIdAndNumeroAsiento(Long viajeProgramadoId, Integer numeroAsiento);

    /**
     * Busca reservas pendientes que hayan superado el tiempo límite de pago.
     *
     * @param now Fecha y hora de referencia actual.
     * @return Lista de reservas expiradas.
     */
    @Query("SELECT r FROM Reserva r WHERE r.estadoPago = 'PENDIENTE' AND r.fechaLimitePago < :now")
    List<Reserva> findExpiredReservations(@Param("now") LocalDateTime now);
}
