package com.ecuaviptour.dto;

import com.ecuaviptour.model.Pago;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class PagoDTO {
    private Long id;
    private ViajeDTO viaje;

    @JsonProperty("comprobante_url")
    private String comprobanteUrl;

    @JsonProperty("monto_pagado")
    private BigDecimal montoPagado;

    @JsonProperty("fecha_pago")
    private LocalDateTime fechaPago;

    public PagoDTO() {
    }

    public PagoDTO(Long id, ViajeDTO viaje, String comprobanteUrl, BigDecimal montoPagado, LocalDateTime fechaPago) {
        this.id = id;
        this.viaje = viaje;
        this.comprobanteUrl = comprobanteUrl;
        this.montoPagado = montoPagado;
        this.fechaPago = fechaPago;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public ViajeDTO getViaje() {
        return viaje;
    }

    public void setViaje(ViajeDTO viaje) {
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
}
