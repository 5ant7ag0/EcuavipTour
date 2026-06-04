package com.ecuaviptour.dto;

import com.ecuaviptour.model.MensajeChat;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class MensajeChatDTO {
    private Long id;
    private ViajeDTO viaje;
    private UsuarioDTO remitente;
    private UsuarioDTO destinatario;

    @JsonProperty("soporte_asignado")
    private UsuarioDTO soporteAsignado;

    private String categoria;
    private String estado;

    @JsonProperty("tipo_receptor")
    private String tipoReceptor;
    private String contenido;
    private Boolean leido;
    private LocalDateTime timestamp;

    public MensajeChatDTO() {
    }

    public MensajeChatDTO(Long id, ViajeDTO viaje, UsuarioDTO remitente, UsuarioDTO destinatario, UsuarioDTO soporteAsignado, String categoria, String estado, String tipoReceptor, String contenido, Boolean leido, LocalDateTime timestamp) {
        this.id = id;
        this.viaje = viaje;
        this.remitente = remitente;
        this.destinatario = destinatario;
        this.soporteAsignado = soporteAsignado;
        this.categoria = categoria;
        this.estado = estado;
        this.tipoReceptor = tipoReceptor;
        this.contenido = contenido;
        this.leido = leido;
        this.timestamp = timestamp;
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

    public UsuarioDTO getRemitente() {
        return remitente;
    }

    public void setRemitente(UsuarioDTO remitente) {
        this.remitente = remitente;
    }

    public UsuarioDTO getDestinatario() {
        return destinatario;
    }

    public void setDestinatario(UsuarioDTO destinatario) {
        this.destinatario = destinatario;
    }

    public UsuarioDTO getSoporteAsignado() {
        return soporteAsignado;
    }

    public void setSoporteAsignado(UsuarioDTO soporteAsignado) {
        this.soporteAsignado = soporteAsignado;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getTipoReceptor() {
        return tipoReceptor;
    }

    public void setTipoReceptor(String tipoReceptor) {
        this.tipoReceptor = tipoReceptor;
    }

    public String getContenido() {
        return contenido;
    }

    public void setContenido(String contenido) {
        this.contenido = contenido;
    }

    public Boolean getLeido() {
        return leido;
    }

    public void setLeido(Boolean leido) {
        this.leido = leido;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp(LocalDateTime timestamp) {
        this.timestamp = timestamp;
    }
}
