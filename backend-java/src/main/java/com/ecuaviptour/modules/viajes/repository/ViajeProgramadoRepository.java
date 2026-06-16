package com.ecuaviptour.modules.viajes.repository;

import com.ecuaviptour.modules.viajes.domain.ViajeProgramado;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

/**
 * Repositorio JPA para gestionar las frecuencias de {@link ViajeProgramado}.
 * 
 * @author Antigravity
 * @version 1.1
 */
@Repository
public interface ViajeProgramadoRepository extends JpaRepository<ViajeProgramado, Long> {

    /**
     * Busca frecuencias de viaje programadas por su estado operativo.
     *
     * @param estado Estado operativo (PROGRAMADO, EN_RUTA, FINALIZADO).
     * @return Lista de frecuencias encontradas.
     */
    List<ViajeProgramado> findByEstado(String estado);

    /**
     * Busca las frecuencias asignadas a un chofer específico.
     *
     * @param choferId Identificador único del chofer (Usuario).
     * @return Lista de frecuencias asignadas.
     */
    List<ViajeProgramado> findByChoferId(Long choferId);

    /**
     * Recupera todas las frecuencias ordenadas por su fecha y hora de salida de manera ascendente.
     *
     * @return Lista ordenada de frecuencias.
     */
    List<ViajeProgramado> findAllByOrderByFechaHoraSalidaAsc();

    /**
     * Recupera todas las frecuencias ordenadas por su fecha y hora de salida de manera descendente.
     *
     * @return Lista ordenada de frecuencias.
     */
    List<ViajeProgramado> findAllByOrderByFechaHoraSalidaDesc();
}
