package com.ecuaviptour.service.implementation;

import com.ecuaviptour.model.Usuario;
import com.ecuaviptour.model.Vehiculo;
import com.ecuaviptour.model.Viaje;
import com.ecuaviptour.repository.CalificacionRepository;
import com.ecuaviptour.repository.UsuarioRepository;
import com.ecuaviptour.repository.VehiculoRepository;
import com.ecuaviptour.repository.ViajeRepository;
import com.ecuaviptour.service.interfaces.AdminService;
import com.ecuaviptour.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AdminServiceImpl implements AdminService {

    private final UsuarioRepository usuarioRepository;
    private final VehiculoRepository vehiculoRepository;
    private final ViajeRepository viajeRepository;
    private final CalificacionRepository calificacionRepository;

    public AdminServiceImpl(UsuarioRepository usuarioRepository,
                            VehiculoRepository vehiculoRepository,
                            ViajeRepository viajeRepository,
                            CalificacionRepository calificacionRepository) {
        this.usuarioRepository = usuarioRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.viajeRepository = viajeRepository;
        this.calificacionRepository = calificacionRepository;
    }

    @Override
    public List<Map<String, Object>> getAllUsers(String rol, String search, Boolean activo, LocalDateTime fechaViaje, Integer duracionMinutos) {
        List<Usuario> users = usuarioRepository.findAll();

        // 1. Filter out busy drivers if date/time is queried
        Set<Long> busyDriverIds = new HashSet<>();
        if ("chofer".equalsIgnoreCase(rol) && fechaViaje != null) {
            int duration = duracionMinutos != null ? duracionMinutos : 30;
            LocalDateTime proposedStart = fechaViaje;
            LocalDateTime proposedEnd = proposedStart.plusMinutes(duration);

            List<Viaje> activeViajes = viajeRepository.findAll().stream()
                    .filter(v -> v.getChofer() != null && v.getFechaViaje() != null)
                    .filter(v -> !"finalizado".equalsIgnoreCase(v.getEstadoLogistico()) && !"cancelado".equalsIgnoreCase(v.getEstadoLogistico()))
                    .collect(Collectors.toList());

            for (Viaje v : activeViajes) {
                LocalDateTime vStart = v.getFechaViaje();
                int vDur = v.getDuracionMinutos() != null ? v.getDuracionMinutos() : 30;
                LocalDateTime vEnd = vStart.plusMinutes(vDur);

                if (vStart.isBefore(proposedEnd) && proposedStart.isBefore(vEnd)) {
                    busyDriverIds.add(v.getChofer().getId());
                }
            }
        }

        return users.stream()
                .filter(u -> rol == null || rol.equalsIgnoreCase(u.getRol()))
                .filter(u -> !busyDriverIds.contains(u.getId()))
                .filter(u -> activo == null || activo.equals(u.getActivo()))
                .filter(u -> search == null || search.isBlank() ||
                        u.getNombre().toLowerCase().contains(search.toLowerCase()) ||
                        u.getCorreo().toLowerCase().contains(search.toLowerCase()) ||
                        (u.getCedula() != null && u.getCedula().contains(search)) ||
                        (u.getTelefono() != null && u.getTelefono().contains(search)))
                .map(u -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("id", u.getId());
                    map.put("nombre", u.getNombre());
                    map.put("correo", u.getCorreo());
                    map.put("telefono", u.getTelefono());
                    map.put("cedula", u.getCedula());
                    map.put("foto_perfil_url", u.getFotoPerfilUrl());
                    map.put("rol", u.getRol());
                    map.put("activo", u.getActivo());
                    map.put("fecha_registro", u.getFechaRegistro());

                    if ("chofer".equalsIgnoreCase(u.getRol())) {
                        // Driver stats calculations
                        long viajesCompletados = viajeRepository.findByChoferIdOrderByIdDesc(u.getId()).stream()
                                .filter(v -> "finalizado".equalsIgnoreCase(v.getEstadoLogistico()))
                                .count();

                        double promRating = calificacionRepository.findAll().stream()
                                .filter(c -> c.getViaje() != null && c.getViaje().getChofer() != null && c.getViaje().getChofer().getId().equals(u.getId()))
                                .mapToInt(c -> c.getEstrellas() != null ? c.getEstrellas() : 0)
                                .average()
                                .orElse(0.0);

                        map.put("viajes_completados", viajesCompletados);
                        map.put("promedio_calificacion", promRating);
                    }
                    return map;
                })
                .sorted((a, b) -> ((Long) b.get("id")).compareTo((Long) a.get("id"))) // Descending ID order
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Usuario toggleUserStatus(Long usuarioId) {
        Usuario u = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con el ID: " + usuarioId));

        u.setActivo(!u.getActivo());
        return usuarioRepository.save(u);
    }

    @Override
    @Transactional
    public Usuario updateUserAdmin(Long usuarioId, Usuario data) {
        Usuario u = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con el ID: " + usuarioId));

        if (data.getRol() != null) u.setRol(data.getRol());
        if (data.getActivo() != null) u.setActivo(data.getActivo());
        if (data.getNombre() != null) u.setNombre(data.getNombre());
        if (data.getCorreo() != null) u.setCorreo(data.getCorreo());
        if (data.getCedula() != null) u.setCedula(data.getCedula());
        if (data.getTelefono() != null) u.setTelefono(data.getTelefono());

        return usuarioRepository.save(u);
    }

    @Override
    public List<Vehiculo> getVehiculosFiltrados(String estado, String search) {
        return vehiculoRepository.findAll().stream()
                .filter(v -> estado == null || estado.equalsIgnoreCase(v.getEstado()))
                .filter(v -> search == null || search.isBlank() ||
                        v.getPlaca().toLowerCase().contains(search.toLowerCase()) ||
                        v.getMarca().toLowerCase().contains(search.toLowerCase()) ||
                        v.getModelo().toLowerCase().contains(search.toLowerCase()))
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public Vehiculo cambiarEstadoVehiculo(Long vehiculoId, String nuevoEstado) {
        Vehiculo v = vehiculoRepository.findById(vehiculoId)
                .orElseThrow(() -> new ResourceNotFoundException("Vehículo no encontrado con el ID: " + vehiculoId));

        v.setEstado(nuevoEstado);

        // Also update the driver role/status if approved
        if ("activo".equalsIgnoreCase(nuevoEstado) && v.getChofer() != null) {
            Usuario chofer = v.getChofer();
            chofer.setRol("chofer");
            usuarioRepository.save(chofer);
        }

        return vehiculoRepository.save(v);
    }
}
