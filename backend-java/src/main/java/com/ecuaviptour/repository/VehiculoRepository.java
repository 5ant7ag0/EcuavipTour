package com.ecuaviptour.repository;

import com.ecuaviptour.model.Vehiculo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface VehiculoRepository extends JpaRepository<Vehiculo, Long> {
    
    Optional<Vehiculo> findByPlaca(String placa);
    
    Optional<Vehiculo> findByChoferId(Long choferId);
    
    List<Vehiculo> findByEstado(String estado);
}
