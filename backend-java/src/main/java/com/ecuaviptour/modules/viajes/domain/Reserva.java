package com.ecuaviptour.modules.viajes.domain;

import com.ecuaviptour.modules.users.domain.Usuario;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Entidad de persistencia que representa la compra/reserva de un pasaje individual
 * asociado a un viaje programado específico.
 * 
 * @author Antigravity
 * @version 1.2
 */
@Entity
@Table(name = "reserva")
public class Reserva {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viaje_programado_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private ViajeProgramado viajeProgramado;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id", nullable = false)
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Usuario usuario;

    @Column(name = "numero_asiento", nullable = false)
    private Integer numeroAsiento;

    @Column(name = "punto_abordaje", nullable = false, columnDefinition = "TEXT")
    private String puntoAbordaje;

    @Column(name = "estado_pago", nullable = false, length = 20)
    private String estadoPago = "PENDIENTE"; // PENDIENTE, CONFIRMADO, CANCELADO

    @Column(name = "pin_abordaje", nullable = false, length = 10)
    private String pinAbordaje;

    @Column(name = "fecha_reserva", nullable = false)
    private LocalDateTime fechaReserva = LocalDateTime.now();

    @Column(name = "fecha_limite_pago", nullable = false)
    private LocalDateTime fechaLimitePago;

    @Column(name = "comprobante_url", columnDefinition = "TEXT")
    private String comprobanteUrl;

    public Reserva() {
    }

    public Reserva(Long id, ViajeProgramado viajeProgramado, Usuario usuario, Integer numeroAsiento,
                   String puntoAbordaje, String estadoPago, String pinAbordaje, LocalDateTime fechaReserva,
                   LocalDateTime fechaLimitePago, String comprobanteUrl) {
        this.id = id;
        this.viajeProgramado = viajeProgramado;
        this.usuario = usuario;
        this.numeroAsiento = numeroAsiento;
        this.puntoAbordaje = puntoAbordaje;
        this.estadoPago = estadoPago != null ? estadoPago : "PENDIENTE";
        this.pinAbordaje = pinAbordaje;
        this.fechaReserva = fechaReserva != null ? fechaReserva : LocalDateTime.now();
        this.fechaLimitePago = fechaLimitePago != null ? fechaLimitePago : this.fechaReserva.plusMinutes(15);
        this.comprobanteUrl = comprobanteUrl;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ViajeProgramado getViajeProgramado() {
        return viajeProgramado;
    }

    public void setViajeProgramado(ViajeProgramado viajeProgramado) {
        this.viajeProgramado = viajeProgramado;
    }

    public Usuario getUsuario() {
        return usuario;
    }

    public void setUsuario(Usuario usuario) {
        this.usuario = usuario;
    }

    public Integer getNumeroAsiento() {
        return numeroAsiento;
    }

    public void setNumeroAsiento(Integer numeroAsiento) {
        this.numeroAsiento = numeroAsiento;
    }

    public String getPuntoAbordaje() {
        return puntoAbordaje;
    }

    public void setPuntoAbordaje(String puntoAbordaje) {
        this.puntoAbordaje = puntoAbordaje;
    }

    public String getEstadoPago() {
        return estadoPago;
    }

    public void setEstadoPago(String estadoPago) {
        this.estadoPago = estadoPago;
    }

    public String getPinAbordaje() {
        return pinAbordaje;
    }

    public void setPinAbordaje(String pinAbordaje) {
        this.pinAbordaje = pinAbordaje;
    }

    public LocalDateTime getFechaReserva() {
        return fechaReserva;
    }

    public void setFechaReserva(LocalDateTime fechaReserva) {
        this.fechaReserva = fechaReserva;
    }

    public LocalDateTime getFechaLimitePago() {
        return fechaLimitePago;
    }

    public void setFechaLimitePago(LocalDateTime fechaLimitePago) {
        this.fechaLimitePago = fechaLimitePago;
    }

    public String getComprobanteUrl() {
        return comprobanteUrl;
    }

    public void setComprobanteUrl(String comprobanteUrl) {
        this.comprobanteUrl = comprobanteUrl;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Reserva reserva = (Reserva) o;
        return Objects.equals(id, reserva.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public static ReservaBuilder builder() {
        return new ReservaBuilder();
    }

    public static class ReservaBuilder {
        private Long id;
        private ViajeProgramado viajeProgramado;
        private Usuario usuario;
        private Integer numeroAsiento;
        private String puntoAbordaje;
        private String estadoPago = "PENDIENTE";
        private String pinAbordaje;
        private LocalDateTime fechaReserva = LocalDateTime.now();
        private LocalDateTime fechaLimitePago;
        private String comprobanteUrl;

        public ReservaBuilder id(Long id) { this.id = id; return this; }
        public ReservaBuilder viajeProgramado(ViajeProgramado viajeProgramado) { this.viajeProgramado = viajeProgramado; return this; }
        public ReservaBuilder usuario(Usuario usuario) { this.usuario = usuario; return this; }
        public ReservaBuilder numeroAsiento(Integer numeroAsiento) { this.numeroAsiento = numeroAsiento; return this; }
        public ReservaBuilder puntoAbordaje(String puntoAbordaje) { this.puntoAbordaje = puntoAbordaje; return this; }
        public ReservaBuilder estadoPago(String estadoPago) { this.estadoPago = estadoPago; return this; }
        public ReservaBuilder pinAbordaje(String pinAbordaje) { this.pinAbordaje = pinAbordaje; return this; }
        public ReservaBuilder fechaReserva(LocalDateTime fechaReserva) { this.fechaReserva = fechaReserva; return this; }
        public ReservaBuilder fechaLimitePago(LocalDateTime fechaLimitePago) { this.fechaLimitePago = fechaLimitePago; return this; }
        public ReservaBuilder comprobanteUrl(String comprobanteUrl) { this.comprobanteUrl = comprobanteUrl; return this; }

        public Reserva build() {
            if (fechaLimitePago == null && fechaReserva != null) {
                fechaLimitePago = fechaReserva.plusMinutes(15);
            }
            return new Reserva(id, viajeProgramado, usuario, numeroAsiento, puntoAbordaje, estadoPago, pinAbordaje, fechaReserva, fechaLimitePago, comprobanteUrl);
        }
    }
}
