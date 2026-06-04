package com.ecuaviptour.service.implementation;

import com.ecuaviptour.model.ReservaAsiento;
import com.ecuaviptour.model.Usuario;
import com.ecuaviptour.model.Vehiculo;
import com.ecuaviptour.model.Viaje;
import com.ecuaviptour.repository.ReservaAsientoRepository;
import com.ecuaviptour.repository.UsuarioRepository;
import com.ecuaviptour.repository.VehiculoRepository;
import com.ecuaviptour.repository.ViajeRepository;
import com.ecuaviptour.service.interfaces.ViajeService;
import com.ecuaviptour.exception.BadRequestException;
import com.ecuaviptour.exception.ConflictException;
import com.ecuaviptour.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ViajeServiceImpl implements ViajeService {

    private final ViajeRepository viajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final VehiculoRepository vehiculoRepository;
    private final ReservaAsientoRepository reservaAsientoRepository;

    public ViajeServiceImpl(ViajeRepository viajeRepository,
                            UsuarioRepository usuarioRepository,
                            VehiculoRepository vehiculoRepository,
                            ReservaAsientoRepository reservaAsientoRepository) {
        this.viajeRepository = viajeRepository;
        this.usuarioRepository = usuarioRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.reservaAsientoRepository = reservaAsientoRepository;
    }

    @Override
    public List<Viaje> listar() {
        return viajeRepository.findAll();
    }

    @Override
    public Viaje obtener(Long id) {
        return viajeRepository.findById(id).orElse(null);
    }

    @Override
    public Viaje guardar(Viaje entity) {
        return viajeRepository.save(entity);
    }

    @Override
    public void eliminar(Long id) {
        viajeRepository.deleteById(id);
    }

    @Override
    public Map<String, Object> cotizar(BigDecimal distanciaKm, String tipoServicio, Integer numPasajeros) {
        if (distanciaKm == null || distanciaKm.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("La distancia en kilómetros debe ser mayor a cero.");
        }

        BigDecimal precioBase = BigDecimal.valueOf(15.00); // Standard base price per seat/trip
        BigDecimal total;
        String zona = "Local/Urbana";

        if ("express".equalsIgnoreCase(tipoServicio)) {
            // Express/Private service charges per kilometer
            BigDecimal precioKm = BigDecimal.valueOf(2.50);
            total = distanciaKm.multiply(precioKm).add(BigDecimal.valueOf(10.00));
            zona = total.compareTo(BigDecimal.valueOf(80)) > 0 ? "Nacional / Interprovincial" : "Regional";
        } else if ("encomienda".equalsIgnoreCase(tipoServicio)) {
            // Packages are quoted on base price + package handling surcharge
            total = BigDecimal.valueOf(10.00).add(distanciaKm.multiply(BigDecimal.valueOf(0.50)));
            zona = "Envío Local";
        } else {
            // Standard shared passenger trip: price calculated per passenger seat
            total = BigDecimal.valueOf(numPasajeros).multiply(precioBase);
            if (distanciaKm.compareTo(BigDecimal.valueOf(50)) > 0) {
                total = total.add(distanciaKm.multiply(BigDecimal.valueOf(0.10))); // Long distance surcharge
                zona = "Interprovincial";
            }
        }

        Map<String, Object> result = new HashMap<>();
        result.put("precio_total", total);
        result.put("distancia_km", distanciaKm);
        result.put("tipo_servicio", tipoServicio);
        result.put("zona", zona);
        return result;
    }

    @Override
    @Transactional
    public Viaje reservar(Viaje viaje, List<Integer> asientosReq, Long clienteId, Long choferId, Integer numPasajeros, BigDecimal tarifa) {
        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con el ID: " + clienteId));
        viaje.setCliente(cliente);

        String tipoModalidad = "pasajero".equalsIgnoreCase(viaje.getTipoServicio()) ? "compartido" : "privado_express";
        viaje.setTipoModalidad(tipoModalidad);

        // Standard passenger capacity
        int capacidadMax = 15;
        Long vehiculoId = null;
        Set<Integer> asientosOcupados = new HashSet<>();

        if (choferId != null) {
            Usuario chofer = usuarioRepository.findById(choferId)
                    .orElseThrow(() -> new ResourceNotFoundException("Chofer no encontrado con el ID: " + choferId));
            viaje.setChofer(chofer);

            Vehiculo veh = vehiculoRepository.findByChoferId(choferId)
                    .orElse(null);
            if (veh != null) {
                viaje.setVehiculo(veh);
                capacidadMax = veh.getCapacidadMax();
            }

            // Query physical seats already reserved for the same driver at the same date and time
            if (viaje.getFechaViaje() != null) {
                List<Viaje> sisterViajes = viajeRepository.findByChoferIdOrderByIdDesc(choferId).stream()
                        .filter(sv -> sv.getFechaViaje() != null && sv.getFechaViaje().isEqual(viaje.getFechaViaje()))
                        .filter(sv -> !"cancelado".equalsIgnoreCase(sv.getEstadoLogistico()))
                        .collect(Collectors.toList());

                if (!sisterViajes.isEmpty()) {
                    List<Long> sisterIds = sisterViajes.stream().map(Viaje::getId).collect(Collectors.toList());
                    for (Long sId : sisterIds) {
                        reservaAsientoRepository.findByViajeId(sId).stream()
                                .filter(r -> !"cancelado".equalsIgnoreCase(r.getEstado()))
                                .forEach(r -> asientosOcupados.add(r.getNumeroAsiento()));
                    }
                }
            }
        }

        // Calculate seating requirements
        int cantidadAsientos = (asientosReq != null && !asientosReq.isEmpty()) ? asientosReq.size() : (numPasajeros != null ? numPasajeros : 1);
        BigDecimal precioAsiento = tarifa != null ? tarifa : BigDecimal.valueOf(15.00);
        viaje.setMontoTotal(BigDecimal.valueOf(cantidadAsientos).multiply(precioAsiento));

        List<Integer> asientosFinales = new ArrayList<>();
        if ("compartido".equalsIgnoreCase(tipoModalidad)) {
            if (asientosReq != null && !asientosReq.isEmpty()) {
                // Manual seat validation
                for (Integer seat : asientosReq) {
                    if (seat < 1 || seat > capacidadMax) {
                        throw new BadRequestException("El asiento " + seat + " no es válido para este vehículo de capacidad " + capacidadMax);
                    }
                    if (asientosOcupados.contains(seat)) {
                        throw new ConflictException("El asiento " + seat + " ya está reservado por otro pasajero.");
                    }
                }
                asientosFinales = asientosReq;
            } else {
                // Automatic seating allocation fallback
                for (int seatNum = 1; seatNum <= capacidadMax; seatNum++) {
                    if (!asientosOcupados.contains(seatNum)) {
                        asientosFinales.add(seatNum);
                        if (asientosFinales.size() == cantidadAsientos) {
                            break;
                        }
                    }
                }
                if (asientosOcupados.size() + cantidadAsientos > capacidadMax) {
                    throw new ConflictException("Lo sentimos, no hay suficientes asientos disponibles. Quedan " + (capacidadMax - asientosOcupados.size()) + " libres.");
                }
            }
        } else {
            // Generic/Private bookings reserve generic front seats
            for (int i = 1; i <= cantidadAsientos; i++) {
                asientosFinales.add(i);
            }
        }

        // Validate driver schedule conflicts (superposition checks)
        if (choferId != null && viaje.getFechaViaje() != null) {
            int duration = viaje.getDuracionMinutos() != null ? viaje.getDuracionMinutos() : 30;
            LocalDateTime proposedStart = viaje.getFechaViaje();
            LocalDateTime proposedEnd = proposedStart.plusMinutes(duration);

            List<Viaje> activeViajes = viajeRepository.findByChoferIdOrderByIdDesc(choferId).stream()
                    .filter(v -> v.getFechaViaje() != null)
                    .filter(v -> !"finalizado".equalsIgnoreCase(v.getEstadoLogistico()) && !"cancelado".equalsIgnoreCase(v.getEstadoLogistico()))
                    .collect(Collectors.toList());

            boolean hasConflict = false;
            for (Viaje v : activeViajes) {
                LocalDateTime vStart = v.getFechaViaje();
                int vDur = v.getDuracionMinutos() != null ? v.getDuracionMinutos() : 30;
                LocalDateTime vEnd = vStart.plusMinutes(vDur);

                // Same route, same departure time for shared travels rides together in the same vehicle without conflict!
                if (vStart.isEqual(proposedStart) && "compartido".equalsIgnoreCase(v.getTipoModalidad()) && "compartido".equalsIgnoreCase(tipoModalidad)) {
                    continue;
                }

                // Superposition conflict
                if (vStart.isBefore(proposedEnd) && proposedStart.isBefore(vEnd)) {
                    hasConflict = true;
                    break;
                }
            }

            if (hasConflict) {
                throw new ConflictException("El conductor seleccionado ya tiene un viaje programado, activo o en ruta que coincide o se cruza con ese horario. Por favor, seleccione otro conductor u horario.");
            }
        }

        viaje.setEstadoPago("pendiente");
        viaje.setEstadoLogistico("pendiente");
        viaje.setFechaCreacion(LocalDateTime.now());
        viaje.setFechaLimitePago(LocalDateTime.now().plusMinutes(15)); // 15 minutes limit to pay after quoting/reserving

        Viaje savedViaje = viajeRepository.save(viaje);

        // Save physical seat allocations to database
        for (Integer seat : asientosFinales) {
            ReservaAsiento res = ReservaAsiento.builder()
                    .viaje(savedViaje)
                    .cliente(cliente)
                    .numeroAsiento(seat)
                    .fechaReserva(LocalDateTime.now())
                    .estado("pendiente")
                    .build();
            reservaAsientoRepository.save(res);
        }

        return savedViaje;
    }

    @Override
    public List<Viaje> getViajesCliente(Long clienteId) {
        return viajeRepository.findByClienteIdOrderByIdDesc(clienteId);
    }

    @Override
    public List<Viaje> getViajesChofer(Long choferId) {
        return viajeRepository.findByChoferIdOrderByIdDesc(choferId);
    }

    @Override
    public List<Viaje> getViajesPendientesChofer() {
        return viajeRepository.findByEstadoLogisticoOrderByIdDesc("buscando_chofer");
    }

    @Override
    public List<Viaje> getAllViajes() {
        return viajeRepository.findAllByOrderByIdDesc();
    }

    @Override
    public Optional<Viaje> getViajeById(Long id) {
        return viajeRepository.findById(id);
    }

    @Override
    public List<Integer> getAsientosOcupados(Long viajeId) {
        return reservaAsientoRepository.findByViajeId(viajeId).stream()
                .filter(r -> !"cancelado".equalsIgnoreCase(r.getEstado()))
                .map(ReservaAsiento::getNumeroAsiento)
                .collect(Collectors.toList());
    }

    @Override
    public Optional<Viaje> getViajeActivo(Long userId) {
        Usuario user = usuarioRepository.findById(userId).orElse(null);
        if (user != null && "chofer".equalsIgnoreCase(user.getRol())) {
            return viajeRepository.findByChoferIdOrderByIdDesc(userId).stream()
                    .filter(v -> Arrays.asList("aceptado", "esperando_cliente", "en_curso").contains(v.getEstadoLogistico().toLowerCase()))
                    .findFirst();
        }
        return viajeRepository.findByClienteIdOrderByIdDesc(userId).stream()
                .filter(v -> Arrays.asList("asignado", "en_curso", "confirmado").contains(v.getEstadoLogistico().toLowerCase()))
                .findFirst();
    }
}
