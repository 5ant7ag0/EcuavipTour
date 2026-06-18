package com.ecuaviptour.modules.users.repository;

import com.ecuaviptour.modules.users.domain.Calificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

/**
 * Repositorio de persistencia para gestionar las operaciones de base de datos
 * de la entidad {@link Calificacion}.
 * Proporciona métodos para buscar valoraciones asociadas a viajes y clientes.
 *
 * @author Santiago T.
 * @version 1.0
 */
@Repository
public interface CalificacionRepository extends JpaRepository<Calificacion, Long> {
    
    /**
     * Obtiene una lista de calificaciones registradas para un viaje específico.
     *
     * @param viajeId Identificador único del viaje.
     * @return Lista de {@link Calificacion} asociadas al viaje.
     */
    List<Calificacion> findByViajeId(Long viajeId);
    
    /**
     * Busca una calificación específica realizada por un cliente para un viaje determinado.
     *
     * @param viajeId   Identificador único del viaje.
     * @param clienteId Identificador único del cliente (usuario).
     * @return Un {@link Optional} que contiene la calificación si existe, o vacío en caso contrario.
     */
    Optional<Calificacion> findByViajeIdAndClienteId(Long viajeId, Long clienteId);

    /**
     * Obtiene una lista de calificaciones registradas para una reserva específica.
     *
     * @param reservaId Identificador único de la reserva.
     * @return Lista de {@link Calificacion} asociadas a la reserva.
     */
    List<Calificacion> findByReservaId(Long reservaId);

    /**
     * Busca una calificación específica realizada por un cliente para una reserva determinada.
     *
     * @param reservaId Identificador único de la reserva.
     * @param clienteId Identificador único del cliente (usuario).
     * @return Un {@link Optional} que contiene la calificación si existe, o vacío en caso contrario.
     */
    Optional<Calificacion> findByReservaIdAndClienteId(Long reservaId, Long clienteId);
}

