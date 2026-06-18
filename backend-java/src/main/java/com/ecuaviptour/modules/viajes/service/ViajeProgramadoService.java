package com.ecuaviptour.modules.viajes.service;

import com.ecuaviptour.modules.viajes.domain.ViajeProgramado;
import java.util.List;
import java.util.Optional;

/**
 * Interfaz de servicio para la gestión de viajes programados (frecuencias).
 * 
 * @author Antigravity
 * @version 1.1
 */
public interface ViajeProgramadoService {

    /**
     * Registra una nueva frecuencia de viaje asignándole chofer y vehículo.
     *
     * @param viajeProgramado Datos de la frecuencia a programar.
     * @param choferId        Identificador del chofer.
     * @param vehiculoId      Identificador del vehículo.
     * @return La frecuencia persistida.
     */
    ViajeProgramado crearFrecuencia(ViajeProgramado viajeProgramado, Long choferId, Long vehiculoId);

    /**
     * Obtiene todas las frecuencias que están disponibles para reservas (estados PROGRAMADO, EN_RUTA).
     *
     * @return Lista de frecuencias disponibles.
     */
    List<ViajeProgramado> getFrecuenciasDisponibles();

    /**
     * Obtiene una frecuencia de viaje específica por su identificador único.
     *
     * @param id Identificador único de la frecuencia.
     * @return Opcional con la frecuencia si se encuentra.
     */
    Optional<ViajeProgramado> getFrecuenciaById(Long id);

    /**
     * Actualiza el estado operativo de una frecuencia.
     *
     * @param id          Identificador único de la frecuencia.
     * @param nuevoEstado Nuevo estado (PROGRAMADO, EN_RUTA, FINALIZADO).
     * @return La frecuencia actualizada.
     */
    ViajeProgramado actualizarEstado(Long id, String nuevoEstado);

    /**
     * Actualiza una frecuencia de viaje programada existente (chofer, vehículo, tarifas, itinerario).
     */
    ViajeProgramado actualizarFrecuencia(Long id, ViajeProgramado data, Long choferId, Long vehiculoId);

    /**
     * Elimina una frecuencia de viaje programada existente y sus reservas asociadas.
     */
    void eliminarFrecuencia(Long id);
}
