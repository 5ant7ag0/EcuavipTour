package com.ecuaviptour.repository;

import com.ecuaviptour.model.MensajeChat;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface MensajeRepository extends JpaRepository<MensajeChat, Long> {
    
    @Query("SELECT m FROM MensajeChat m " +
           "LEFT JOIN FETCH m.remitente r " +
           "LEFT JOIN FETCH m.destinatario d " +
           "LEFT JOIN FETCH m.viaje v " +
           "WHERE v.id = :viajeId " +
           "ORDER BY m.timestamp ASC")
    List<MensajeChat> findByViajeIdOrderByTimestampAsc(@Param("viajeId") Long viajeId);
    
    @Query("SELECT m FROM MensajeChat m " +
           "LEFT JOIN FETCH m.remitente r " +
           "LEFT JOIN FETCH m.destinatario d " +
           "LEFT JOIN FETCH m.viaje v " +
           "WHERE (r.id = :userId1 AND d.id = :userId2) OR " +
           "(r.id = :userId2 AND d.id = :userId1) " +
           "ORDER BY m.timestamp ASC")
    List<MensajeChat> getChatHistoryBetweenUsers(@Param("userId1") Long userId1, @Param("userId2") Long userId2);

    @Query("SELECT m FROM MensajeChat m " +
           "LEFT JOIN FETCH m.remitente r " +
           "LEFT JOIN FETCH m.destinatario d " +
           "LEFT JOIN FETCH m.viaje v " +
           "LEFT JOIN FETCH m.soporteAsignado s " +
           "WHERE m.tipoReceptor = 'admin' AND (r.id = :clienteId OR d.id = :clienteId) " +
           "ORDER BY m.timestamp ASC")
    List<MensajeChat> getHistorialSoporteCliente(@Param("clienteId") Long clienteId);

    @Query("SELECT m FROM MensajeChat m " +
           "LEFT JOIN FETCH m.remitente r " +
           "LEFT JOIN FETCH m.destinatario d " +
           "LEFT JOIN FETCH m.viaje v " +
           "LEFT JOIN FETCH m.soporteAsignado s " +
           "WHERE m.tipoReceptor = 'admin'")
    List<MensajeChat> findAllAdminMessagesWithUsers();



}
