package com.ecuaviptour.shared.service;

import com.ecuaviptour.modules.viajes.domain.Viaje;

import com.ecuaviptour.modules.chat.domain.MensajeChat;

import com.ecuaviptour.modules.chat.domain.MensajeChat;
import com.ecuaviptour.modules.viajes.domain.Viaje;

public interface SocketIOService {
    
    void startServer();
    
    void broadcastSupportAssign(Long clienteId, String categoria, Long soporteId, String soporteNombre, String soporteAvatar);
    
    void broadcastCaseResolve(Long clienteId);
    
    void broadcastViajeCancelado(Long viajeId, String mensaje, Long clienteId, Long choferId);
    
    void broadcastNuevoViajeDisponible(Viaje v);
    
    void broadcastViajeAceptadoAut(Viaje v);
    
    void broadcastPagoActualizado(Long viajeId, Long clienteId, String estadoPago, String estadoLogistico);

    void broadcastPagoActualizado(Long viajeId, Long clienteId, String estadoPago, String estadoLogistico, Long choferId);

    void broadcastNuevoComprobante(Long viajeId, Long clienteId);

    void broadcastNuevoVehiculo(Long vehiculoId, String choferNombre);

    void broadcastViajeActualizado(Long viajeId, Long clienteId, String estadoLogistico);
    
    void broadcastViajeFinalizado(Long viajeId, Long clienteId);
    
    void broadcastSystemMessage(MensajeChat msg);
    
    void stopServer();
}
