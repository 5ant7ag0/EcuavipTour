package com.ecuaviptour.service.implementation;

import com.ecuaviptour.model.Pago;
import com.ecuaviptour.model.Viaje;
import com.ecuaviptour.repository.PagoRepository;
import com.ecuaviptour.repository.ViajeRepository;
import com.ecuaviptour.service.interfaces.PagoService;
import com.ecuaviptour.exception.ResourceNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class PagoServiceImpl implements PagoService {

    private final PagoRepository pagoRepository;
    private final ViajeRepository viajeRepository;

    public PagoServiceImpl(PagoRepository pagoRepository, ViajeRepository viajeRepository) {
        this.pagoRepository = pagoRepository;
        this.viajeRepository = viajeRepository;
    }

    @Override
    public List<Pago> listar() {
        return pagoRepository.findAll();
    }

    @Override
    public Pago obtener(Long id) {
        return pagoRepository.findById(id).orElse(null);
    }

    @Override
    public Pago guardar(Pago entity) {
        return pagoRepository.save(entity);
    }

    @Override
    public void eliminar(Long id) {
        pagoRepository.deleteById(id);
    }

    @Override
    @Transactional
    public Pago registrarPago(Long viajeId, String comprobanteUrl, BigDecimal monto) {
        Viaje viaje = viajeRepository.findById(viajeId)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado con el ID: " + viajeId));

        Optional<Pago> existingPagoOpt = pagoRepository.findByViajeId(viajeId);
        Pago pago;
        if (existingPagoOpt.isPresent()) {
            pago = existingPagoOpt.get();
            pago.setComprobanteUrl(comprobanteUrl);
            pago.setMontoPagado(monto != null ? monto : viaje.getMontoTotal());
            pago.setFechaPago(LocalDateTime.now());
        } else {
            pago = Pago.builder()
                    .viaje(viaje)
                    .comprobanteUrl(comprobanteUrl)
                    .montoPagado(monto != null ? monto : viaje.getMontoTotal())
                    .fechaPago(LocalDateTime.now())
                    .build();
        }

        viaje.setEstadoPago("comprobante_subido");
        viaje.setComentarioRechazo(null);
        viajeRepository.save(viaje);

        return pagoRepository.save(pago);
    }

    @Override
    @Transactional
    public Viaje confirmarPago(Long viajeId) {
        Viaje viaje = viajeRepository.findById(viajeId)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado con el ID: " + viajeId));

        viaje.setEstadoPago("pagado");
        if ("pendiente".equalsIgnoreCase(viaje.getEstadoLogistico()) || "buscando_chofer".equalsIgnoreCase(viaje.getEstadoLogistico())) {
            viaje.setEstadoLogistico("confirmado");
        }
        return viajeRepository.save(viaje);
    }

    @Override
    @Transactional
    public Viaje rechazarPago(Long viajeId) {
        Viaje viaje = viajeRepository.findById(viajeId)
                .orElseThrow(() -> new ResourceNotFoundException("Viaje no encontrado con el ID: " + viajeId));

        viaje.setEstadoPago("rechazado");
        return viajeRepository.save(viaje);
    }

    @Override
    public Optional<Pago> getPagoByViajeId(Long viajeId) {
        return pagoRepository.findByViajeId(viajeId);
    }
}
