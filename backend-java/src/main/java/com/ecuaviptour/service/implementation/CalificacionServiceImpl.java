package com.ecuaviptour.service.implementation;

import com.ecuaviptour.model.Calificacion;
import com.ecuaviptour.model.Usuario;
import com.ecuaviptour.model.Viaje;
import com.ecuaviptour.repository.CalificacionRepository;
import com.ecuaviptour.repository.UsuarioRepository;
import com.ecuaviptour.repository.ViajeRepository;
import com.ecuaviptour.service.interfaces.CalificacionService;
import com.ecuaviptour.exception.ConflictException;
import com.ecuaviptour.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class CalificacionServiceImpl implements CalificacionService {

    private final CalificacionRepository calificacionRepository;
    private final ViajeRepository viajeRepository;
    private final UsuarioRepository usuarioRepository;

    public CalificacionServiceImpl(CalificacionRepository calificacionRepository,
                                   ViajeRepository viajeRepository,
                                   UsuarioRepository usuarioRepository) {
        this.calificacionRepository = calificacionRepository;
        this.viajeRepository = viajeRepository;
        this.usuarioRepository = usuarioRepository;
    }

    @Override
    public List<Calificacion> listar() {
        return calificacionRepository.findAll();
    }

    @Override
    public Calificacion obtener(Long id) {
        return calificacionRepository.findById(id).orElse(null);
    }

    @Override
    public Calificacion guardar(Calificacion entity) {
        return calificacionRepository.save(entity);
    }

    @Override
    public void eliminar(Long id) {
        calificacionRepository.deleteById(id);
    }

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

    @Override
    public List<Calificacion> getCalificacionesByViaje(Long viajeId) {
        return calificacionRepository.findByViajeId(viajeId);
    }

    @Override
    public Optional<Calificacion> getCalificacionPorViajeYCliente(Long viajeId, Long clienteId) {
        return calificacionRepository.findByViajeIdAndClienteId(viajeId, clienteId);
    }
}
