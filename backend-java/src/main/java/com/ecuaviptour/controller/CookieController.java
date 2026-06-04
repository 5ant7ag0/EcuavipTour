package com.ecuaviptour.controller;

import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class CookieController {

    // 1. RUTA PARA GUARDAR LA COOKIE
    @GetMapping("/cookie/guardar")
    public String guardarPreferencia(
            @RequestParam(value = "usuario") String nombreUsuario,
            HttpServletResponse response) {

        // Creamos la cookie con la clave "usuario_sesion"
        Cookie cookieUsuario = new Cookie("usuario_sesion", nombreUsuario);

        // Definimos que dure viva 1 día (86400 segundos)
        cookieUsuario.setMaxAge(86400);

        // Definimos que sea accesible desde cualquier ruta de la app
        cookieUsuario.setPath("/");

        // Se la enviamos al navegador del cliente
        response.addCookie(cookieUsuario);

        return "Cookie creada con Exito. El sistema recordara al usuario: " + nombreUsuario;
    }

    // 2. RUTA PARA LEER LA COOKIE
    @GetMapping("/cookie/leer")
    public String leerPreferencia(
            @CookieValue(
                    value = "usuario_sesion",
                    defaultValue = "Invitado Anónimo"
            ) String usuarioRecordado) {

        if ("Invitado Anónimo".equals(usuarioRecordado)) {
            return "No hay ninguna cookie guardada. Eres un Invitado Anónimo.";
        }

        return "Leyendo Cookie de sesión: ¡Bienvenido de vuelta, " + usuarioRecordado + "!";
    }

    // 3. RUTA PARA ELIMINAR LA COOKIE
    @GetMapping("/cookie/borrar")
    public String borrarCookie(HttpServletResponse response) {
        Cookie cookieParaBorrar = new Cookie("usuario_sesion", null);
        cookieParaBorrar.setMaxAge(0); // Tiempo de vida cero la destruye de inmediato
        cookieParaBorrar.setPath("/");

        response.addCookie(cookieParaBorrar);
        return "Cookie eliminada correctamente. El servidor te ha olvidado.";
    }
}
