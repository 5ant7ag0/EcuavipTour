package com.ecuaviptour.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "mensajechat")
public class MensajeChat {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viaje_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Viaje viaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "remitente_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Usuario remitente;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "destinatario_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Usuario destinatario;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "soporte_asignado_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Usuario soporteAsignado;

    @Column(name = "categoria", length = 50)
    private String categoria;

    @Column(name = "estado", length = 20, nullable = false)
    private String estado = "abierto"; // 'abierto' o 'resuelto'

    @Column(name = "tipo_receptor", length = 20, nullable = false)
    private String tipoReceptor = "admin"; // 'admin' o 'chofer'

    @Column(nullable = false, columnDefinition = "TEXT")
    private String contenido;

    @Column(nullable = false)
    private Boolean leido = false;

    @Column(nullable = false)
    private LocalDateTime timestamp = LocalDateTime.now();

    public MensajeChat() {
    }

    public MensajeChat(Long id, Viaje viaje, Usuario remitente, Usuario destinatario, Usuario soporteAsignado, String categoria, String estado, String tipoReceptor, String contenido, Boolean leido, LocalDateTime timestamp) {
        this.id = id;
        this.viaje = viaje;
        this.remitente = remitente;
        this.destinatario = destinatario;
        this.soporteAsignado = soporteAsignado;
        this.categoria = categoria;
        this.estado = estado != null ? estado : "abierto";
        this.tipoReceptor = tipoReceptor != null ? tipoReceptor : "admin";
        this.contenido = contenido;
        this.leido = leido != null ? leido : false;
        this.timestamp = timestamp != null ? timestamp : LocalDateTime.now();
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

    public Usuario getRemitente() {
        return remitente;
    }

    public void setRemitente(Usuario remitente) {
        this.remitente = remitente;
    }

    public Usuario getDestinatario() {
        return destinatario;
    }

    public void setDestinatario(Usuario destinatario) {
        this.destinatario = destinatario;
    }

    public Usuario getSoporteAsignado() {
        return soporteAsignado;
    }

    public void setSoporteAsignado(Usuario soporteAsignado) {
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        MensajeChat that = (MensajeChat) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public static MensajeChatBuilder builder() {
        return new MensajeChatBuilder();
    }

    public static class MensajeChatBuilder {
        private Long id;
        private Viaje viaje;
        private Usuario remitente;
        private Usuario destinatario;
        private Usuario soporteAsignado;
        private String categoria;
        private String estado = "abierto";
        private String tipoReceptor = "admin";
        private String contenido;
        private Boolean leido = false;
        private LocalDateTime timestamp = LocalDateTime.now();

        public MensajeChatBuilder id(Long id) { this.id = id; return this; }
        public MensajeChatBuilder viaje(Viaje viaje) { this.viaje = viaje; return this; }
        public MensajeChatBuilder remitente(Usuario remitente) { this.remitente = remitente; return this; }
        public MensajeChatBuilder destinatario(Usuario destinatario) { this.destinatario = destinatario; return this; }
        public MensajeChatBuilder soporteAsignado(Usuario soporteAsignado) { this.soporteAsignado = soporteAsignado; return this; }
        public MensajeChatBuilder categoria(String categoria) { this.categoria = categoria; return this; }
        public MensajeChatBuilder estado(String estado) { this.estado = estado; return this; }
        public MensajeChatBuilder tipoReceptor(String tipoReceptor) { this.tipoReceptor = tipoReceptor; return this; }
        public MensajeChatBuilder contenido(String contenido) { this.contenido = contenido; return this; }
        public MensajeChatBuilder leido(Boolean leido) { this.leido = leido; return this; }
        public MensajeChatBuilder timestamp(LocalDateTime timestamp) { this.timestamp = timestamp; return this; }

        public MensajeChat build() {
            return new MensajeChat(id, viaje, remitente, destinatario, soporteAsignado, categoria, estado, tipoReceptor, contenido, leido, timestamp);
        }
    }
}
