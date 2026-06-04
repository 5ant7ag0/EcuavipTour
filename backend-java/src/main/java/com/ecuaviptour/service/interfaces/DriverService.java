package com.ecuaviptour.service.interfaces;

import com.ecuaviptour.model.Vehiculo;
import java.util.Optional;

public interface DriverService {
    
    Optional<Vehiculo> getVehiculoByChoferId(Long choferId);
    
    Vehiculo updateVehiculo(Long choferId, Vehiculo data);
}
