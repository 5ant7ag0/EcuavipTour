package com.ecuaviptour.repository;

import com.ecuaviptour.model.Viaje;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ViajeRepository extends JpaRepository<Viaje, Long> {
    
    List<Viaje> findByClienteIdOrderByIdDesc(Long clienteId);
    
    List<Viaje> findByChoferIdOrderByIdDesc(Long choferId);
    
    List<Viaje> findByEstadoLogisticoOrderByIdDesc(String estadoLogistico);
    
    List<Viaje> findAllByOrderByIdDesc();
}
