package com.ecuaviptour.repository;

import com.ecuaviptour.model.Calificacion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CalificacionRepository extends JpaRepository<Calificacion, Long> {
    
    List<Calificacion> findByViajeId(Long viajeId);
    
    Optional<Calificacion> findByViajeIdAndClienteId(Long viajeId, Long clienteId);
}
