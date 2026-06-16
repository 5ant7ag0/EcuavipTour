package com.ecuaviptour.modules.viajes.service;

import com.ecuaviptour.modules.viajes.repository.ReservaAsientoRepository;
import com.ecuaviptour.modules.viajes.repository.ViajeRepository;
import com.ecuaviptour.modules.viajes.domain.ReservaAsiento;
import com.ecuaviptour.modules.viajes.domain.Viaje;
import com.ecuaviptour.shared.service.SocketIOService;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Planificador en segundo plano (Scheduler) para la limpieza y cancelación automática de viajes.
 * Monitorea periódicamente las reservas activas y cancela transaccionalmente aquellos viajes
 * cuyo plazo para subir el comprobante de pago haya expirado sin confirmación.
 *
 * @author Santiago T.
 * @version 1.1
 */
@Component
public class ViajeCleanupScheduler {

    private final ViajeRepository viajeRepository;
    private final ReservaAsientoRepository reservaAsientoRepository;
    private final SocketIOService socketIOService;
    private final ReservaService reservaService;

    /**
     * Constructor para inyección de repositorios y servicios de sockets en tiempo real.
     */
    public ViajeCleanupScheduler(ViajeRepository viajeRepository,
                                 ReservaAsientoRepository reservaAsientoRepository,
                                 SocketIOService socketIOService,
                                 ReservaService reservaService) {
        this.viajeRepository = viajeRepository;
        this.reservaAsientoRepository = reservaAsientoRepository;
        this.socketIOService = socketIOService;
        this.reservaService = reservaService;
    }

    /**
     * Tarea programada para limpiar reservas expiradas individuales cada 10 segundos.
     */
    @Scheduled(fixedDelay = 10000)
    @Transactional
    public void cleanupExpiredReservations() {
        reservaService.cancelarReservasExpiradas();
    }

    /**
     * Tarea programada ejecutada con un retardo fijo de 10 segundos.
     * Busca los viajes pendientes de pago o rechazados que superen la fecha límite de pago,
     * cambia su estado logístico a "cancelado", libera el chofer y el vehículo asignado,
     * marca los asientos reservados correspondientes como "cancelados", y difunde el aviso de cancelación
     * por Socket.IO en tiempo real a los clientes y conductores afectados.
     */
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

