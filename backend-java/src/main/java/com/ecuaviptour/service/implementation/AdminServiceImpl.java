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

/**
 * Implementación de la capa de servicios para la administración del sistema.
 * Proporciona lógica de negocio para gestionar el listado y estado de usuarios (clientes, choferes),
 * calcular estadísticas operativas de choferes, y coordinar el estado de vehículos de la flota.
 *
 * @author Santiago T.
 * @version 1.0
 */
@Service
public class AdminServiceImpl implements AdminService {

    private final UsuarioRepository usuarioRepository;
    private final VehiculoRepository vehiculoRepository;
    private final ViajeRepository viajeRepository;
    private final CalificacionRepository calificacionRepository;

    /**
     * Constructor para la inyección de dependencias de los repositorios requeridos.
     *
     * @param usuarioRepository      Repositorio de gestión de usuarios.
     * @param vehiculoRepository     Repositorio de gestión de vehículos.
     * @param viajeRepository        Repositorio de gestión de viajes.
     * @param calificacionRepository Repositorio de valoraciones y calificaciones.
     */
    public AdminServiceImpl(UsuarioRepository usuarioRepository,
                            VehiculoRepository vehiculoRepository,
                            ViajeRepository viajeRepository,
                            CalificacionRepository calificacionRepository) {
        this.usuarioRepository = usuarioRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.viajeRepository = viajeRepository;
        this.calificacionRepository = calificacionRepository;
    }

    /**
     * Recupera una lista filtrada y formateada de usuarios registrados.
     * Si se solicita el rol de chofer y una fecha de viaje, descarta automáticamente aquellos choferes
     * que cuenten con viajes en curso o planificados en la misma ventana de tiempo de la duración estimada.
     *
     * @param rol             Filtro opcional para el rol de usuario.
     * @param search          Cadena de búsqueda para filtrar por nombre, correo, cédula o teléfono.
     * @param activo          Filtro opcional por estado de activación del usuario.
     * @param fechaViaje      Fecha y hora propuestas para comprobar disponibilidad horaria de choferes.
     * @param duracionMinutos Duración en minutos estimada del viaje a programar.
     * @return Lista de mapas conteniendo datos informativos y de rendimiento de los usuarios coincidentes.
     */
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
                .filter(u -> rol == null || rol.isBlank() || rol.equalsIgnoreCase(u.getRol()))
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

    /**
     * Alterna (habilita/deshabilita) el estado de activación de un usuario del sistema.
     *
     * @param usuarioId Identificador único del usuario.
     * @return El {@link Usuario} con su estado modificado.
     * @throws ResourceNotFoundException Si no existe un usuario con el ID provisto.
     */
    @Override
    @Transactional
    public Usuario toggleUserStatus(Long usuarioId) {
        Usuario u = usuarioRepository.findById(usuarioId)
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con el ID: " + usuarioId));

        u.setActivo(!u.getActivo());
        return usuarioRepository.save(u);
    }

    /**
     * Actualiza los datos de perfil y permisos de un usuario desde la consola de administración.
     *
     * @param usuarioId Identificador único del usuario.
     * @param data      Objeto que contiene los nuevos valores a actualizar en el perfil.
     * @return El {@link Usuario} actualizado y persistido.
     * @throws ResourceNotFoundException Si el usuario con el ID especificado no se encuentra registrado.
     */
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

    /**
     * Obtiene y filtra la flota de vehículos según su estado de aprobación y una cadena de búsqueda
     * (placa, marca o modelo).
     *
     * @param estado Estado de registro o aprobación del vehículo (por ejemplo: aprobado, pendiente).
     * @param search Texto para buscar coincidencias parciales de placa, marca o modelo.
     * @return Lista ordenada de {@link Vehiculo} que cumplen con las condiciones de filtro.
     */
    @Override
    public List<Vehiculo> getVehiculosFiltrados(String estado, String search) {
        return vehiculoRepository.findAll().stream()
                .filter(v -> estado == null || estado.isBlank() || estado.equalsIgnoreCase(v.getEstado()))
                .filter(v -> search == null || search.isBlank() ||
                        v.getPlaca().toLowerCase().contains(search.toLowerCase()) ||
                        v.getMarca().toLowerCase().contains(search.toLowerCase()) ||
                        v.getModelo().toLowerCase().contains(search.toLowerCase()))
                .sorted((a, b) -> b.getId().compareTo(a.getId()))
                .collect(Collectors.toList());
    }

    /**
     * Cambia de manera transaccional el estado de aprobación de un vehículo de la plataforma.
     * Si el nuevo estado es "activo", se actualiza también automáticamente el rol del usuario propietario
     * asignándole permisos formales de "chofer".
     *
     * @param vehiculoId  Identificador único del vehículo.
     * @param nuevoEstado Nuevo estado del vehículo a registrar.
     * @return El {@link Vehiculo} actualizado.
     * @throws ResourceNotFoundException Si el vehículo no se encuentra registrado en el sistema.
     */
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

