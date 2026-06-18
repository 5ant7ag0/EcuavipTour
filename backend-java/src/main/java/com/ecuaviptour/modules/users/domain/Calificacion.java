package com.ecuaviptour.modules.users.domain;

import com.ecuaviptour.modules.viajes.domain.Viaje;
import com.ecuaviptour.modules.viajes.domain.Reserva;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Entidad de persistencia que representa la calificación otorgada por un cliente al finalizar un viaje.
 * Almacena el nivel de satisfacción en estrellas, comentarios cualitativos y metadatos de auditoría.
 * 
 * @author Santiago T.
 * @version 1.0
 */
@Entity
@Table(name = "calificacion")
public class Calificacion {

    /**
     * Identificador único autoincremental de la calificación.
     */
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * Relación ManyToOne con el viaje evaluado. Carga diferida (LAZY).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viaje_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Viaje viaje;

    /**
     * Relación ManyToOne con la reserva de viaje compartido evaluada. Carga diferida (LAZY).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reserva_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Reserva reserva;

    /**
     * Relación ManyToOne con el usuario (cliente) que realiza la calificación. Carga diferida (LAZY).
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Usuario cliente;

    /**
     * Número de estrellas otorgadas como calificación del servicio (generalmente entre 1 y 5).
     */
    private Integer estrellas;

    /**
     * Comentario o retroalimentación escrita del cliente sobre el viaje.
     */
    @Column(columnDefinition = "TEXT")
    private String comentario;

    /**
     * Fecha y hora en la que se registró la calificación en el sistema.
     */
    @Column(name = "fecha_calificacion", nullable = false)
    private LocalDateTime fechaCalificacion = LocalDateTime.now();

    public Calificacion() {
    }

    public Calificacion(Long id, Viaje viaje, Usuario cliente, Integer estrellas, String comentario, LocalDateTime fechaCalificacion) {
        this(id, viaje, cliente, estrellas, comentario, fechaCalificacion, null);
    }

    public Calificacion(Long id, Viaje viaje, Usuario cliente, Integer estrellas, String comentario, LocalDateTime fechaCalificacion, Reserva reserva) {
        this.id = id;
        this.viaje = viaje;
        this.cliente = cliente;
        this.estrellas = estrellas;
        this.comentario = comentario;
        this.fechaCalificacion = fechaCalificacion != null ? fechaCalificacion : LocalDateTime.now();
        this.reserva = reserva;
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

    public Reserva getReserva() {
        return reserva;
    }

    public void setReserva(Reserva reserva) {
        this.reserva = reserva;
    }

    public Usuario getCliente() {
        return cliente;
    }

    public void setCliente(Usuario cliente) {
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

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Calificacion that = (Calificacion) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public static CalificacionBuilder builder() {
        return new CalificacionBuilder();
    }

    public static class CalificacionBuilder {
        private Long id;
        private Viaje viaje;
        private Usuario cliente;
        private Integer estrellas;
        private String comentario;
        private LocalDateTime fechaCalificacion = LocalDateTime.now();
        private Reserva reserva;

        public CalificacionBuilder id(Long id) { this.id = id; return this; }
        public CalificacionBuilder viaje(Viaje viaje) { this.viaje = viaje; return this; }
        public CalificacionBuilder cliente(Usuario cliente) { this.cliente = cliente; return this; }
        public CalificacionBuilder estrellas(Integer estrellas) { this.estrellas = estrellas; return this; }
        public CalificacionBuilder comentario(String comentario) { this.comentario = comentario; return this; }
        public CalificacionBuilder fechaCalificacion(LocalDateTime fechaCalificacion) { this.fechaCalificacion = fechaCalificacion; return this; }
        public CalificacionBuilder reserva(Reserva reserva) { this.reserva = reserva; return this; }

        public Calificacion build() {
            return new Calificacion(id, viaje, cliente, estrellas, comentario, fechaCalificacion, reserva);
        }
    }
}
