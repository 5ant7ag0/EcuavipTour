package com.ecuaviptour.repository;

import com.ecuaviptour.model.ReservaAsiento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReservaAsientoRepository extends JpaRepository<ReservaAsiento, Long> {
    
    List<ReservaAsiento> findByViajeId(Long viajeId);
    
    List<ReservaAsiento> findByViajeIdAndEstado(Long viajeId, String estado);
}
