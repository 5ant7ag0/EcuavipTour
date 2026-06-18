package com.ecuaviptour.modules.users.service;

import com.ecuaviptour.modules.viajes.repository.ViajeRepository;

import com.ecuaviptour.modules.viajes.domain.Viaje;

import com.ecuaviptour.modules.users.domain.Calificacion;
import com.ecuaviptour.modules.users.domain.Usuario;
import com.ecuaviptour.modules.viajes.domain.Viaje;
import com.ecuaviptour.modules.viajes.domain.Reserva;
import com.ecuaviptour.modules.users.repository.CalificacionRepository;
import com.ecuaviptour.modules.users.repository.UsuarioRepository;
import com.ecuaviptour.modules.viajes.repository.ViajeRepository;
import com.ecuaviptour.modules.viajes.repository.ReservaRepository;

import com.ecuaviptour.exception.ConflictException;
import com.ecuaviptour.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

/**
 * Implementación de los servicios para gestionar las valoraciones y calificaciones del sistema.
 * Proporciona lógica de negocio para registrar, consultar y validar reseñas y puntajes en estrellas
 * otorgados por los clientes hacia los viajes realizados.
 *
 * @author Santiago T.
 * @version 1.0
 */
@Service
public class CalificacionServiceImpl implements CalificacionService {

    private final CalificacionRepository calificacionRepository;
    private final ViajeRepository viajeRepository;
    private final UsuarioRepository usuarioRepository;
    private final ReservaRepository reservaRepository;

    /**
     * Constructor para inyectar los repositorios requeridos de calificaciones, viajes, usuarios y reservas.
     */
    public CalificacionServiceImpl(CalificacionRepository calificacionRepository,
                                   ViajeRepository viajeRepository,
                                   UsuarioRepository usuarioRepository,
                                   ReservaRepository reservaRepository) {
        this.calificacionRepository = calificacionRepository;
        this.viajeRepository = viajeRepository;
        this.usuarioRepository = usuarioRepository;
        this.reservaRepository = reservaRepository;
    }

    /**
     * Obtiene el listado completo de calificaciones de la base de datos.
     *
     * @return Lista de todas las {@link Calificacion} registradas.
     */
    @Override
    public List<Calificacion> listar() {
        return calificacionRepository.findAll();
    }

    /**
     * Obtiene una calificación específica a través de su identificador único.
     *
     * @param id Identificador único de la calificación.
     * @return Objeto {@link Calificacion} correspondiente, o null si no se encuentra registrado.
     */
    @Override
    public Calificacion obtener(Long id) {
        return calificacionRepository.findById(id).orElse(null);
    }

    /**
     * Guarda o actualiza una calificación directamente en base de datos.
     *
     * @param entity Calificación a persistir.
     * @return La {@link Calificacion} persistida.
     */
    @Override
    public Calificacion guardar(Calificacion entity) {
        return calificacionRepository.save(entity);
    }

    /**
     * Elimina una calificación de la base de datos según su identificador único.
     *
     * @param id Identificador único de la calificación a eliminar.
     */
    @Override
    public void eliminar(Long id) {
        calificacionRepository.deleteById(id);
    }

    /**
     * Registra de forma transaccional una nueva valoración (calificación en estrellas y comentario)
     * por parte de un cliente para un viaje específico, comprobando que no exista una valoración previa.
     *
     * @param viajeId    Identificador único del viaje realizado.
     * @param clienteId  Identificador único del cliente que califica.
     * @param estrellas  Puntaje otorgado (típicamente de 1 a 5).
     * @param comentario Opinión o reseña en texto sobre la experiencia del viaje.
     * @return La nueva {@link Calificacion} registrada.
     * @throws ResourceNotFoundException Si el viaje o el cliente especificado no existen.
     * @throws ConflictException         Si el cliente ya ha calificado previamente este mismo viaje.
     */
    @Override
    @Transactional
    public Calificacion calificar(Long viajeId, Long clienteId, Integer estrellas, String comentario) {
        Viaje viaje = viajeRepository.findById(viajeId)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado con el ID: " + viajeId));

        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con el ID: " + clienteId));

        // Validate that rating doesn't exist yet to prevent double-reviews
        Optional<Calificacion> existing = calificacionRepository.findByViajeIdAndClienteId(viajeId, clienteId);
        if (existing.isPresent()) {
            throw new ConflictException("Este viaje ya ha sido calificado por el cliente.");
        }

        Calificacion c = Calificacion.builder()
                .viaje(viaje)
                .cliente(cliente)
                .estrellas(estrellas)
                .comentario(comentario)
                .fechaCalificacion(LocalDateTime.now())
                .build();

        return calificacionRepository.save(c);
    }

    /**
     * Recupera las calificaciones registradas para un viaje específico.
     *
     * @param viajeId Identificador único del viaje.
     * @return Lista de {@link Calificacion} asociadas al viaje.
     */
    @Override
    public List<Calificacion> getCalificacionesByViaje(Long viajeId) {
        return calificacionRepository.findByViajeId(viajeId);
    }

    /**
     * Busca la calificación de un viaje que haya sido realizada por un cliente en específico.
     *
     * @param viajeId   Identificador único del viaje.
     * @param clienteId Identificador único del cliente.
     * @return Un {@link Optional} que contiene la calificación si está registrada.
     */
    @Override
    public Optional<Calificacion> getCalificacionPorViajeYCliente(Long viajeId, Long clienteId) {
        return calificacionRepository.findByViajeIdAndClienteId(viajeId, clienteId);
    }

    /**
     * Registra de forma transaccional una nueva valoración (calificación en estrellas y comentario)
     * por parte de un cliente para una reserva de viaje compartido específica, comprobando que no exista una valoración previa.
     */
    @Override
    @Transactional
    public Calificacion calificarReserva(Long reservaId, Long clienteId, Integer estrellas, String comentario) {
        Reserva reserva = reservaRepository.findById(reservaId)
                .orElseThrow(() -> new ResourceNotFoundException("Reserva no encontrada con el ID: " + reservaId));

        Usuario cliente = usuarioRepository.findById(clienteId)
                .orElseThrow(() -> new ResourceNotFoundException("Cliente no encontrado con el ID: " + clienteId));

        // Validar que no exista calificación previa para prevenir valoraciones duplicadas
        Optional<Calificacion> existing = calificacionRepository.findByReservaIdAndClienteId(reservaId, clienteId);
        if (existing.isPresent()) {
            throw new ConflictException("Esta reserva ya ha sido calificada por el cliente.");
        }

        Calificacion c = Calificacion.builder()
                .reserva(reserva)
                .cliente(cliente)
                .estrellas(estrellas)
                .comentario(comentario)
                .fechaCalificacion(LocalDateTime.now())
                .build();

        return calificacionRepository.save(c);
    }

    @Override
    public Optional<Calificacion> getCalificacionPorReservaYCliente(Long reservaId, Long clienteId) {
        return calificacionRepository.findByReservaIdAndClienteId(reservaId, clienteId);
    }
}

