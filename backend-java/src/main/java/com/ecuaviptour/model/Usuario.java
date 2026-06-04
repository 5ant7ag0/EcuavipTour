package com.ecuaviptour.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "usuario")
public class Usuario {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String nombre;

    @Column(nullable = false, unique = true, length = 100)
    private String correo;

    @Column(name = "password_hash", nullable = false, columnDefinition = "TEXT")
    private String passwordHash;

    @Column(length = 20)
    private String telefono;

    @Column(unique = true, length = 15)
    private String cedula;

    @Column(name = "foto_perfil_url", columnDefinition = "TEXT")
    private String fotoPerfilUrl;

    @Column(length = 20)
    private String rol; // admin, chofer, cliente

    @Column(nullable = false)
    private Boolean activo = true;

    @Column(name = "fecha_registro", nullable = false)
    private LocalDateTime fechaRegistro = LocalDateTime.now();

    public Usuario() {
    }

    public Usuario(Long id, String nombre, String correo, String passwordHash, String telefono, String cedula, String fotoPerfilUrl, String rol, Boolean activo, LocalDateTime fechaRegistro) {
        this.id = id;
        this.nombre = nombre;
        this.correo = correo;
        this.passwordHash = passwordHash;
        this.telefono = telefono;
        this.cedula = cedula;
        this.fotoPerfilUrl = fotoPerfilUrl;
        this.rol = rol;
        this.activo = activo != null ? activo : true;
        this.fechaRegistro = fechaRegistro != null ? fechaRegistro : LocalDateTime.now();
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

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Usuario usuario = (Usuario) o;
        return Objects.equals(id, usuario.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public static UsuarioBuilder builder() {
        return new UsuarioBuilder();
    }

    public static class UsuarioBuilder {
        private Long id;
        private String nombre;
        private String correo;
        private String passwordHash;
        private String telefono;
        private String cedula;
        private String fotoPerfilUrl;
        private String rol;
        private Boolean activo = true;
        private LocalDateTime fechaRegistro = LocalDateTime.now();

        public UsuarioBuilder id(Long id) { this.id = id; return this; }
        public UsuarioBuilder nombre(String nombre) { this.nombre = nombre; return this; }
        public UsuarioBuilder correo(String correo) { this.correo = correo; return this; }
        public UsuarioBuilder passwordHash(String passwordHash) { this.passwordHash = passwordHash; return this; }
        public UsuarioBuilder telefono(String telefono) { this.telefono = telefono; return this; }
        public UsuarioBuilder cedula(String cedula) { this.cedula = cedula; return this; }
        public UsuarioBuilder fotoPerfilUrl(String fotoPerfilUrl) { this.fotoPerfilUrl = fotoPerfilUrl; return this; }
        public UsuarioBuilder rol(String rol) { this.rol = rol; return this; }
        public UsuarioBuilder activo(Boolean activo) { this.activo = activo; return this; }
        public UsuarioBuilder fechaRegistro(LocalDateTime fechaRegistro) { this.fechaRegistro = fechaRegistro; return this; }

        public Usuario build() {
            return new Usuario(id, nombre, correo, passwordHash, telefono, cedula, fotoPerfilUrl, rol, activo, fechaRegistro);
        }
    }
}
