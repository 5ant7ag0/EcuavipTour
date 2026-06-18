package com.ecuaviptour.modules.users.service;

import com.ecuaviptour.shared.service.BaseService;

import com.ecuaviptour.modules.users.domain.Calificacion;
import java.util.List;
import java.util.Optional;

public interface CalificacionService extends BaseService<Calificacion, Long> {
    
    Calificacion calificar(Long viajeId, Long clienteId, Integer estrellas, String comentario);
    
    Calificacion calificarReserva(Long reservaId, Long clienteId, Integer estrellas, String comentario);
    
    List<Calificacion> getCalificacionesByViaje(Long viajeId);
    
    Optional<Calificacion> getCalificacionPorViajeYCliente(Long viajeId, Long clienteId);

    Optional<Calificacion> getCalificacionPorReservaYCliente(Long reservaId, Long clienteId);
}
