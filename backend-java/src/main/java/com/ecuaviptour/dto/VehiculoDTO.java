package com.ecuaviptour.dto;

import com.ecuaviptour.model.Vehiculo;
import com.fasterxml.jackson.annotation.JsonProperty;

public class VehiculoDTO {
    private Long id;
    private String placa;
    private String marca;
    private String modelo;
    private Integer anio;

    @JsonProperty("tipo_vehiculo")
    private String tipoVehiculo;

    @JsonProperty("capacidad_max")
    private Integer capacidadMax;

    private String color;

    @JsonProperty("es_privado")
    private Boolean esPrivado;

    private String estado;

    @JsonProperty("foto_auto_url")
    private String fotoAutoUrl;

    @JsonProperty("foto_matricula_url")
    private String fotoMatriculaUrl;

    @JsonProperty("foto_licencia_url")
    private String fotoLicenciaUrl;

    @JsonProperty("licencia_tipo")
    private String licenciaTipo;

    @JsonProperty("licencia_vigencia")
    private String licenciaVigencia;

    private UsuarioDTO chofer;

    public VehiculoDTO() {
    }

    public VehiculoDTO(Long id, String placa, String marca, String modelo, Integer anio, String tipoVehiculo, Integer capacidadMax, String color, Boolean esPrivado, String estado, String fotoAutoUrl, String fotoMatriculaUrl, String fotoLicenciaUrl, String licenciaTipo, String licenciaVigencia, UsuarioDTO chofer) {
        this.id = id;
        this.placa = placa;
        this.marca = marca;
        this.modelo = modelo;
        this.anio = anio;
        this.tipoVehiculo = tipoVehiculo;
        this.capacidadMax = capacidadMax;
        this.color = color;
        this.esPrivado = esPrivado;
        this.estado = estado;
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

    public UsuarioDTO getChofer() {
        return chofer;
    }

    public void setChofer(UsuarioDTO chofer) {
        this.chofer = chofer;
    }
}
