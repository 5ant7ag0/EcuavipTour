package com.ecuaviptour.service.interfaces;

import com.ecuaviptour.model.Usuario;
import com.ecuaviptour.model.Vehiculo;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

public interface AdminService {
    
    List<Map<String, Object>> getAllUsers(String rol, String search, Boolean activo, LocalDateTime fechaViaje, Integer duracionMinutos);
    
    Usuario toggleUserStatus(Long usuarioId);
    
    Usuario updateUserAdmin(Long usuarioId, Usuario data);
    
    List<Vehiculo> getVehiculosFiltrados(String estado, String search);
    
    Vehiculo cambiarEstadoVehiculo(Long vehiculoId, String nuevoEstado);
}
