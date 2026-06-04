package com.ecuaviptour.model;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.Objects;

@Entity
@Table(name = "vehiculo")
public class Vehiculo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true, length = 20)
    private String placa;

    @Column(length = 30)
    private String marca;

    @Column(length = 50)
    private String modelo;

    private Integer anio;

    @Column(name = "tipo_vehiculo", length = 20)
    private String tipoVehiculo; // furgoneta, sedan, suv

    @Column(name = "capacidad_max", nullable = false)
    private Integer capacidadMax;

    @Column(length = 30)
    private String color;

    @Column(name = "es_privado", nullable = false)
    private Boolean esPrivado = false;

    @Column(length = 20, nullable = false)
    private String estado = "pendiente"; // pendiente, activo, rechazado

    @Column(name = "foto_auto_url", columnDefinition = "TEXT")
    private String fotoAutoUrl;

    @Column(name = "foto_matricula_url", columnDefinition = "TEXT")
    private String fotoMatriculaUrl;

    @Column(name = "foto_licencia_url", columnDefinition = "TEXT")
    private String fotoLicenciaUrl;

    @Column(name = "licencia_tipo", length = 100)
    private String licenciaTipo;

    @Column(name = "licencia_vigencia", length = 100)
    private String licenciaVigencia;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chofer_id")
    @JsonIgnoreProperties({"hibernateLazyInitializer", "handler", "passwordHash"})
    private Usuario chofer;

    public Vehiculo() {
    }

    public Vehiculo(Long id, String placa, String marca, String modelo, Integer anio, String tipoVehiculo, Integer capacidadMax, String color, Boolean esPrivado, String estado, String fotoAutoUrl, String fotoMatriculaUrl, String fotoLicenciaUrl, String licenciaTipo, String licenciaVigencia, Usuario chofer) {
        this.id = id;
        this.placa = placa;
        this.marca = marca;
        this.modelo = modelo;
        this.anio = anio;
        this.tipoVehiculo = tipoVehiculo;
        this.capacidadMax = capacidadMax != null ? capacidadMax : 15;
        this.color = color;
        this.esPrivado = esPrivado != null ? esPrivado : false;
        this.estado = estado != null ? estado : "pendiente";
        this.fotoAutoUrl = fotoAutoUrl;
        this.fotoMatriculaUrl = fotoMatriculaUrl;
        this.fotoLicenciaUrl = fotoLicenciaUrl;
        this.licenciaTipo = licenciaTipo;
        this.licenciaVigencia = licenciaVigencia;
        this.chofer = chofer;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getPlaca() {
        return placa;
    }

    public void setPlaca(String placa) {
        this.placa = placa;
    }

    public String getMarca() {
        return marca;
    }

    public void setMarca(String marca) {
        this.marca = marca;
    }

    public String getModelo() {
        return modelo;
    }

    public void setModelo(String modelo) {
        this.modelo = modelo;
    }

    public Integer getAnio() {
        return anio;
    }

    public void setAnio(Integer anio) {
        this.anio = anio;
    }

    public String getTipoVehiculo() {
        return tipoVehiculo;
    }

    public void setTipoVehiculo(String tipoVehiculo) {
        this.tipoVehiculo = tipoVehiculo;
    }

    public Integer getCapacidadMax() {
        return capacidadMax;
    }

    public void setCapacidadMax(Integer capacidadMax) {
        this.capacidadMax = capacidadMax;
    }

    public String getColor() {
        return color;
    }

    public void setColor(String color) {
        this.color = color;
    }

    public Boolean getEsPrivado() {
        return esPrivado;
    }

    public void setEsPrivado(Boolean esPrivado) {
        this.esPrivado = esPrivado;
    }

    public String getEstado() {
        return estado;
    }

    public void setEstado(String estado) {
        this.estado = estado;
    }

    public String getFotoAutoUrl() {
        return fotoAutoUrl;
    }

    public void setFotoAutoUrl(String fotoAutoUrl) {
        this.fotoAutoUrl = fotoAutoUrl;
    }

    public String getFotoMatriculaUrl() {
        return fotoMatriculaUrl;
    }

    public void setFotoMatriculaUrl(String fotoMatriculaUrl) {
        this.fotoMatriculaUrl = fotoMatriculaUrl;
    }

    public String getFotoLicenciaUrl() {
        return fotoLicenciaUrl;
    }

    public void setFotoLicenciaUrl(String fotoLicenciaUrl) {
        this.fotoLicenciaUrl = fotoLicenciaUrl;
    }

    public String getLicenciaTipo() {
        return licenciaTipo;
    }

    public void setLicenciaTipo(String licenciaTipo) {
        this.licenciaTipo = licenciaTipo;
    }

    public String getLicenciaVigencia() {
        return licenciaVigencia;
    }

    public void setLicenciaVigencia(String licenciaVigencia) {
        this.licenciaVigencia = licenciaVigencia;
    }

    public Usuario getChofer() {
        return chofer;
    }

    public void setChofer(Usuario chofer) {
        this.chofer = chofer;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (o == null || getClass() != o.getClass()) return false;
        Vehiculo vehiculo = (Vehiculo) o;
        return Objects.equals(id, vehiculo.id);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id);
    }

    public static VehiculoBuilder builder() {
        return new VehiculoBuilder();
    }

    public static class VehiculoBuilder {
        private Long id;
        private String placa;
        private String marca;
        private String modelo;
        private Integer anio;
        private String tipoVehiculo;
        private Integer capacidadMax;
        private String color;
        private Boolean esPrivado = false;
        private String estado = "pendiente";
        private String fotoAutoUrl;
        private String fotoMatriculaUrl;
        private String fotoLicenciaUrl;
        private String licenciaTipo;
        private String licenciaVigencia;
        private Usuario chofer;

        public VehiculoBuilder id(Long id) { this.id = id; return this; }
        public VehiculoBuilder placa(String placa) { this.placa = placa; return this; }
        public VehiculoBuilder marca(String marca) { this.marca = marca; return this; }
        public VehiculoBuilder modelo(String modelo) { this.modelo = modelo; return this; }
        public VehiculoBuilder anio(Integer anio) { this.anio = anio; return this; }
        public VehiculoBuilder tipoVehiculo(String tipoVehiculo) { this.tipoVehiculo = tipoVehiculo; return this; }
        public VehiculoBuilder capacidadMax(Integer capacidadMax) { this.capacidadMax = capacidadMax; return this; }
        public VehiculoBuilder color(String color) { this.color = color; return this; }
        public VehiculoBuilder esPrivado(Boolean esPrivado) { this.esPrivado = esPrivado; return this; }
        public VehiculoBuilder estado(String estado) { this.estado = estado; return this; }
        public VehiculoBuilder fotoAutoUrl(String fotoAutoUrl) { this.fotoAutoUrl = fotoAutoUrl; return this; }
        public VehiculoBuilder fotoMatriculaUrl(String fotoMatriculaUrl) { this.fotoMatriculaUrl = fotoMatriculaUrl; return this; }
        public VehiculoBuilder fotoLicenciaUrl(String fotoLicenciaUrl) { this.fotoLicenciaUrl = fotoLicenciaUrl; return this; }
        public VehiculoBuilder licenciaTipo(String licenciaTipo) { this.licenciaTipo = licenciaTipo; return this; }
        public VehiculoBuilder licenciaVigencia(String licenciaVigencia) { this.licenciaVigencia = licenciaVigencia; return this; }
        public VehiculoBuilder chofer(Usuario chofer) { this.chofer = chofer; return this; }

        public Vehiculo build() {
            return new Vehiculo(id, placa, marca, modelo, anio, tipoVehiculo, capacidadMax, color, esPrivado, estado, fotoAutoUrl, fotoMatriculaUrl, fotoLicenciaUrl, licenciaTipo, licenciaVigencia, chofer);
        }
    }
}
