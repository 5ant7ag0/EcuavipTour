package com.ecuaviptour.dto;

import com.ecuaviptour.model.Viaje;
import com.fasterxml.jackson.annotation.JsonProperty;
import java.math.BigDecimal;
import java.time.LocalDateTime;

public class ViajeDTO {
    private Long id;
    private UsuarioDTO cliente;
    private UsuarioDTO chofer;
    private VehiculoDTO vehiculo;

    @JsonProperty("dir_origen")
    private String dirOrigen;

    @JsonProperty("lat_origen")
    private BigDecimal latOrigen;

    @JsonProperty("lng_origen")
    private BigDecimal lngOrigen;

    @JsonProperty("dir_destino")
    private String dirDestino;

    @JsonProperty("lat_destino")
    private BigDecimal latDestino;

    @JsonProperty("lng_destino")
    private BigDecimal lngDestino;

    @JsonProperty("referencia_adicional")
    private String referenciaAdicional;

    @JsonProperty("distancia_km")
    private BigDecimal distanciaKm;

    @JsonProperty("monto_total")
    private BigDecimal montoTotal;

    @JsonProperty("tipo_servicio")
    private String tipoServicio;

    @JsonProperty("tipo_modalidad")
    private String tipoModalidad;

    @JsonProperty("estado_pago")
    private String estadoPago;

    @JsonProperty("estado_logistico")
    private String estadoLogistico;

    @JsonProperty("fecha_limite_pago")
    private LocalDateTime fechaLimitePago;

    @JsonProperty("fecha_creacion")
    private LocalDateTime fechaCreacion;

    @JsonProperty("fecha_viaje")
    private LocalDateTime fechaViaje;

    @JsonProperty("duracion_minutos")
    private Integer duracionMinutos;

    public ViajeDTO() {
    }

    public ViajeDTO(Long id, UsuarioDTO cliente, UsuarioDTO chofer, VehiculoDTO vehiculo, String dirOrigen, BigDecimal latOrigen, BigDecimal lngOrigen, String dirDestino, BigDecimal latDestino, BigDecimal lngDestino, String referenciaAdicional, BigDecimal distanciaKm, BigDecimal montoTotal, String tipoServicio, String tipoModalidad, String estadoPago, String estadoLogistico, LocalDateTime fechaLimitePago, LocalDateTime fechaCreacion, LocalDateTime fechaViaje, Integer duracionMinutos) {
        this.id = id;
        this.cliente = cliente;
        this.chofer = chofer;
        this.vehiculo = vehiculo;
        this.dirOrigen = dirOrigen;
        this.latOrigen = latOrigen;
        this.lngOrigen = lngOrigen;
        this.dirDestino = dirDestino;
        this.latDestino = latDestino;
        this.lngDestino = lngDestino;
        this.referenciaAdicional = referenciaAdicional;
        this.distanciaKm = distanciaKm;
        this.montoTotal = montoTotal;
        this.tipoServicio = tipoServicio;
        this.tipoModalidad = tipoModalidad;
        this.estadoPago = estadoPago;
        this.estadoLogistico = estadoLogistico;
        this.fechaLimitePago = fechaLimitePago;
        this.fechaCreacion = fechaCreacion;
        this.fechaViaje = fechaViaje;
        this.duracionMinutos = duracionMinutos;
    }


    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public UsuarioDTO getCliente() {
        return cliente;
    }

    public void setCliente(UsuarioDTO cliente) {
        this.cliente = cliente;
    }

    public UsuarioDTO getChofer() {
        return chofer;
    }

    public void setChofer(UsuarioDTO chofer) {
        this.chofer = chofer;
    }

    public VehiculoDTO getVehiculo() {
        return vehiculo;
    }

    public void setVehiculo(VehiculoDTO vehiculo) {
        this.vehiculo = vehiculo;
    }

    public String getDirOrigen() {
        return dirOrigen;
    }

    public void setDirOrigen(String dirOrigen) {
        this.dirOrigen = dirOrigen;
    }

    public BigDecimal getLatOrigen() {
        return latOrigen;
    }

    public void setLatOrigen(BigDecimal latOrigen) {
        this.latOrigen = latOrigen;
    }

    public BigDecimal getLngOrigen() {
        return lngOrigen;
    }

    public void setLngOrigen(BigDecimal lngOrigen) {
        this.lngOrigen = lngOrigen;
    }

    public String getDirDestino() {
        return dirDestino;
    }

    public void setDirDestino(String dirDestino) {
        this.dirDestino = dirDestino;
    }

    public BigDecimal getLatDestino() {
        return latDestino;
    }

    public void setLatDestino(BigDecimal latDestino) {
        this.latDestino = latDestino;
    }

    public BigDecimal getLngDestino() {
        return lngDestino;
    }

    public void setLngDestino(BigDecimal lngDestino) {
        this.lngDestino = lngDestino;
    }

    public String getReferenciaAdicional() {
        return referenciaAdicional;
    }

    public void setReferenciaAdicional(String referenciaAdicional) {
        this.referenciaAdicional = referenciaAdicional;
    }

    public BigDecimal getDistanciaKm() {
        return distanciaKm;
    }

    public void setDistanciaKm(BigDecimal distanciaKm) {
        this.distanciaKm = distanciaKm;
    }

    public BigDecimal getMontoTotal() {
        return montoTotal;
    }

    public void setMontoTotal(BigDecimal montoTotal) {
        this.montoTotal = montoTotal;
    }

    public String getTipoServicio() {
        return tipoServicio;
    }

    public void setTipoServicio(String tipoServicio) {
        this.tipoServicio = tipoServicio;
    }

    public String getTipoModalidad() {
        return tipoModalidad;
    }

    public void setTipoModalidad(String tipoModalidad) {
        this.tipoModalidad = tipoModalidad;
    }

    public String getEstadoPago() {
        return estadoPago;
    }

    public void setEstadoPago(String estadoPago) {
        this.estadoPago = estadoPago;
    }

    public String getEstadoLogistico() {
        return estadoLogistico;
    }

    public void setEstadoLogistico(String estadoLogistico) {
        this.estadoLogistico = estadoLogistico;
    }

    public LocalDateTime getFechaLimitePago() {
        return fechaLimitePago;
    }

    public void setFechaLimitePago(LocalDateTime fechaLimitePago) {
        this.fechaLimitePago = fechaLimitePago;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public LocalDateTime getFechaViaje() {
        return fechaViaje;
    }

    public void setFechaViaje(LocalDateTime fechaViaje) {
        this.fechaViaje = fechaViaje;
    }

    public Integer getDuracionMinutos() {
        return duracionMinutos;
    }

    public void setDuracionMinutos(Integer duracionMinutos) {
        this.duracionMinutos = duracionMinutos;
    }
}
