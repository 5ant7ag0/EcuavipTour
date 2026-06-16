package com.ecuaviptour.soap.endpoint;

import com.ecuaviptour.modules.users.domain.Usuario;
import com.ecuaviptour.modules.users.repository.UsuarioRepository;
import com.ecuaviptour.modules.users.service.AuthService;
import com.ecuaviptour.soap.auth.*;
import com.ecuaviptour.util.JwtUtil;
import com.ecuaviptour.exception.ResourceNotFoundException;
import com.ecuaviptour.exception.UnauthorizedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.ws.server.endpoint.annotation.Endpoint;
import org.springframework.ws.server.endpoint.annotation.PayloadRoot;
import org.springframework.ws.server.endpoint.annotation.RequestPayload;
import org.springframework.ws.server.endpoint.annotation.ResponsePayload;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Paths;
import java.util.Base64;
import java.util.UUID;

/**
 * Endpoint del servicio web SOAP para gestionar la autenticación y el perfil de los usuarios.
 * Proporciona métodos para inicio de sesión, registro de nuevos clientes,
 * actualizaciones de datos personales del perfil y carga directa de la imagen de avatar en formato Base64.
 *
 * @author Santiago T.
 * @version 1.0
 */
@Endpoint
public class AuthSoapEndpoint {

    private static final String NAMESPACE_URI = "http://ecuaviptour.com/soap/auth";

    private final AuthService authService;
    private final UsuarioRepository usuarioRepository;
    private final JwtUtil jwtUtil;

    /**
     * Constructor para inyectar servicios de autenticación, repositorios y utilidades JWT.
     *
     * @param authService       Servicio de lógica de autenticación.
     * @param usuarioRepository Repositorio de persistencia del usuario.
     * @param jwtUtil           Utilidad de generación y firma de tokens JWT.
     */
    public AuthSoapEndpoint(AuthService authService, UsuarioRepository usuarioRepository, JwtUtil jwtUtil) {
        this.authService = authService;
        this.usuarioRepository = usuarioRepository;
        this.jwtUtil = jwtUtil;
    }

    /**
     * Procesa la solicitud SOAP para el inicio de sesión del usuario.
     * Mapeado al request XML {@link LoginRequest}.
     *
     * @param request Payload XML que contiene el correo y la contraseña.
     * @return {@link LoginResponse} que contiene el token JWT y los datos serializados del usuario.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "loginRequest")
    @ResponsePayload
    public LoginResponse login(@RequestPayload LoginRequest request) {
        String token = authService.login(request.getCorreo(), request.getPassword());
        Usuario user = usuarioRepository.findByCorreo(request.getCorreo())
                .orElseThrow(() -> new ResourceNotFoundException("Usuario no encontrado con correo: " + request.getCorreo()));

        LoginResponse response = new LoginResponse();
        response.setToken(token);
        response.setMensaje("Login exitoso");
        response.setUsuario(mapUsuarioToSoap(user));
        return response;
    }

    /**
     * Procesa la solicitud SOAP para registrar una nueva cuenta de usuario.
     * Mapeado al request XML {@link RegisterRequest}.
     *
     * @param request Payload XML con los datos de registro (nombre, correo, contraseña, teléfono, cédula y rol).
     * @return {@link RegisterResponse} con el token JWT de la sesión creada y la información del usuario registrado.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "registerRequest")
    @ResponsePayload
    public RegisterResponse register(@RequestPayload RegisterRequest request) {
        Usuario usuario = new Usuario();
        usuario.setNombre(request.getNombre());
        usuario.setCorreo(request.getCorreo());
        usuario.setPasswordHash(request.getPassword()); // register will hash it
        usuario.setTelefono(request.getTelefono());
        usuario.setCedula(request.getCedula());
        if (request.getRol() != null) {
            usuario.setRol(request.getRol());
        }

        Usuario registeredUser = authService.register(usuario);
        String token = jwtUtil.generateToken(registeredUser.getCorreo(), registeredUser.getId(), registeredUser.getRol());

        RegisterResponse response = new RegisterResponse();
        response.setToken(token);
        response.setMensaje("Usuario registrado exitosamente");
        response.setUsuario(mapUsuarioToSoap(registeredUser));
        return response;
    }

    /**
     * Actualiza los datos de perfil del usuario autenticado actual.
     * Extrae el ID de usuario desde el contexto de Spring Security.
     * Mapeado al request XML {@link UpdateProfileRequest}.
     *
     * @param request Payload XML con los campos a actualizar en el perfil.
     * @return {@link UpdateProfileResponse} con los datos del usuario actualizados.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "updateProfileRequest")
    @ResponsePayload
    public UpdateProfileResponse updateProfile(@RequestPayload UpdateProfileRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        if (userIdStr == null || userIdStr.isBlank() || "anonymousUser".equalsIgnoreCase(userIdStr)) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        Usuario updated = authService.updateProfile(
                user.getId(),
                request.getNombre(),
                request.getTelefono(),
                request.getFotoPerfilUrl(),
                request.getCedula(),
                request.getPassword(),
                request.getCorreo()
        );

        UpdateProfileResponse response = new UpdateProfileResponse();
        response.setMensaje("Perfil actualizado correctamente");
        response.setUsuario(mapUsuarioToSoap(updated));
        return response;
    }

    /**
     * Sube y decodifica un avatar en formato Base64 para el usuario autenticado.
     * Guarda físicamente el archivo en el sistema de archivos del servidor.
     * Mapeado al request XML {@link UploadAvatarRequest}.
     *
     * @param request Payload XML que contiene el nombre del archivo y el flujo binario en Base64.
     * @return {@link UploadAvatarResponse} con la confirmación de la carga, la URL del avatar y los datos actualizados.
     */
    @PayloadRoot(namespace = NAMESPACE_URI, localPart = "uploadAvatarRequest")
    @ResponsePayload
    public UploadAvatarResponse uploadAvatar(@RequestPayload UploadAvatarRequest request) {
        String userIdStr = SecurityContextHolder.getContext().getAuthentication().getName();
        if (userIdStr == null || userIdStr.isBlank() || "anonymousUser".equalsIgnoreCase(userIdStr)) {
            throw new UnauthorizedException("Sesión expirada o inválida. Por favor, inicia sesión de nuevo.");
        }
        Usuario user = usuarioRepository.findById(Long.parseLong(userIdStr))
                .orElseThrow(() -> new UnauthorizedException("Usuario no autenticado."));

        String base64Data = request.getFotoBase64();
        if (base64Data == null || base64Data.isEmpty()) {
            throw new IllegalArgumentException("No se envio ningun archivo");
        }

        // Handle base64 format metadata if present (e.g. "data:image/png;base64,...")
        if (base64Data.contains(",")) {
            base64Data = base64Data.substring(base64Data.indexOf(",") + 1);
        }
        byte[] decodedBytes = Base64.getDecoder().decode(base64Data);

        String userDir = System.getProperty("user.dir");
        String uploadDir = Paths.get(userDir, "uploads", "avatars").toString();
        File folder = new File(uploadDir);
        if (!folder.exists()) {
            folder.mkdirs();
        }

        String filename = "user_" + user.getId() + "_avatar_" + UUID.randomUUID().toString() + "_" + request.getFilename();
        File file = new File(folder, filename);
        try (FileOutputStream fos = new FileOutputStream(file)) {
            fos.write(decodedBytes);
        } catch (IOException e) {
            throw new RuntimeException("Error al guardar la foto de perfil en el disco.", e);
        }

        String avatarUrl = "uploads/avatars/" + filename;
        Usuario updated = authService.updateProfile(user.getId(), null, null, avatarUrl, null, null);

        UploadAvatarResponse response = new UploadAvatarResponse();
        response.setMensaje("Foto de perfil actualizada correctamente");
        response.setFotoPerfilUrl(updated.getFotoPerfilUrl());
        response.setUsuario(mapUsuarioToSoap(updated));
        return response;
    }

    /**
     * Mapea un objeto entidad de base de datos {@link Usuario} a su correspondiente tipo SOAP JAXB {@link UsuarioSoapType}.
     *
     * @param u Entidad de persistencia Usuario.
     * @return Objeto SOAP de tipo Usuario.
     */
    private UsuarioSoapType mapUsuarioToSoap(Usuario u) {
        UsuarioSoapType soap = new UsuarioSoapType();
        soap.setId(u.getId());
        soap.setNombre(u.getNombre());
        soap.setCorreo(u.getCorreo());
        soap.setTelefono(u.getTelefono());
        soap.setCedula(u.getCedula());
        soap.setFotoPerfilUrl(u.getFotoPerfilUrl());
        soap.setRol(u.getRol());
        soap.setActivo(u.getActivo() != null ? u.getActivo() : true);
        if (u.getFechaRegistro() != null) {
            soap.setFechaRegistro(u.getFechaRegistro().toString());
        }
        return soap;
    }
}

