package com.ecuaviptour.controller;

import com.ecuaviptour.model.Vehiculo;
import com.ecuaviptour.model.Usuario;
import com.ecuaviptour.service.interfaces.DriverService;
import com.ecuaviptour.service.interfaces.ViajeService;
import com.ecuaviptour.repository.UsuarioRepository;
import com.ecuaviptour.exception.UnauthorizedException;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.stream.Collectors;

import org.springframework.transaction.annotation.Transactional;

@RestController
@RequestMapping("/api/chofer")
@Transactional
public class ChoferController {

    private final DriverService driverService;
    private final ViajeService viajeService;
    private final UsuarioRepository usuarioRepository;

    public ChoferController(DriverService driverService, 
                            ViajeService viajeService, 
                            UsuarioRepository usuarioRepository) {
        this.driverService = driverService;
        this.viajeService = viajeService;
        this.usuarioRepository = usuarioRepository;
    }

    @GetMapping("/vehiculo")
    public ResponseEntity<Object> getVehiculo() {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario driver = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Chofer no autenticado."));

        Optional<Vehiculo> v = driverService.getVehiculoByChoferId(driver.getId());
        if (v.isEmpty()) {
            return ResponseEntity.ok(Collections.emptyMap());
        }
        
        Vehiculo veh = v.get();
        Map<String, Object> map = new HashMap<>();
        map.put("id", veh.getId());
        map.put("placa", veh.getPlaca() != null ? veh.getPlaca() : "");
        map.put("marca", veh.getMarca() != null ? veh.getMarca() : "");
        map.put("modelo", veh.getModelo() != null ? veh.getModelo() : "");
        map.put("anio", veh.getAnio() != null ? veh.getAnio() : 0);
        map.put("tipo_vehiculo", veh.getTipoVehiculo() != null ? veh.getTipoVehiculo() : "");
        map.put("capacidad_max", veh.getCapacidadMax() != null ? veh.getCapacidadMax() : 15);
        map.put("color", veh.getColor() != null ? veh.getColor() : "");
        map.put("estado", veh.getEstado() != null ? veh.getEstado() : "pendiente");
        map.put("foto_auto_url", veh.getFotoAutoUrl() != null ? veh.getFotoAutoUrl() : "");
        map.put("foto_matricula_url", veh.getFotoMatriculaUrl() != null ? veh.getFotoMatriculaUrl() : "");
        map.put("foto_licencia_url", veh.getFotoLicenciaUrl() != null ? veh.getFotoLicenciaUrl() : "");
        map.put("licencia_tipo", veh.getLicenciaTipo() != null ? veh.getLicenciaTipo() : "");
        map.put("licencia_vigencia", veh.getLicenciaVigencia() != null ? veh.getLicenciaVigencia() : "");
        
        return ResponseEntity.ok(map);
    }

    @PostMapping("/vehiculo")
    public ResponseEntity<Map<String, Object>> updateVehiculo(
            @RequestParam(value = "placa", required = false) String placa,
            @RequestParam(value = "marca", required = false) String marca,
            @RequestParam(value = "modelo", required = false) String modelo,
            @RequestParam(value = "anio", required = false) Integer anio,
            @RequestParam(value = "tipo_vehiculo", required = false) String tipoVehiculo,
            @RequestParam(value = "capacidad_max", required = false) Integer capacidadMax,
            @RequestParam(value = "color", required = false) String color,
            @RequestParam(value = "licencia_tipo", required = false) String licenciaTipo,
            @RequestParam(value = "licencia_vigencia", required = false) String licenciaVigencia,
            @RequestParam(value = "foto_auto", required = false) MultipartFile fotoAuto,
            @RequestParam(value = "foto_matricula", required = false) MultipartFile fotoMatricula,
            @RequestParam(value = "foto_licencia", required = false) MultipartFile fotoLicencia) throws IOException {

        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario driver = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Chofer no autenticado."));

        String userDir = System.getProperty("user.dir");
        String uploadDir = Paths.get(userDir, "uploads", "vehiculos").toString();
        File folder = new File(uploadDir);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        Vehiculo payload = Vehiculo.builder()
                .placa(placa)
                .marca(marca)
                .modelo(modelo)
                .anio(anio)
                .tipoVehiculo(tipoVehiculo)
                .capacidadMax(capacidadMax != null ? capacidadMax : 15)
                .color(color)
                .licenciaTipo(licenciaTipo)
                .licenciaVigencia(licenciaVigencia)
                .build();

        if (fotoAuto != null && !fotoAuto.isEmpty()) {
            String filename = "chofer_" + driver.getId() + "_foto_auto_" + UUID.randomUUID().toString() + "_" + fotoAuto.getOriginalFilename();
            Files.write(Paths.get(uploadDir, filename), fotoAuto.getBytes());
            payload.setFotoAutoUrl("uploads/vehiculos/" + filename);
        }
        if (fotoMatricula != null && !fotoMatricula.isEmpty()) {
            String filename = "chofer_" + driver.getId() + "_foto_matricula_" + UUID.randomUUID().toString() + "_" + fotoMatricula.getOriginalFilename();
            Files.write(Paths.get(uploadDir, filename), fotoMatricula.getBytes());
            payload.setFotoMatriculaUrl("uploads/vehiculos/" + filename);
        }
        if (fotoLicencia != null && !fotoLicencia.isEmpty()) {
            String filename = "chofer_" + driver.getId() + "_foto_licencia_" + UUID.randomUUID().toString() + "_" + fotoLicencia.getOriginalFilename();
            Files.write(Paths.get(uploadDir, filename), fotoLicencia.getBytes());
            payload.setFotoLicenciaUrl("uploads/vehiculos/" + filename);
        }

        Vehiculo saved = driverService.updateVehiculo(driver.getId(), payload);
        return ResponseEntity.ok(Map.of(
                "message", "Vehículo actualizado correctamente",
                "estado", saved.getEstado()
        ));
    }

    @GetMapping("/viajes/disponibles")
    public ResponseEntity<List<Map<String, Object>>> getViajesDisponibles() {
        List<Map<String, Object>> list = viajeService.getViajesPendientesChofer().stream()
                .map(v -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", v.getId());
                    m.put("origen", v.getDirOrigen());
                    m.put("destino", v.getDirDestino());
                    m.put("distancia_km", v.getDistanciaKm() != null ? v.getDistanciaKm().doubleValue() : 0.0);
                    m.put("tarifa", v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0);
                    m.put("tipo_servicio", v.getTipoServicio());
                    m.put("fecha", v.getFechaCreacion() != null ? v.getFechaCreacion().toString() : "");
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(list);
    }

    @GetMapping("/mis-viajes")
    public ResponseEntity<List<Map<String, Object>>> getMisViajes() {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        Usuario driver = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Chofer no autenticado."));

        List<Map<String, Object>> list = viajeService.getViajesChofer(driver.getId()).stream()
                .map(v -> {
                    Map<String, Object> m = new HashMap<>();
                    m.put("id", v.getId());
                    m.put("cliente", v.getCliente() != null ? v.getCliente().getNombre() : "N/A");
                    m.put("origen", v.getDirOrigen());
                    m.put("destino", v.getDirDestino());
                    m.put("distancia_km", v.getDistanciaKm() != null ? v.getDistanciaKm().doubleValue() : 0.0);
                    m.put("monto", v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0);
                    m.put("estado_logistico", v.getEstadoLogistico());
                    m.put("tipo_servicio", v.getTipoServicio());
                    m.put("fecha", v.getFechaCreacion() != null ? v.getFechaCreacion().toString() : "");
                    return m;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(list);
    }
}
