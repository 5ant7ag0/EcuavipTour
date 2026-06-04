package com.ecuaviptour.service.interfaces;

import com.ecuaviptour.model.Calificacion;
import java.util.List;
import java.util.Optional;

public interface CalificacionService extends BaseService<Calificacion, Long> {
    
    Calificacion calificar(Long viajeId, Long clienteId, Integer estrellas, String comentario);
    
    List<Calificacion> getCalificacionesByViaje(Long viajeId);
    
    Optional<Calificacion> getCalificacionPorViajeYCliente(Long viajeId, Long clienteId);
}
