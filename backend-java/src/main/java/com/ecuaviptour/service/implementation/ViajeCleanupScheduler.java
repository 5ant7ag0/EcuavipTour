package com.ecuaviptour.service.implementation;

import com.ecuaviptour.model.ReservaAsiento;
import com.ecuaviptour.model.Viaje;
import com.ecuaviptour.repository.ReservaAsientoRepository;
import com.ecuaviptour.repository.ViajeRepository;
import com.ecuaviptour.service.interfaces.SocketIOService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
public class ViajeCleanupScheduler {

    private final ViajeRepository viajeRepository;
    private final ReservaAsientoRepository reservaAsientoRepository;
    private final SocketIOService socketIOService;

    public ViajeCleanupScheduler(ViajeRepository viajeRepository,
                                 ReservaAsientoRepository reservaAsientoRepository,
                                 SocketIOService socketIOService) {
        this.viajeRepository = viajeRepository;
        this.reservaAsientoRepository = reservaAsientoRepository;
        this.socketIOService = socketIOService;
    }

    @Scheduled(fixedDelay = 10000) // Every 10 seconds
    @Transactional
    public void cleanupExpiredTrips() {
        LocalDateTime now = LocalDateTime.now();
        List<Viaje> expiredTrips = viajeRepository.findAll().stream()
                .filter(v -> ("pendiente".equalsIgnoreCase(v.getEstadoPago()) || "rechazado".equalsIgnoreCase(v.getEstadoPago()))
                        && v.getFechaLimitePago() != null
                        && v.getFechaLimitePago().isBefore(now)
                        && !"cancelado".equalsIgnoreCase(v.getEstadoLogistico()))
                .toList();

        for (Viaje v : expiredTrips) {
            System.out.println("[Scheduler] Cancelando viaje expirado ID: " + v.getId() + ". Límite de pago: " + v.getFechaLimitePago());
            v.setEstadoLogistico("cancelado");
            v.setEstadoPago("cancelado");
            
            Long clienteId = v.getCliente() != null ? v.getCliente().getId() : null;
            Long choferId = v.getChofer() != null ? v.getChofer().getId() : null;
            v.setChofer(null);
            v.setVehiculo(null);
            viajeRepository.save(v);

            List<ReservaAsiento> reservations = reservaAsientoRepository.findByViajeId(v.getId());
            for (ReservaAsiento r : reservations) {
                r.setEstado("cancelado");
                reservaAsientoRepository.save(r);
            }

            // Notify passenger and driver of the cancellation
            socketIOService.broadcastViajeCancelado(v.getId(), "El tiempo límite para realizar el pago ha expirado. Tu viaje ha sido cancelado.", clienteId, choferId);
        }
    }
}
