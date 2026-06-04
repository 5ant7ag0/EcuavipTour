package com.ecuaviptour.dto;

import com.ecuaviptour.model.Usuario;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.time.LocalDateTime;

public class UsuarioDTO {
    private Long id;
    private String nombre;
    private String correo;
    private String telefono;
    private String cedula;

    @JsonProperty("foto_perfil_url")
    private String fotoPerfilUrl;

    private String rol;
    private Boolean activo;

    @JsonProperty("fecha_registro")
    private LocalDateTime fechaRegistro;

    public UsuarioDTO() {
    }

    public UsuarioDTO(Long id, String nombre, String correo, String telefono, String cedula, String fotoPerfilUrl, String rol, Boolean activo, LocalDateTime fechaRegistro) {
        this.id = id;
        this.nombre = nombre;
        this.correo = correo;
        this.telefono = telefono;
        this.cedula = cedula;
        this.fotoPerfilUrl = fotoPerfilUrl;
        this.rol = rol;
        this.activo = activo;
        this.fechaRegistro = fechaRegistro;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getCorreo() {
        return correo;
    }

    public void setCorreo(String correo) {
        this.correo = correo;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getCedula() {
        return cedula;
    }

    public void setCedula(String cedula) {
        this.cedula = cedula;
    }

    public String getFotoPerfilUrl() {
        return fotoPerfilUrl;
    }

    public void setFotoPerfilUrl(String fotoPerfilUrl) {
        this.fotoPerfilUrl = fotoPerfilUrl;
    }

    public String getRol() {
        return rol;
    }

    public void setRol(String rol) {
        this.rol = rol;
    }

    public Boolean getActivo() {
        return activo;
    }

    public void setActivo(Boolean activo) {
        this.activo = activo;
    }

    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }

    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }
}
