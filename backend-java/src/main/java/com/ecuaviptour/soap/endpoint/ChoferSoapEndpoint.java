package com.ecuaviptour.soap.endpoint;

import com.ecuaviptour.modules.viajes.service.ViajeService;

import com.ecuaviptour.modules.vehiculos.domain.Vehiculo;
import com.ecuaviptour.modules.users.domain.Usuario;
import com.ecuaviptour.modules.users.service.DriverService;
import com.ecuaviptour.modules.viajes.service.ViajeService;
import com.ecuaviptour.modules.users.repository.UsuarioRepository;
import com.ecuaviptour.soap.chofer.*;
import com.ecuaviptour.exception.UnauthorizedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

/**
 * Endpoint del servicio web SOAP destinado a las operaciones específicas del perfil Chofer.
 * Permite a los conductores consultar los datos de su vehículo registrado, postularse y actualizar fichas técnicas,
 * subir fotos del auto o documentos regulatorios decodificados de Base64 a disco, y consultar el historial
 * de viajes personales e itinerarios disponibles en la bolsa.
 *
 * @author Santiago T.
 * @version 1.0
 */
@Endpoint
@Transactional
public class ChoferSoapEndpoint {

    private static final String NAMESPACE_URI = "http://ecuaviptour.com/soap/chofer";

    private final DriverService driverService;
    private final ViajeService viajeService;
    private final UsuarioRepository usuarioRepository;

    /**
     * Constructor para la inyección de dependencias de servicios de chofer, viaje y repositorios de usuarios.
     *
     * @param driverService     Servicio de gestión de vehículos y conductores.
     * @param viajeService      Servicio de itinerarios y reservas.
     * @param usuarioRepository Repositorio de cuentas de usuario.
     */
    public ChoferSoapEndpoint(DriverService driverService,
                              ViajeService viajeService,
                              UsuarioRepository usuarioRepository) {
        this.driverService = driverService;
        this.viajeService = viajeService;
        this.usuarioRepository = usuarioRepository;
    }

    /**
     * Recupera el vehículo registrado y asociado al chofer autenticado actual.
     * Mapeado al request XML {@link GetVehiculoRequest}.
     *
     * @param request Payload XML de la consulta.
     * @return {@link GetVehiculoResponse} con la información técnica y legal del vehículo asignado.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getVehiculoRequest")
    @ResponsePayload
    public GetVehiculoResponse getVehiculo(@RequestPayload GetVehiculoRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        if (userIdStr == null || userIdStr.isBlank() || "anonymousUser".equalsIgnoreCase(userIdStr)) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario driver = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Chofer no autenticado."));

        Optional<Vehiculo> v = driverService.getVehiculoByChoferId(driver.getId());
        GetVehiculoResponse response = new GetVehiculoResponse();

        v.ifPresent(veh -> {
            VehiculoSoapType soap = new VehiculoSoapType();
            soap.setId(veh.getId());
            soap.setPlaca(veh.getPlaca() != null ? veh.getPlaca() : "");
            soap.setMarca(veh.getMarca() != null ? veh.getMarca() : "");
            soap.setModelo(veh.getModelo() != null ? veh.getModelo() : "");
            soap.setAnio(veh.getAnio() != null ? veh.getAnio() : 0);
            soap.setTipoVehiculo(veh.getTipoVehiculo() != null ? veh.getTipoVehiculo() : "");
            soap.setCapacidadMax(veh.getCapacidadMax() != null ? veh.getCapacidadMax() : 15);
            soap.setColor(veh.getColor() != null ? veh.getColor() : "");
            soap.setEstado(veh.getEstado() != null ? veh.getEstado() : "pendiente");
            soap.setFotoAutoUrl(veh.getFotoAutoUrl() != null ? veh.getFotoAutoUrl() : "");
            soap.setFotoMatriculaUrl(veh.getFotoMatriculaUrl() != null ? veh.getFotoMatriculaUrl() : "");
            soap.setFotoLicenciaUrl(veh.getFotoLicenciaUrl() != null ? veh.getFotoLicenciaUrl() : "");
            soap.setLicenciaTipo(veh.getLicenciaTipo() != null ? veh.getLicenciaTipo() : "");
            soap.setLicenciaVigencia(veh.getLicenciaVigencia() != null ? veh.getLicenciaVigencia() : "");
            response.setVehiculo(soap);
        });

        return response;
    }

    /**
     * Actualiza o registra transaccionalmente el vehículo y documentos del chofer.
     * Decodifica imágenes embebidas en Base64 (foto del auto, matrícula, licencia) y las guarda físicamente en disco.
     * Mapeado al request XML {@link UpdateVehiculoRequest}.
     *
     * @param request Payload XML con los datos mecánicos, vigencias y archivos Base64.
     * @return {@link UpdateVehiculoResponse} con la confirmación de la actualización y el nuevo estado (ej. pendiente).
     * @throws IOException Si surgen fallos al escribir las imágenes decodificadas en el servidor.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "updateVehiculoRequest")
    @ResponsePayload
    public UpdateVehiculoResponse updateVehiculo(@RequestPayload UpdateVehiculoRequest request) throws IOException {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        if (userIdStr == null || userIdStr.isBlank() || "anonymousUser".equalsIgnoreCase(userIdStr)) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario driver = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Chofer no autenticado."));

        String userDir = System.getProperty("user.dir");
        String uploadDir = Paths.get(userDir, "uploads", "vehiculos").toString();
        File folder = new File(uploadDir);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        Vehiculo payload = Vehiculo.builder()
                .placa(request.getPlaca())
                .marca(request.getMarca())
                .modelo(request.getModelo())
                .anio(request.getAnio())
                .tipoVehiculo(request.getTipoVehiculo())
                .capacidadMax(request.getCapacidadMax() != null ? request.getCapacidadMax() : 15)
                .color(request.getColor())
                .licenciaTipo(request.getLicenciaTipo())
                .licenciaVigencia(request.getLicenciaVigencia())
                .build();

        if (request.getFotoAutoBase64() != null && !request.getFotoAutoBase64().isEmpty()) {
            String base64Data = request.getFotoAutoBase64();
            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }
            byte[] decoded = Base64.getDecoder().decode(base64Data);
            String filename = "chofer_" + driver.getId() + "_foto_auto_" + UUID.randomUUID().toString() + "_" + request.getFotoAutoFilename();
            Files.write(Paths.get(uploadDir, filename), decoded);
            payload.setFotoAutoUrl("uploads/vehiculos/" + filename);
        }

        if (request.getFotoMatriculaBase64() != null && !request.getFotoMatriculaBase64().isEmpty()) {
            String base64Data = request.getFotoMatriculaBase64();
            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }
            byte[] decoded = Base64.getDecoder().decode(base64Data);
            String filename = "chofer_" + driver.getId() + "_foto_matricula_" + UUID.randomUUID().toString() + "_" + request.getFotoMatriculaFilename();
            Files.write(Paths.get(uploadDir, filename), decoded);
            payload.setFotoMatriculaUrl("uploads/vehiculos/" + filename);
        }

        if (request.getFotoLicenciaBase64() != null && !request.getFotoLicenciaBase64().isEmpty()) {
            String base64Data = request.getFotoLicenciaBase64();
            if (base64Data.contains(",")) {
                base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
            }
            byte[] decoded = Base64.getDecoder().decode(base64Data);
            String filename = "chofer_" + driver.getId() + "_foto_licencia_" + UUID.randomUUID().toString() + "_" + request.getFotoLicenciaFilename();
            Files.write(Paths.get(uploadDir, filename), decoded);
            payload.setFotoLicenciaUrl("uploads/vehiculos/" + filename);
        }

        Vehiculo saved = driverService.updateVehiculo(driver.getId(), payload);

        UpdateVehiculoResponse response = new UpdateVehiculoResponse();
        response.setMessage("Vehiculo actualizado correctamente");
        response.setEstado(saved.getEstado());
        return response;
    }

    /**
     * Obtiene el listado de todos los viajes aprobados disponibles en la bolsa general esperando chofer.
     * Mapeado al request XML {@link GetViajesDisponiblesRequest}.
     *
     * @param request Payload XML de la petición.
     * @return {@link GetViajesDisponiblesResponse} que lista los itinerarios disponibles.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getViajesDisponiblesRequest")
    @ResponsePayload
    public GetViajesDisponiblesResponse getViajesDisponibles(@RequestPayload GetViajesDisponiblesRequest request) {
        GetViajesDisponiblesResponse response = new GetViajesDisponiblesResponse();
        viajeService.getViajesPendientesChofer().forEach(v -> {
            ViajeChoferSoapType s = new ViajeChoferSoapType();
            s.setId(v.getId());
            s.setOrigen(v.getDirOrigen());
            s.setDestino(v.getDirDestino());
            s.setDistanciaKm(v.getDistanciaKm() != null ? v.getDistanciaKm().doubleValue() : 0.0);
            s.setTarifa(v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0);
            s.setMonto(v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0);
            s.setTipoServicio(v.getTipoServicio());
            s.setFecha(v.getFechaCreacion() != null ? v.getFechaCreacion().toString() : "");
            response.getViajes().add(s);
        });
        return response;
    }

    /**
     * Obtiene el historial de viajes aceptados, en curso o finalizados pertenecientes al chofer autenticado.
     * Mapeado al request XML {@link GetMisViajesChoferRequest}.
     *
     * @param request Payload XML de la consulta.
     * @return {@link GetMisViajesChoferResponse} con la lista de sus viajes históricos y activos.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "getMisViajesChoferRequest")
    @ResponsePayload
    public GetMisViajesChoferResponse getMisViajesChofer(@RequestPayload GetMisViajesChoferRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        if (userIdStr == null || userIdStr.isBlank() || "anonymousUser".equalsIgnoreCase(userIdStr)) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario driver = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Chofer no autenticado."));

        GetMisViajesChoferResponse response = new GetMisViajesChoferResponse();
        viajeService.getViajesChofer(driver.getId()).forEach(v -> {
            ViajeChoferSoapType s = new ViajeChoferSoapType();
            s.setId(v.getId());
            s.setOrigen(v.getDirOrigen());
            s.setDestino(v.getDirDestino());
            s.setDistanciaKm(v.getDistanciaKm() != null ? v.getDistanciaKm().doubleValue() : 0.0);
            s.setTarifa(v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0);
            s.setMonto(v.getMontoTotal() != null ? v.getMontoTotal().doubleValue() : 0.0);
            s.setTipoServicio(v.getTipoServicio());
            s.setFecha(v.getFechaCreacion() != null ? v.getFechaCreacion().toString() : "");
            s.setCliente(v.getCliente() != null ? v.getCliente().getNombre() : "N/A");
            s.setClienteId(v.getCliente() != null ? v.getCliente().getId() : null);
            s.setEstadoLogistico(v.getEstadoLogistico());
            response.getViajes().add(s);
        });
        return response;
    }
}

