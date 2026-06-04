package com.ecuaviptour.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.time.LocalDateTime;
import java.util.Objects;

@Entity
@Table(name = "reserva_asiento")
public class ReservaAsiento {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "viaje_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
    private Viaje viaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cliente_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Usuario cliente;

    @Column(name = "numero_asiento", nullable = false)
    private Integer numeroAsiento;

    @Column(name = "fecha_reserva", nullable = false)
    private LocalDateTime fechaReserva = LocalDateTime.now();

    @Column(length = 20, nullable = false)
    private String estado = "pendiente"; // 'pendiente', 'confirmado', 'cancelado'

    public ReservaAsiento() {
    }

    public ReservaAsiento(Long id, Viaje viaje, Usuario cliente, Integer numeroAsiento, LocalDateTime fechaReserva, String estado) {
        this.id = id;
        this.viaje = viaje;
        this.cliente = cliente;
        this.numeroAsiento = numeroAsiento;
        this.fechaReserva = fechaReserva != null ? fechaReserva : LocalDateTime.now();
        this.estado = estado != null ? estado : "pendiente";
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

    public Usuario getCliente() {
        return cliente;
    }

    public void setCliente(Usuario cliente) {
        this.cliente = cliente;
    }

    public Integer getNumeroAsiento() {
        return numeroAsiento;
    }

    public void setNumeroAsiento(Integer numeroAsiento) {
        this.numeroAsiento = numeroAsiento;
    }

    public LocalDateTime getFechaReserva() {
        return fechaReserva;
    }

    public void setFechaReserva(LocalDateTime fechaReserva) {
        this.fechaReserva = fechaReserva;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ReservaAsiento that = (ReservaAsiento) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public static ReservaAsientoBuilder builder() {
        return new ReservaAsientoBuilder();
    }

    public static class ReservaAsientoBuilder {
        private Long id;
        private Viaje viaje;
        private Usuario cliente;
        private Integer numeroAsiento;
        private LocalDateTime fechaReserva = LocalDateTime.now();
        private String estado = "pendiente";

        public ReservaAsientoBuilder id(Long id) { this.id = id; return this; }
        public ReservaAsientoBuilder viaje(Viaje viaje) { this.viaje = viaje; return this; }
        public ReservaAsientoBuilder cliente(Usuario cliente) { this.cliente = cliente; return this; }
        public ReservaAsientoBuilder numeroAsiento(Integer numeroAsiento) { this.numeroAsiento = numeroAsiento; return this; }
        public ReservaAsientoBuilder fechaReserva(LocalDateTime fechaReserva) { this.fechaReserva = fechaReserva; return this; }
        public ReservaAsientoBuilder estado(String estado) { this.estado = estado; return this; }

        public ReservaAsiento build() {
            return new ReservaAsiento(id, viaje, cliente, numeroAsiento, fechaReserva, estado);
        }
    }
}
