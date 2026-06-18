package com.ecuaviptour.controller;

import com.ecuaviptour.modules.viajes.domain.Viaje;
import com.ecuaviptour.modules.viajes.domain.Reserva;
import com.ecuaviptour.modules.gastos.domain.Gasto;
import com.ecuaviptour.modules.viajes.repository.ViajeRepository;
import com.ecuaviptour.modules.viajes.repository.ReservaRepository;
import com.ecuaviptour.modules.gastos.repository.GastoRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.PrintWriter;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.time.format.DateTimeFormatter;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/admin/reportes")
@Transactional(readOnly = true)
public class ReportesController {

    private final ViajeRepository viajeRepository;
    private final ReservaRepository reservaRepository;
    private final GastoRepository gastoRepository;

    public ReportesController(ViajeRepository viajeRepository,
                              ReservaRepository reservaRepository,
                              GastoRepository gastoRepository) {
        this.viajeRepository = viajeRepository;
        this.reservaRepository = reservaRepository;
        this.gastoRepository = gastoRepository;
    }

    private LocalDateTime[] getRangeLimits(String period, String startDateStr, String endDateStr) {
        LocalDateTime startLimit = null;
        LocalDateTime endLimit = null;

        if ("today".equalsIgnoreCase(period)) {
            startLimit = LocalDateTime.now().withHour(0).withMinute(0).withSecond(0).withNano(0);
            endLimit = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        } else if ("week".equalsIgnoreCase(period)) {
            startLimit = LocalDateTime.now().minus(6, ChronoUnit.DAYS).withHour(0).withMinute(0).withSecond(0).withNano(0);
            endLimit = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        } else if ("month".equalsIgnoreCase(period)) {
            startLimit = LocalDateTime.now().minus(29, ChronoUnit.DAYS).withHour(0).withMinute(0).withSecond(0).withNano(0);
            endLimit = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        } else if ("year".equalsIgnoreCase(period)) {
            startLimit = LocalDateTime.now().withDayOfYear(1).withHour(0).withMinute(0).withSecond(0).withNano(0);
            endLimit = LocalDateTime.now().withHour(23).withMinute(59).withSecond(59).withNano(999999999);
        } else if ("custom".equalsIgnoreCase(period)) {
            if (startDateStr != null && !startDateStr.isBlank()) {
                try {
                    startLimit = java.time.LocalDate.parse(startDateStr).atStartOfDay();
                } catch (Exception e) {
                    try {
                        startLimit = LocalDateTime.parse(startDateStr.replace(" ", "T"));
                    } catch (Exception ex) {
                        startLimit = null;
                    }
                }
            }
            if (endDateStr != null && !endDateStr.isBlank()) {
                try {
                    endLimit = java.time.LocalDate.parse(endDateStr).atTime(23, 59, 59, 999999999);
                } catch (Exception e) {
                    try {
                        endLimit = LocalDateTime.parse(endDateStr.replace(" ", "T"));
                    } catch (Exception ex) {
                        endLimit = null;
                    }
                }
            }
        }
        return new LocalDateTime[]{startLimit, endLimit};
    }

    @GetMapping(value = "/ingresos", produces = "text/csv")
    public void descargarIngresos(
            @RequestParam(value = "periodo", defaultValue = "month") String period,
            @RequestParam(value = "fecha_inicio", required = false) String startDateStr,
            @RequestParam(value = "fecha_fin", required = false) String endDateStr,
            HttpServletResponse response) throws IOException {

        LocalDateTime[] limits = getRangeLimits(period, startDateStr, endDateStr);
        LocalDateTime finalStart = limits[0];
        LocalDateTime finalEnd = limits[1];

        // Filter Viaje incomes (approved/paid)
        List<Viaje> allTrips = viajeRepository.findAll();
        List<Viaje> filteredTrips = allTrips.stream()
                .filter(v -> v.getFechaCreacion() != null)
                .filter(v -> finalStart == null || v.getFechaCreacion().isAfter(finalStart) || v.getFechaCreacion().isEqual(finalStart))
                .filter(v -> finalEnd == null || v.getFechaCreacion().isBefore(finalEnd) || v.getFechaCreacion().isEqual(finalEnd))
                .filter(v -> "aprobado".equalsIgnoreCase(v.getEstadoPago()) || "pagado".equalsIgnoreCase(v.getEstadoPago()))
                .collect(Collectors.toList());

        // Filter Reserva incomes (confirmed/abordo)
        List<Reserva> allReservations = reservaRepository.findAll();
        List<Reserva> filteredReservations = allReservations.stream()
                .filter(r -> r.getFechaReserva() != null)
                .filter(r -> finalStart == null || r.getFechaReserva().isAfter(finalStart) || r.getFechaReserva().isEqual(finalStart))
                .filter(r -> finalEnd == null || r.getFechaReserva().isBefore(finalEnd) || r.getFechaReserva().isEqual(finalEnd))
                .filter(r -> Arrays.asList("confirmado", "abordo").contains(r.getEstadoPago().toLowerCase()))
                .collect(Collectors.toList());

        // Configure CSV response
        response.setContentType("text/csv; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"reporte_ingresos_" + period + ".csv\"");

        PrintWriter writer = response.getWriter();
        // Write UTF-8 BOM for Excel compatibility
        writer.write('\uFEFF');
        writer.println("ID,Tipo Servicio,Cliente,Origen,Destino,Monto,Estado Pago,Estado Logístico,Fecha");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        // Write Viajes (Express / Encomiendas)
        for (Viaje v : filteredTrips) {
            String cleanCliente = v.getCliente() != null ? v.getCliente().getNombre().replace("\"", "\"\"") : "Sistema";
            String cleanOrigen = v.getDirOrigen() != null ? v.getDirOrigen().replace("\"", "\"\"") : "";
            String cleanDestino = v.getDirDestino() != null ? v.getDirDestino().replace("\"", "\"\"") : "";
            double monto = v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0;

            writer.println(String.format("%d,\"%s\",\"%s\",\"%s\",\"%s\",%.2f,\"%s\",\"%s\",\"%s\"",
                    v.getId(),
                    v.getTipoServicio() != null ? v.getTipoServicio() : "express",
                    cleanCliente,
                    cleanOrigen,
                    cleanDestino,
                    monto,
                    v.getEstadoPago(),
                    v.getEstadoLogistico() != null ? v.getEstadoLogistico() : "pendiente",
                    v.getFechaCreacion().format(dtf)
            ));
        }

        // Write Reservas (Compartidos / Van Seat Bookings)
        for (Reserva r : filteredReservations) {
            String cleanCliente = r.getUsuario() != null ? r.getUsuario().getNombre().replace("\"", "\"\"") : "Sistema";
            String cleanOrigen = r.getViajeProgramado() != null && r.getViajeProgramado().getDirOrigen() != null ? r.getViajeProgramado().getDirOrigen().replace("\"", "\"\"") : "";
            String cleanDestino = r.getViajeProgramado() != null && r.getViajeProgramado().getDirDestino() != null ? r.getViajeProgramado().getDirDestino().replace("\"", "\"\"") : "";
            double monto = r.getViajeProgramado() != null && r.getViajeProgramado().getPrecioAsiento() != null ? r.getViajeProgramado().getPrecioAsiento().doubleValue() : 0.0;

            writer.println(String.format("%d,\"compartido\",\"%s\",\"%s\",\"%s\",%.2f,\"%s\",\"%s\",\"%s\"",
                    r.getId() + 100000000L,
                    cleanCliente,
                    cleanOrigen,
                    cleanDestino,
                    monto,
                    r.getEstadoPago(),
                    "finalizado", // reservations only count as income when paid/done
                    r.getFechaReserva().format(dtf)
            ));
        }

        writer.flush();
    }

    @GetMapping(value = "/gastos", produces = "text/csv")
    public void descargarGastos(
            @RequestParam(value = "periodo", defaultValue = "month") String period,
            @RequestParam(value = "fecha_inicio", required = false) String startDateStr,
            @RequestParam(value = "fecha_fin", required = false) String endDateStr,
            HttpServletResponse response) throws IOException {

        LocalDateTime[] limits = getRangeLimits(period, startDateStr, endDateStr);
        LocalDateTime finalStart = limits[0];
        LocalDateTime finalEnd = limits[1];

        // Filter Gastos
        List<Gasto> allGastos = gastoRepository.findAll();
        List<Gasto> filteredGastos = allGastos.stream()
                .filter(g -> g.getFecha() != null)
                .filter(g -> finalStart == null || g.getFecha().isAfter(finalStart) || g.getFecha().isEqual(finalStart))
                .filter(g -> finalEnd == null || g.getFecha().isBefore(finalEnd) || g.getFecha().isEqual(finalEnd))
                .collect(Collectors.toList());

        // Configure CSV response
        response.setContentType("text/csv; charset=UTF-8");
        response.setCharacterEncoding("UTF-8");
        response.setHeader("Content-Disposition", "attachment; filename=\"reporte_gastos_" + period + ".csv\"");

        PrintWriter writer = response.getWriter();
        // Write UTF-8 BOM for Excel compatibility
        writer.write('\uFEFF');
        writer.println("ID,Categoría,Descripción,Monto,Registrado Por,Fecha");

        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

        for (Gasto g : filteredGastos) {
            String cleanCat = g.getCategoria() != null ? g.getCategoria().replace("\"", "\"\"") : "Otros";
            String cleanDesc = g.getDescripcion() != null ? g.getDescripcion().replace("\"", "\"\"") : "";
            String cleanAdmin = g.getAdministrador() != null ? g.getAdministrador().getNombre().replace("\"", "\"\"") : "Sistema";
            double monto = g.getMonto() != null ? g.getMonto().doubleValue() : 0.0;

            writer.println(String.format("%d,\"%s\",\"%s\",%.2f,\"%s\",\"%s\"",
                    g.getId(),
                    cleanCat,
                    cleanDesc,
                    monto,
                    cleanAdmin,
                    g.getFecha().format(dtf)
            ));
        }

        writer.flush();
    }
}
