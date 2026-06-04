package com.ecuaviptour.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "pago")
public class Pago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viaje_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Viaje viaje;

    @Column(name = "comprobante_url", columnDefinition = "TEXT")
    private String comprobanteUrl;

    @Column(name = "monto_pagado", precision = 10, scale = 2)
    private BigDecimal montoPagado;

    @Column(name = "fecha_pago", nullable = false)
    private LocalDateTime fechaPago = LocalDateTime.now();

    public Pago() {
    }

    public Pago(Long id, Viaje viaje, String comprobanteUrl, BigDecimal montoPagado, LocalDateTime fechaPago) {
        this.id = id;
        this.viaje = viaje;
        this.comprobanteUrl = comprobanteUrl;
        this.montoPagado = montoPagado;
        this.fechaPago = fechaPago != null ? fechaPago : LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Viaje getViaje() {
        return viaje;
    }

    public void setViaje(Viaje viaje) {
        this.viaje = viaje;
    }

    public String getComprobanteUrl() {
        return comprobanteUrl;
    }

    public void setComprobanteUrl(String comprobanteUrl) {
        this.comprobanteUrl = comprobanteUrl;
    }

    public BigDecimal getMontoPagado() {
        return montoPagado;
    }

    public void setMontoPagado(BigDecimal montoPagado) {
        this.montoPagado = montoPagado;
    }

    public LocalDateTime getFechaPago() {
        return fechaPago;
    }

    public void setFechaPago(LocalDateTime fechaPago) {
        this.fechaPago = fechaPago;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Pago pago = (Pago) o;
        return Objects.equals(id, pago.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public static PagoBuilder builder() {
        return new PagoBuilder();
    }

    public static class PagoBuilder {
        private Long id;
        private Viaje viaje;
        private String comprobanteUrl;
        private BigDecimal montoPagado;
        private LocalDateTime fechaPago = LocalDateTime.now();

        public PagoBuilder id(Long id) { this.id = id; return this; }
        public PagoBuilder viaje(Viaje viaje) { this.viaje = viaje; return this; }
        public PagoBuilder comprobanteUrl(String comprobanteUrl) { this.comprobanteUrl = comprobanteUrl; return this; }
        public PagoBuilder montoPagado(BigDecimal montoPagado) { this.montoPagado = montoPagado; return this; }
        public PagoBuilder fechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; return this; }

        public Pago build() {
            return new Pago(id, viaje, comprobanteUrl, montoPagado, fechaPago);
        }
    }
}
