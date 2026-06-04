package com.ecuaviptour.controller;

import com.ecuaviptour.model.Pago;
import com.ecuaviptour.service.interfaces.PagoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Map;
import java.util.UUID;

import com.ecuaviptour.service.interfaces.SocketIOService;

@RestController
@RequestMapping("/api/pagos")
public class PagoController {

    private final PagoService pagoService;
    private final SocketIOService socketIOService;

    public PagoController(PagoService pagoService, SocketIOService socketIOService) {
        this.pagoService = pagoService;
        this.socketIOService = socketIOService;
    }

    @PostMapping("/subir_comprobante")
    public ResponseEntity<Map<String, Object>> subirComprobante(
            @RequestParam("comprobante") MultipartFile file,
            @RequestParam("viaje_id") Long viajeId) throws IOException {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "No se envió ningún archivo"));
        }

        String userDir = System.getProperty("user.dir");
        String uploadDir = Paths.get(userDir, "uploads", "comprobantes").toString();
        File folder = new File(uploadDir);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        String filename = "viaje_" + viajeId + "_comprobante_" + UUID.randomUUID().toString() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir, filename);
        Files.write(filePath, file.getBytes());

        String dbUrl = "uploads/comprobantes/" + filename;
        Pago saved = pagoService.registrarPago(viajeId, dbUrl, null);

        // Notify admins and client of new receipt upload in real-time
        Long clienteId = (saved.getViaje() != null && saved.getViaje().getCliente() != null) ? saved.getViaje().getCliente().getId() : null;
        socketIOService.broadcastNuevoComprobante(viajeId, clienteId);

        return ResponseEntity.ok(Map.of(
                "message", "Comprobante subido exitosamente",
                "pago_id", saved.getId(),
                "comprobante_url", saved.getComprobanteUrl()
        ));
    }
}
