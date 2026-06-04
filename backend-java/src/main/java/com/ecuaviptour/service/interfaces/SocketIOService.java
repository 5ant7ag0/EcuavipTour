package com.ecuaviptour.service.interfaces;

import com.ecuaviptour.model.Viaje;

public interface SocketIOService {
    
    void startServer();
    
    void broadcastSupportAssign(Long clienteId, String categoria, Long soporteId, String soporteNombre, String soporteAvatar);
    
    void broadcastCaseResolve(Long clienteId);
    
    void broadcastViajeCancelado(Long viajeId, String mensaje, Long clienteId, Long choferId);
    
    void broadcastNuevoViajeDisponible(Viaje v);
    
    void broadcastPagoActualizado(Long viajeId, Long clienteId, String estadoPago, String estadoLogistico);

    void broadcastNuevoComprobante(Long viajeId, Long clienteId);
    
    void stopServer();
}
