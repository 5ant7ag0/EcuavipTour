package com.ecuaviptour.service.interfaces;

import com.ecuaviptour.model.Pago;
import com.ecuaviptour.model.Viaje;
import java.math.BigDecimal;
import java.util.Optional;

public interface PagoService extends BaseService<Pago, Long> {
    
    Pago registrarPago(Long viajeId, String comprobanteUrl, BigDecimal monto);
    
    Viaje confirmarPago(Long viajeId);
    
    Viaje rechazarPago(Long viajeId);
    
    Optional<Pago> getPagoByViajeId(Long viajeId);
}
