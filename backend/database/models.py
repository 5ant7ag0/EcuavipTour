from datetime import datetime
from .db import db

class Usuario(db.Model):
    __tablename__ = 'usuario'
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), nullable=False)
    correo = db.Column(db.String(100), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)
    telefono = db.Column(db.String(20))
    cedula = db.Column(db.String(15), unique=True)
    foto_perfil_url = db.Column(db.Text)
    rol = db.Column(db.String(20)) # admin, chofer, cliente
    activo = db.Column(db.Boolean, default=True)
    fecha_registro = db.Column(db.DateTime, default=datetime.utcnow)

class Vehiculo(db.Model):
    __tablename__ = 'vehiculo'
    id = db.Column(db.Integer, primary_key=True)
    placa = db.Column(db.String(20), unique=True, nullable=False)
    marca = db.Column(db.String(30))
    modelo = db.Column(db.String(50))
    anio = db.Column(db.Integer)
    tipo_vehiculo = db.Column(db.String(20)) # furgoneta, sedan, suv
    capacidad_max = db.Column(db.Integer, nullable=False)
    color = db.Column(db.String(30)) # Color de la unidad
    es_privado = db.Column(db.Boolean, default=False)
    estado = db.Column(db.String(20), default='pendiente') # pendiente, activo, rechazado
    
    # Nuevos campos para documentación y fotos
    foto_auto_url = db.Column(db.Text)
    foto_matricula_url = db.Column(db.Text)
    foto_licencia_url = db.Column(db.Text)
    
    # Relación con el chofer
    chofer_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))

class Viaje(db.Model):
    __tablename__ = 'viaje'
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    chofer_id = db.Column(db.Integer, db.ForeignKey('usuario.id'), nullable=True)
    vehiculo_id = db.Column(db.Integer, db.ForeignKey('vehiculo.id'), nullable=True)
    
    dir_origen = db.Column(db.Text, nullable=False)
    lat_origen = db.Column(db.Numeric(10, 8))
    lng_origen = db.Column(db.Numeric(11, 8))
    
    dir_destino = db.Column(db.Text, nullable=False)
    lat_destino = db.Column(db.Numeric(10, 8))
    lng_destino = db.Column(db.Numeric(11, 8))
    
    referencia_adicional = db.Column(db.Text)
    distancia_km = db.Column(db.Numeric(10, 2))
    monto_total = db.Column(db.Numeric(10, 2))
    
    tipo_servicio = db.Column(db.String(20)) # pasajero, encomienda, express
    tipo_modalidad = db.Column(db.String(20)) # compartido, privado_express
    
    estado_pago = db.Column(db.String(20), default='pendiente')
    estado_logistico = db.Column(db.String(20), default='pendiente')
    
    fecha_limite_pago = db.Column(db.DateTime)
    fecha_creacion = db.Column(db.DateTime, default=datetime.utcnow)

class Pago(db.Model):
    __tablename__ = 'pago'
    id = db.Column(db.Integer, primary_key=True)
    viaje_id = db.Column(db.Integer, db.ForeignKey('viaje.id'))
    comprobante_url = db.Column(db.Text)
    monto_pagado = db.Column(db.Numeric(10, 2))
    fecha_pago = db.Column(db.DateTime, default=datetime.utcnow)

class TicketQR(db.Model):
    __tablename__ = 'ticketqr'
    id = db.Column(db.Integer, primary_key=True)
    viaje_id = db.Column(db.Integer, db.ForeignKey('viaje.id'))
    codigo_hash = db.Column(db.String(255), unique=True, nullable=False)
    estado = db.Column(db.String(20), default='generado')

class Calificacion(db.Model):
    __tablename__ = 'calificacion'
    id = db.Column(db.Integer, primary_key=True)
    viaje_id = db.Column(db.Integer, db.ForeignKey('viaje.id'))
    cliente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    estrellas = db.Column(db.Integer)
    comentario = db.Column(db.Text)
    fecha_calificacion = db.Column(db.DateTime, default=datetime.utcnow)

class MensajeChat(db.Model):
    __tablename__ = 'mensajechat'
    id = db.Column(db.Integer, primary_key=True)
    viaje_id = db.Column(db.Integer, db.ForeignKey('viaje.id'))
    remitente_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    destinatario_id = db.Column(db.Integer, db.ForeignKey('usuario.id'))
    tipo_receptor = db.Column(db.String(20), default='admin') # 'admin' o 'chofer'
    contenido = db.Column(db.Text, nullable=False)
    leido = db.Column(db.Boolean, default=False)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)
