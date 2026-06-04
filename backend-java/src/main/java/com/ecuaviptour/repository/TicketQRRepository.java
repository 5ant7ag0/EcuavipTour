package com.ecuaviptour.repository;

import com.ecuaviptour.model.TicketQR;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TicketQRRepository extends JpaRepository<TicketQR, Long> {
    
    Optional<TicketQR> findByViajeId(Long viajeId);
    
    Optional<TicketQR> findByCodigoHash(String codigoHash);
}
