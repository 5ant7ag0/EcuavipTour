package com.ecuaviptour.modules.viajes.service;

import com.ecuaviptour.modules.viajes.domain.Reserva;
import java.util.List;

/**
 * Interfaz de servicio para la gestión de reservas de pasajes individuales en frecuencias.
 * 
 * @author Antigravity
 * @version 1.1
 */
public interface ReservaService {

    /**
     * Crea y registra una nueva reserva de asiento para un usuario en una frecuencia.
     * Genera un PIN de abordaje único y calcula el límite de pago (15 minutos).
     *
     * @param viajeProgramadoId Identificador de la frecuencia (viaje maestro).
     * @param usuarioId         Identificador del usuario que reserva.
     * @param numeroAsiento     Número de asiento solicitado.
     * @param puntoAbordaje     Punto donde el usuario abordará la van.
     * @return La reserva creada.
     */
    Reserva crearReserva(Long viajeProgramadoId, Long usuarioId, Integer numeroAsiento, String puntoAbordaje);

    /**
     * Recupera el historial de reservas de un usuario.
     *
     * @param usuarioId Identificador del usuario.
     * @return Lista de reservas del usuario.
     */
    List<Reserva> getReservasUsuario(Long usuarioId);

    /**
     * Recupera todas las reservas registradas para una frecuencia de viaje.
     *
     * @param viajeProgramadoId Identificador de la frecuencia.
     * @return Lista de reservas asociadas.
     */
    List<Reserva> getReservasFrecuencia(Long viajeProgramadoId);

    /**
     * Valida el PIN de abordaje de una reserva para realizar el check-in.
     *
     * @param reservaId Identificador único de la reserva.
     * @param pin       PIN numérico de abordaje ingresado.
     * @return true si el PIN es válido y la reserva se actualiza, false en caso contrario.
     */
    boolean validarAbordaje(Long reservaId, String pin);

    /**
     * Limpia y cancela automáticamente las reservas en estado PENDIENTE que hayan superado su límite de pago.
     */
    void cancelarReservasExpiradas();

    /**
     * Guarda la URL del comprobante de pago en una reserva.
     *
     * @param reservaId      Identificador único de la reserva.
     * @param comprobanteUrl URL del comprobante subido.
     * @return La reserva actualizada.
     */
    Reserva subirComprobante(Long reservaId, String comprobanteUrl);
}
