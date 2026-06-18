package com.ecuaviptour.modules.viajes.service;

import com.ecuaviptour.modules.viajes.repository.ReservaAsientoRepository;

import com.ecuaviptour.modules.viajes.repository.ViajeRepository;

import com.ecuaviptour.modules.viajes.domain.ReservaAsiento;

import com.ecuaviptour.modules.viajes.domain.Viaje;

import com.ecuaviptour.modules.viajes.domain.ReservaAsiento;
import com.ecuaviptour.modules.users.domain.Usuario;
import com.ecuaviptour.modules.vehiculos.domain.Vehiculo;
import com.ecuaviptour.modules.viajes.domain.Viaje;
import com.ecuaviptour.modules.viajes.repository.ReservaAsientoRepository;
import com.ecuaviptour.modules.users.repository.UsuarioRepository;
import com.ecuaviptour.modules.vehiculos.repository.VehiculoRepository;
import com.ecuaviptour.modules.viajes.repository.ViajeRepository;

import com.ecuaviptour.exception.BadRequestException;
import com.ecuaviptour.exception.ConflictException;
import com.ecuaviptour.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Implementación de la capa de servicios para la gestión de solicitudes, reservas y logística de viajes.
 * Centraliza la lógica de cotización automatizada de tarifas, la asignación física o aleatoria de asientos,
 * el control estricto de colisión de horarios y superposiciones para conductores,
 * y la persistencia de itinerarios.
 *
 * @author Santiago T.
 * @version 1.0
 */
@Service
public class ViajeServiceImpl implements ViajeService {

    private final ViajeRepository viajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final VehiculoRepository vehiculoRepository;
    private final ReservaAsientoRepository reservaAsientoRepository;

    /**
     * Constructor para la inyección de repositorios clave del negocio de viajes.
     *
     * @param viajeRepository          Repositorio de viajes.
     * @param usuarioRepository      Repositorio de usuarios.
     * @param vehiculoRepository     Repositorio de vehículos.
     * @param reservaAsientoRepository Repositorio de asignación de asientos.
     */
    public ViajeServiceImpl(ViajeRepository viajeRepository,
                            UsuarioRepository usuarioRepository,
                            VehiculoRepository vehiculoRepository,
                            ReservaAsientoRepository reservaAsientoRepository) {
        this.viajeRepository = viajeRepository;
        this.usuarioRepository = usuarioRepository;
        this.vehiculoRepository = vehiculoRepository;
        this.reservaAsientoRepository = reservaAsientoRepository;
    }

    /**
     * Obtiene todos los viajes almacenados en el sistema sin un ordenamiento particular.
     *
     * @return Lista de todos los {@link Viaje}.
     */
    @Override
    public List<Viaje> listar() {
        return viajeRepository.findAll();
    }

    /**
     * Obtiene la información detallada de un viaje a través de su identificador único.
     *
     * @param id Identificador único del viaje.
     * @return El {@link Viaje} correspondiente, o null si no se encuentra registrado.
     */
    @Override
    public Viaje obtener(Long id) {
        return viajeRepository.findById(id).orElse(null);
    }

    /**
     * Guarda o actualiza un registro de viaje en la base de datos.
     *
     * @param entity Viaje a persistir.
     * @return El {@link Viaje} persistido.
     */
    @Override
    public Viaje guardar(Viaje entity) {
        return viajeRepository.save(entity);
    }

    /**
     * Elimina un viaje de la base de datos según su identificador único.
     *
     * @param id Identificador único del viaje a eliminar.
     */
    @Override
    public void eliminar(Long id) {
        viajeRepository.deleteById(id);
    }

    /**
     * Genera una cotización en tiempo real basada en la distancia en kilómetros, el tipo de servicio y pasajeros.
     * Soporta modalidades como express (costo por kilómetro), encomienda (tarifa plana de envío) y pasaje compartido (por asiento).
     *
     * @param distanciaKm  Distancia estimada en kilómetros.
     * @param tipoServicio Tipo de servicio solicitado ('express', 'encomienda', 'pasajero').
     * @param numPasajeros Cantidad de pasajeros para la cotización de asientos.
     * @return Un mapa conteniendo el precio total calculado, la distancia, modalidad y zona de clasificación.
     * @throws BadRequestException Si la distancia es nula o menor/igual a cero.
     */
    @Override
    public Map<String, Object> cotizar(BigDecimal distanciaKm, String tipoServicio, Integer numPasajeros) {
        if (distanciaKm == null || distanciaKm.compareTo(BigDecimal.ZERO) <= 0) {
            throw new BadRequestException("La distancia en kilómetros debe ser mayor a cero.");
        }

        BigDecimal precioBase = BigDecimal.valueOf(15.00); // Standard base price per seat/trip
        BigDecimal total;
        String zona = "Local/Urbana";

        if ("express".equalsIgnoreCase(tipoServicio)) {
            // Express/Private service charges per kilometer (Uber-like pricing)
            BigDecimal precioKm = BigDecimal.valueOf(0.45);
            BigDecimal baseFare = BigDecimal.valueOf(2.50);
            total = distanciaKm.multiply(precioKm).add(baseFare);
            BigDecimal minFare = BigDecimal.valueOf(3.50);
            if (total.compareTo(minFare) < 0) {
                total = minFare;
            }
            total = total.setScale(2, java.math.RoundingMode.HALF_UP);
            zona = total.compareTo(BigDecimal.valueOf(30.00)) > 0 ? "Nacional / Interprovincial" : "Regional";
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

    /**
     * Procesa y registra transaccionalmente una reserva formal de viaje y sus respectivos asientos.
     * Implementa flujos clave de negocio:
     * - Carga y valida el cliente de la reserva.
     * - Si se asigna conductor, asocia su vehículo y calcula asientos libres en base a otros viajes compartidos del conductor a la misma fecha y hora.
     * - Reserva físicamente los asientos provistos (validando capacidad y colisiones), o auto-asigna de forma secuencial los primeros disponibles si no se especifican.
     * - Verifica conflictos de itinerarios para el chofer: valida superposiciones horarias con un margen de duración estimada, bloqueando reservas con cruces excepto si son viajes compartidos en idéntica ventana.
     * - Define la fecha límite de pago (15 minutos de tolerancia para subir comprobante).
     *
     * @param viaje        Datos base del viaje.
     * @param asientosReq  Lista de números de asientos solicitados manualmente.
     * @param clienteId    Identificador del cliente solicitante.
     * @param choferId     Identificador único del chofer (puede ser nulo si se requiere asignación posterior).
     * @param numPasajeros Cantidad de pasajeros (asientos) a reservar.
     * @param tarifa       Tarifa unitaria aplicada por asiento.
     * @return El {@link Viaje} guardado con sus relaciones establecidas.
     * @throws ResourceNotFoundException Si el cliente o chofer especificados no existen.
     * @throws BadRequestException       Si el número de asiento solicitado no pertenece a la capacidad del vehículo.
     * @throws ConflictException         Si un asiento solicitado ya está ocupado, o el chofer presenta colisión horaria.
     */
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

        if ("aprobado".equalsIgnoreCase(viaje.getEstadoPago())) {
            viaje.setEstadoPago("aprobado");
            if (choferId != null) {
                viaje.setEstadoLogistico("aceptado");
            } else {
                viaje.setEstadoLogistico("buscando_chofer");
            }
        } else {
            viaje.setEstadoPago("pendiente");
            viaje.setEstadoLogistico("pendiente");
        }
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
                    .estado("aprobado".equalsIgnoreCase(viaje.getEstadoPago()) ? "confirmado" : "pendiente")
                    .build();
            reservaAsientoRepository.save(res);
        }

        return savedViaje;
    }

    /**
     * Obtiene el listado de viajes solicitados por un cliente.
     *
     * @param clienteId Identificador único del cliente.
     * @return Lista de {@link Viaje} ordenados cronológicamente de forma descendente.
     */
    @Override
    public List<Viaje> getViajesCliente(Long clienteId) {
        return viajeRepository.findByClienteIdOrderByIdDesc(clienteId);
    }

    /**
     * Obtiene el listado de viajes asignados a un chofer.
     *
     * @param choferId Identificador único del chofer.
     * @return Lista de {@link Viaje} asignados al chofer.
     */
    @Override
    public List<Viaje> getViajesChofer(Long choferId) {
        return viajeRepository.findByChoferIdOrderByIdDesc(choferId);
    }

    /**
     * Recupera todos los viajes pendientes de conductor (estado logístico 'buscando_chofer').
     *
     * @return Lista de {@link Viaje} que están disponibles para la postulación de choferes.
     */
    @Override
    public List<Viaje> getViajesPendientesChofer() {
        return viajeRepository.findByEstadoLogisticoOrderByIdDesc("buscando_chofer");
    }

    /**
     * Obtiene todos los viajes registrados en el sistema del más reciente al más antiguo.
     *
     * @return Lista completa de {@link Viaje} registrados.
     */
    @Override
    public List<Viaje> getAllViajes() {
        return viajeRepository.findAllByOrderByIdDesc();
    }

    /**
     * Recupera la información de un viaje específico.
     *
     * @param id Identificador único del viaje.
     * @return Un {@link Optional} que contiene el viaje si existe.
     */
    @Override
    public Optional<Viaje> getViajeById(Long id) {
        return viajeRepository.findById(id);
    }

    /**
     * Consulta el listado de asientos ocupados (reservas confirmadas o pendientes, excluyendo canceladas)
     * para un viaje específico.
     *
     * @param viajeId Identificador único del viaje.
     * @return Lista de números de asientos ocupados.
     */
    @Override
    public List<Integer> getAsientosOcupados(Long viajeId) {
        return reservaAsientoRepository.findByViajeId(viajeId).stream()
                .filter(r -> !"cancelado".equalsIgnoreCase(r.getEstado()))
                .map(ReservaAsiento::getNumeroAsiento)
                .collect(Collectors.toList());
    }

    /**
     * Obtiene el viaje actualmente activo de un usuario (sea cliente o chofer).
     * Se considera activo si está en estado 'aceptado', 'esperando_cliente' o 'en_curso' para choferes,
     * o 'asignado', 'en_curso' o 'confirmado' para clientes.
     *
     * @param userId Identificador único del usuario.
     * @return Un {@link Optional} con el viaje activo si existe.
     */
    @Override
    public Optional<Viaje> getViajeActivo(Long userId) {
        Usuario user = usuarioRepository.findById(userId).orElse(null);
        if (user != null && "chofer".equalsIgnoreCase(user.getRol())) {
            return viajeRepository.findByChoferIdOrderByIdDesc(userId).stream()
                    .filter(v -> Arrays.asList("aceptado", "esperando_cliente", "en_curso").contains(v.getEstadoLogistico().toLowerCase()))
                    .findFirst();
        }
        return viajeRepository.findByClienteIdOrderByIdDesc(userId).stream()
                .filter(v -> Arrays.asList("asignado", "aceptado", "esperando_cliente", "en_curso", "confirmado").contains(v.getEstadoLogistico().toLowerCase()))
                .findFirst();
    }
}

