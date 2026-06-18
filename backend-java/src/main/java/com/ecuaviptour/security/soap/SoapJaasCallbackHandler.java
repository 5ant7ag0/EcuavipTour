package com.ecuaviptour.security.soap;

import javax.security.auth.callback.Callback;
import javax.security.auth.callback.CallbackHandler;
import javax.security.auth.callback.UnsupportedCallbackException;

import org.apache.wss4j.common.ext.WSPasswordCallback;
import org.springframework.stereotype.Component;

import java.io.IOException;

/**
 * Gestor de devoluciones de llamada (CallbackHandler) de JAAS para servicios SOAP.
 * Valida credenciales B2B en las peticiones que requieren firma o seguridad WS-Security.
 */
@Component
public class SoapJaasCallbackHandler implements CallbackHandler {

    @Override
    public void handle(Callback[] callbacks)
            throws IOException, UnsupportedCallbackException {

        for (Callback callback : callbacks) {
            // Evalúa el callback de contraseña usando WSS4J
            if (callback instanceof WSPasswordCallback pc) {

                String username = pc.getIdentifier();

                // Credenciales B2B para integraciones internas de Ecuavip
                if ("ecuavip_facturacion".equals(username)) {
                    pc.setPassword("B2B_Secreto_2026");
                } else if ("ecuavip_bodega".equals(username)) {
                    pc.setPassword("Bodega_Stock_001");
                } else {
                    throw new SecurityException(
                            "Acceso SOAP denegado. Usuario B2B no registrado: "
                                    + username
                    );
                }

            } else {
                throw new UnsupportedCallbackException(
                        callback,
                        "Tipo de validación de seguridad no soportada"
                );
            }
        }
    }
}
