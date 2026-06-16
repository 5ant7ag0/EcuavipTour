package com.ecuaviptour.modules.viajes.domain;

import com.ecuaviptour.modules.users.domain.Usuario;
import com.ecuaviptour.modules.vehiculos.domain.Vehiculo;
import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Objects;

/**
 * Entidad de persistencia que representa un viaje programado (frecuencia) en la plataforma.
 * 
 * @author Antigravity
 * @version 1.1
 */
@Entity
@Table(name = "viaje_programado")
public class ViajeProgramado {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chofer_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Usuario chofer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehiculo_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "chofer"})
    private Vehiculo vehiculo;

    @Column(name = "dir_origen", nullable = false, columnDefinition = "TEXT")
    private String dirOrigen;

    @Column(name = "dir_destino", nullable = false, columnDefinition = "TEXT")
    private String dirDestino;

    @Column(name = "fecha_hora_salida", nullable = false)
    private LocalDateTime fechaHoraSalida;

    @Column(name = "precio_asiento", nullable = false, precision = 10, scale = 2)
    private BigDecimal precioAsiento;

    @Column(name = "capacidad_total", nullable = false)
    private Integer capacidadTotal = 15;

    @Column(name = "estado", nullable = false, length = 20)
    private String estado = "PROGRAMADO"; // PROGRAMADO, EN_RUTA, FINALIZADO

    @Column(name = "fecha_creacion", nullable = false)
    private LocalDateTime fechaCreacion = LocalDateTime.now();

    public ViajeProgramado() {
    }

    public ViajeProgramado(Long id, Usuario chofer, Vehiculo vehiculo, String dirOrigen, String dirDestino,
                           LocalDateTime fechaHoraSalida, BigDecimal precioAsiento, Integer capacidadTotal,
                           String estado, LocalDateTime fechaCreacion) {
        this.id = id;
        this.chofer = chofer;
        this.vehiculo = vehiculo;
        this.dirOrigen = dirOrigen;
        this.dirDestino = dirDestino;
        this.fechaHoraSalida = fechaHoraSalida;
        this.precioAsiento = precioAsiento;
        this.capacidadTotal = capacidadTotal != null ? capacidadTotal : 15;
        this.estado = estado != null ? estado : "PROGRAMADO";
        this.fechaCreacion = fechaCreacion != null ? fechaCreacion : LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Usuario getChofer() {
        return chofer;
    }

    public void setChofer(Usuario chofer) {
        this.chofer = chofer;
    }

    public Vehiculo getVehiculo() {
        return vehiculo;
    }

    public void setVehiculo(Vehiculo vehiculo) {
        this.vehiculo = vehiculo;
    }

    public String getDirOrigen() {
        return dirOrigen;
    }

    public void setDirOrigen(String dirOrigen) {
        this.dirOrigen = dirOrigen;
    }

    public String getDirDestino() {
        return dirDestino;
    }

    public void setDirDestino(String dirDestino) {
        this.dirDestino = dirDestino;
    }

    public LocalDateTime getFechaHoraSalida() {
        return fechaHoraSalida;
    }

    public void setFechaHoraSalida(LocalDateTime fechaHoraSalida) {
        this.fechaHoraSalida = fechaHoraSalida;
    }

    public BigDecimal getPrecioAsiento() {
        return precioAsiento;
    }

    public void setPrecioAsiento(BigDecimal precioAsiento) {
        this.precioAsiento = precioAsiento;
    }

    public Integer getCapacidadTotal() {
        return capacidadTotal;
    }

    public void setCapacidadTotal(Integer capacidadTotal) {
        this.capacidadTotal = capacidadTotal;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        ViajeProgramado that = (ViajeProgramado) o;
        return Objects.equals(id, that.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public static ViajeProgramadoBuilder builder() {
        return new ViajeProgramadoBuilder();
    }

    public static class ViajeProgramadoBuilder {
        private Long id;
        private Usuario chofer;
        private Vehiculo vehiculo;
        private String dirOrigen;
        private String dirDestino;
        private LocalDateTime fechaHoraSalida;
        private BigDecimal precioAsiento;
        private Integer capacidadTotal = 15;
        private String estado = "PROGRAMADO";
        private LocalDateTime fechaCreacion = LocalDateTime.now();

        public ViajeProgramadoBuilder id(Long id) { this.id = id; return this; }
        public ViajeProgramadoBuilder chofer(Usuario chofer) { this.chofer = chofer; return this; }
        public ViajeProgramadoBuilder vehiculo(Vehiculo vehiculo) { this.vehiculo = vehiculo; return this; }
        public ViajeProgramadoBuilder dirOrigen(String dirOrigen) { this.dirOrigen = dirOrigen; return this; }
        public ViajeProgramadoBuilder dirDestino(String dirDestino) { this.dirDestino = dirDestino; return this; }
        public ViajeProgramadoBuilder fechaHoraSalida(LocalDateTime fechaHoraSalida) { this.fechaHoraSalida = fechaHoraSalida; return this; }
        public ViajeProgramadoBuilder precioAsiento(BigDecimal precioAsiento) { this.precioAsiento = precioAsiento; return this; }
        public ViajeProgramadoBuilder capacidadTotal(Integer capacidadTotal) { this.capacidadTotal = capacidadTotal; return this; }
        public ViajeProgramadoBuilder estado(String estado) { this.estado = estado; return this; }
        public ViajeProgramadoBuilder fechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; return this; }

        public ViajeProgramado build() {
            return new ViajeProgramado(id, chofer, vehiculo, dirOrigen, dirDestino, fechaHoraSalida, precioAsiento, capacidadTotal, estado, fechaCreacion);
        }
    }
}
