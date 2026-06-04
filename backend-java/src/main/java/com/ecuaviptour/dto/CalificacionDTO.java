package com.ecuaviptour.dto;

import com.ecuaviptour.model.Calificacion;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class CalificacionDTO {
    private Long id;
    private ViajeDTO viaje;
    private UsuarioDTO cliente;
    private Integer estrellas;
    private String comentario;

    @JsonProperty("fecha_calificacion")
    private LocalDateTime fechaCalificacion;

    public CalificacionDTO() {
    }

    public CalificacionDTO(Long id, ViajeDTO viaje, UsuarioDTO cliente, Integer estrellas, String comentario, LocalDateTime fechaCalificacion) {
        this.id = id;
        this.viaje = viaje;
        this.cliente = cliente;
        this.estrellas = estrellas;
        this.comentario = comentario;
        this.fechaCalificacion = fechaCalificacion;
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

    public UsuarioDTO getCliente() {
        return cliente;
    }

    public void setCliente(UsuarioDTO cliente) {
        this.cliente = cliente;
    }

    public Integer getEstrellas() {
        return estrellas;
    }

    public void setEstrellas(Integer estrellas) {
        this.estrellas = estrellas;
    }

    public String getComentario() {
        return comentario;
    }

    public void setComentario(String comentario) {
        this.comentario = comentario;
    }

    public LocalDateTime getFechaCalificacion() {
        return fechaCalificacion;
    }

    public void setFechaCalificacion(LocalDateTime fechaCalificacion) {
        this.fechaCalificacion = fechaCalificacion;
    }
}
