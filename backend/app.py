import os
from flask import Flask, jsonify, request, send_from_directory
from flask_cors import CORS
import hashlib
from dotenv import load_dotenv
from flask_socketio import SocketIO, emit, join_room
from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime, timedelta
from flask_apscheduler import APScheduler
from models import db, Usuario, Viaje, Pago, MensajeChat, TicketQR

# 1. Cargar variables de entorno del archivo .env
load_dotenv()

app = Flask(__name__)
CORS(app)

# 1.5 Configuración de SocketIO y JWT
socketio = SocketIO(app, cors_allowed_origins="*")
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", 'ecuavip-super-secret-key-123')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False # Tokens no expiran para simplificar
jwt = JWTManager(app)

# 1.6 Configuración de APScheduler
class Config:
    SCHEDULER_API_ENABLED = True

app.config.from_object(Config())
scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

@socketio.on('join')
def on_join(data):
    role = data.get('role')
    user_id = data.get('user_id')
    
    print(f"[JOIN] role={role} user_id={user_id} sid={request.sid}")
    
    if role == 'admin':
        join_room('admins')
        print(f"[JOIN] Admin {user_id} -> room 'admins' OK")
    elif role == 'cliente' and user_id:
        room = f"cliente_{user_id}"
        join_room(room)
        print(f"[JOIN] Cliente {user_id} -> room '{room}' OK")
    elif role == 'chofer':
        join_room('choferes')
        print(f"[JOIN] Chofer {user_id} -> room 'choferes' OK")
        # Enviar viajes que ya están buscando chofer
        viajes_pendientes = Viaje.query.filter_by(estado_logistico='buscando_chofer').all()
        for v in viajes_pendientes:
            emit('nuevo_viaje_disponible', {
                'viaje_id': v.id,
                'origen': v.dir_origen,
                'destino': v.dir_destino,
                'tarifa': float(v.monto_total),
                'tipo_servicio': v.tipo_servicio
            }, room=request.sid)
    else:
        print(f"[JOIN] WARNING: No specific room logic for role={role}")

@socketio.on('enviar_mensaje')
def on_enviar_mensaje(data):
    viaje_id = data.get('viaje_id')
    remitente_id = data.get('remitente_id')
    destinatario_id = data.get('destinatario_id')
    contenido = data.get('contenido')
    
    print(f"[MSG] remitente={remitente_id} destinatario={destinatario_id} viaje={viaje_id} contenido='{contenido[:30] if contenido else None}'")
    
    if not contenido or not remitente_id:
        print("[MSG] ERROR: contenido o remitente_id faltante")
        return
    
    # 1. Guardar en base de datos
    nuevo_mensaje = MensajeChat(
        viaje_id=viaje_id,
        remitente_id=remitente_id,
        destinatario_id=destinatario_id,
        contenido=contenido
    )
    db.session.add(nuevo_mensaje)
    db.session.commit()
    print(f"[MSG] Guardado en DB con id={nuevo_mensaje.id}")
    
    mensaje_dict = {
        'id': nuevo_mensaje.id,
        'viaje_id': viaje_id,
        'remitente_id': remitente_id,
        'destinatario_id': destinatario_id,
        'contenido': contenido,
        'timestamp': nuevo_mensaje.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    }
    
    # 2. Siempre emitir al admin
    emit('nuevo_mensaje', mensaje_dict, room='admins')
    print(f"[MSG] Emitido a room 'admins'")
    
    # 3. Determinar el cliente_id para emitir al room correcto
    cliente_id_destino = None
    
    if viaje_id:
        viaje = Viaje.query.get(viaje_id)
        if viaje:
            cliente_id_destino = viaje.cliente_id
            print(f"[MSG] cliente_id_destino por viaje: {cliente_id_destino}")
        else:
            print(f"[MSG] WARNING: viaje_id={viaje_id} no encontrado en DB")
    
    if not cliente_id_destino and destinatario_id:
        cliente_id_destino = destinatario_id
        print(f"[MSG] cliente_id_destino por destinatario_id: {cliente_id_destino}")
    
    if cliente_id_destino:
        room_destino = f"cliente_{cliente_id_destino}"
        emit('nuevo_mensaje', mensaje_dict, room=room_destino)
        print(f"[MSG] Emitido a room '{room_destino}'")
    else:
        print(f"[MSG] ERROR CRITICO: No se pudo determinar cliente_id_destino!")

# 1.6 Configuración de Subidas (Uploads)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads/comprobantes')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 2. Configuración de la Base de Datos desde .env
uri = os.getenv("DATABASE_URL")

# Corrección para compatibilidad de SQLAlchemy con Heroku/Supabase
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

if not uri:
    raise RuntimeError("No se pudo cargar DATABASE_URL del archivo .env")

app.config['SQLALCHEMY_DATABASE_URI'] = uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300
}

# 3. Inicialización de la base de datos
db.init_app(app)

# 4. Rutas de Prueba y Diagnóstico
@app.route('/')
def home():
    return jsonify({"proyecto": "Ecuavip Tour API", "estado": "online"}), 200

# Endpoint para servir comprobantes subidos
@app.route('/uploads/comprobantes/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

# 5. Eventos WebSocket base
@socketio.on('connect')
def handle_connect():
    print("Nuevo cliente conectado a WebSocket")
    emit('server_message', {'data': 'Conexión WebSocket exitosa con Flask'})

@socketio.on('disconnect')
def handle_disconnect():
    print("Cliente desconectado de WebSocket")

# 5.1 Eventos para Chofer (Uber-style)
@socketio.on('aceptar_viaje')
def handle_aceptar_viaje(data):
    # data: {viaje_id: 123, chofer_id: 45}
    viaje_id = data.get('viaje_id')
    chofer_id = data.get('chofer_id')
    
    viaje = Viaje.query.get(viaje_id)
    if not viaje:
        return
    
    # Solo el primer chofer en aceptar se queda con el viaje
    if viaje.chofer_id is None:
        viaje.chofer_id = chofer_id
        viaje.estado_logistico = 'en_curso'
        db.session.commit()
        
        # Notificar al chofer ganador
        emit('viaje_confirmado_chofer', {'viaje_id': viaje_id, 'mensaje': '¡Viaje asignado con éxito!'}, room=request.sid)
        
        # Notificar al cliente
        room_cliente = f"cliente_{viaje.cliente_id}"
        emit('chofer_asignado', {
            'viaje_id': viaje_id, 
            'chofer_id': chofer_id,
            'nombre_chofer': Usuario.query.get(chofer_id).nombre,
            'estado': 'en_curso'
        }, room=room_cliente)
        
        # Notificar a los admins
        emit('viaje_actualizado_admin', {'viaje_id': viaje_id, 'estado': 'en_curso'}, room='admins')
    else:
        emit('viaje_ya_tomado', {'mensaje': 'Lo sentimos, este viaje ya fue aceptado por otro chofer.'}, room=request.sid)

@socketio.on('actualizar_ubicacion_chofer')
def handle_actualizar_ubicacion(data):
    # data: {viaje_id: 123, lat: -1.2, lng: -78.5}
    viaje_id = data.get('viaje_id')
    lat = data.get('lat')
    lng = data.get('lng')
    
    viaje = Viaje.query.get(viaje_id)
    if viaje:
        # Retransmitir al cliente del viaje
        room_cliente = f"cliente_{viaje.cliente_id}"
        emit('ubicacion_chofer_actualizada', {'lat': lat, 'lng': lng}, room=room_cliente)

@socketio.on('finalizar_viaje')
def handle_finalizar_viaje(data):
    viaje_id = data.get('viaje_id')
    viaje = Viaje.query.get(viaje_id)
    if viaje:
        viaje.estado_logistico = 'finalizado'
        db.session.commit()
        
        # Notificar al cliente
        room_cliente = f"cliente_{viaje.cliente_id}"
        emit('viaje_finalizado', {'viaje_id': viaje_id}, room=room_cliente)
        
        # Notificar a los admins
        emit('viaje_actualizado_admin', {'viaje_id': viaje_id, 'estado': 'finalizado'}, room='admins')

# 6. Endpoints de Autenticación
@app.route('/api/auth/register', methods=['POST'])
def register():
    datos = request.json
    if not datos or not datos.get('correo') or not datos.get('password') or not datos.get('nombre'):
        return jsonify({"error": "Faltan datos obligatorios"}), 400
    
    usuario_existente = Usuario.query.filter_by(correo=datos.get('correo')).first()
    if usuario_existente:
        return jsonify({"error": "El correo ya está registrado"}), 400
    
    nuevo_usuario = Usuario(
        nombre=datos.get('nombre'),
        correo=datos.get('correo'),
        password_hash=generate_password_hash(datos.get('password')),
        telefono=datos.get('telefono', ''),
        rol=datos.get('rol', 'cliente')
    )
    db.session.add(nuevo_usuario)
    db.session.commit()
    
    token = create_access_token(identity=str(nuevo_usuario.id))
    return jsonify({"mensaje": "Usuario registrado", "token": token, "usuario": {"id": nuevo_usuario.id, "nombre": nuevo_usuario.nombre, "correo": nuevo_usuario.correo}}), 201

@app.route('/api/auth/login', methods=['POST'])
def login():
    datos = request.json
    usuario = Usuario.query.filter_by(correo=datos.get('correo')).first()
    if not usuario or not check_password_hash(usuario.password_hash, datos.get('password')):
        return jsonify({"error": "Credenciales inválidas"}), 401
    
    token = create_access_token(identity=str(usuario.id))
    return jsonify({"mensaje": "Login exitoso", "token": token, "usuario": {"id": usuario.id, "nombre": usuario.nombre, "correo": usuario.correo, "rol": usuario.rol}}), 200

# 7. Endpoints de Negocio (Cotización, Reservas, Pagos)
@app.route('/api/cotizar', methods=['POST'])
def cotizar():
    datos = request.json
    if not datos:
        return jsonify({"error": "No hay datos"}), 400
    
    distancia = float(datos.get('distancia_km', 0))
    tipo_servicio = datos.get('tipo_servicio', 'pasajero')
    num_pasajeros = int(datos.get('num_pasajeros', 1))

    precio_zona = 0
    zona = ""
    
    if distancia <= 145:
        precio_zona = 15
        zona = "Norte (Hasta La Marín/Condado)"
    elif distancia <= 155:
        precio_zona = 18
        zona = "Valles y Sur"
    elif distancia <= 165:
        precio_zona = 20
        zona = "Carapungo/Calderón"
    else:
        precio_zona = 22
        zona = "Mitad del Mundo / Extremos"

    if tipo_servicio == 'express':
        base = 60
        if distancia <= 165:
            precio_total = base
        else:
            km_extra = distancia - 165
            precio_total = base + (km_extra * 0.50)
        return jsonify({
            "precio_total": round(precio_total, 2),
            "precio_unitario": round(precio_total, 2),
            "zona": "Express 24H (Tababela)"
        }), 200

    elif tipo_servicio == 'encomienda':
        precio_unitario = precio_zona * 0.70
        precio_total = precio_unitario
        return jsonify({
            "precio_total": round(precio_total, 2),
            "precio_unitario": round(precio_unitario, 2),
            "zona": zona,
            "mensaje": "Peso máximo permitido de maleta: 25Kg"
        }), 200
        
    elif tipo_servicio == 'pasajero':
        precio_total = precio_zona * num_pasajeros
        return jsonify({
            "precio_total": round(precio_total, 2),
            "precio_unitario": round(precio_zona, 2),
            "zona": zona
        }), 200

    return jsonify({"error": "Tipo de servicio inválido"}), 400

@app.route('/api/viajes/reservar', methods=['POST'])
@jwt_required()
def reservar_viaje():
    datos = request.json
    cliente_id = get_jwt_identity()
    
    nuevo_viaje = Viaje(
        cliente_id=cliente_id,
        dir_origen=datos.get('origen'),
        lat_origen=0.0, # Por simplicidad no enviamos coordenadas ahora
        lng_origen=0.0,
        dir_destino=datos.get('destino'),
        lat_destino=0.0,
        lng_destino=0.0,
        distancia_km=datos.get('distancia_km', 0),
        monto_total=datos.get('tarifa'),
        tipo_servicio=datos.get('tipo_servicio'),
        tipo_modalidad='compartido' if datos.get('tipo_servicio') == 'pasajero' else 'privado_express',
        estado_pago='pendiente',
        estado_logistico='pendiente',
        fecha_limite_pago=datetime.utcnow() + timedelta(minutes=15)
    )
    
    db.session.add(nuevo_viaje)
    db.session.commit()
    
    return jsonify({"mensaje": "Reserva creada exitosamente", "viaje_id": nuevo_viaje.id}), 201

@app.route('/api/pagos/subir_comprobante', methods=['POST'])
@jwt_required()
def subir_comprobante():
    if 'comprobante' not in request.files:
        return jsonify({"error": "No se envió ningún archivo"}), 400
    
    file = request.files['comprobante']
    viaje_id = request.form.get('viaje_id')
    
    if file.filename == '':
        return jsonify({"error": "Nombre de archivo vacío"}), 400
    
    if file and viaje_id:
        filename = secure_filename(f"viaje_{viaje_id}_{file.filename}")
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Registrar pago en DB
        viaje = Viaje.query.get(viaje_id)
        if not viaje:
            return jsonify({"error": "Viaje no encontrado"}), 404
            
        nuevo_pago = Pago(
            viaje_id=viaje_id,
            comprobante_url=f"/uploads/comprobantes/{filename}",
            monto_pagado=viaje.monto_total
        )
        viaje.estado_pago = 'comprobante_subido'
        
        db.session.add(nuevo_pago)
        db.session.commit()
        
        # Notificar a los administradores en tiempo real
        socketio.emit('nuevo_comprobante', {'viaje_id': viaje_id, 'mensaje': 'Nuevo comprobante subido'}, room='admins')
        
        return jsonify({"mensaje": "Comprobante subido exitosamente", "pago_id": nuevo_pago.id}), 200
        
    return jsonify({"error": "Datos incompletos"}), 400

import hashlib
from models import TicketQR, MensajeChat

# 8. Endpoints de Administración (Pagos)
@app.route('/api/admin/pagos', methods=['GET'])
@jwt_required()
def get_pagos():
    estado_filtro = request.args.get('estado', 'pendientes')
    
    mapeo_estados = {
        'pendientes': 'comprobante_subido',
        'aprobados': 'aprobado',
        'rechazados': 'rechazado'
    }
    estado_db = mapeo_estados.get(estado_filtro, 'comprobante_subido')
    
    pagos = Pago.query.join(Viaje).filter(Viaje.estado_pago == estado_db).all()
    resultado = []
    for pago in pagos:
        viaje = Viaje.query.get(pago.viaje_id)
        cliente = Usuario.query.get(viaje.cliente_id)
        resultado.append({
            "pago_id": pago.id,
            "viaje_id": viaje.id,
            "cliente_id": cliente.id,
            "cliente_nombre": cliente.nombre,
            "cliente_correo": cliente.correo,
            "monto": float(pago.monto_pagado),
            "comprobante_url": f"http://127.0.0.1:5001{pago.comprobante_url}",
            "origen": viaje.dir_origen,
            "destino": viaje.dir_destino,
            "tipo_servicio": viaje.tipo_servicio,
            "estado_pago": viaje.estado_pago,
            "fecha": pago.fecha_pago.strftime("%Y-%m-%d %H:%M")
        })
    return jsonify(resultado), 200

@app.route('/api/admin/inbox', methods=['GET'])
@jwt_required()
def get_inbox():
    from sqlalchemy import func, or_
    admin_id_current = get_jwt_identity()
    
    # Agrupamos mensajes por el cliente involucrado.
    # El cliente es el dueño del viaje asociado al mensaje.
    subquery = db.session.query(
        func.max(MensajeChat.timestamp).label('max_fecha'),
        Viaje.cliente_id.label('cliente_id_sub')
    ).join(Viaje, MensajeChat.viaje_id == Viaje.id)\
     .group_by(Viaje.cliente_id).subquery()

    mensajes = db.session.query(MensajeChat).join(Viaje, MensajeChat.viaje_id == Viaje.id).join(
        subquery,
        db.and_(
            Viaje.cliente_id == subquery.c.cliente_id_sub,
            MensajeChat.timestamp == subquery.c.max_fecha
        )
    ).order_by(MensajeChat.timestamp.desc()).all()

    resultado = []
    vistos = set()
    for msj in mensajes:
        viaje_context = Viaje.query.get(msj.viaje_id)
        if not viaje_context: continue
        
        otro_id = viaje_context.cliente_id
        if otro_id in vistos: continue
        vistos.add(otro_id)
        
        cliente = Usuario.query.get(otro_id)
        if not cliente: continue

        # Contar no leídos de este cliente. 
        # Los no leídos son mensajes donde el cliente (otro_id) es el remitente 
        # y el administrador es el destinatario (o destinatario_id es NULL)
        unread = MensajeChat.query.join(Viaje, MensajeChat.viaje_id == Viaje.id).filter(
            Viaje.cliente_id == otro_id,
            MensajeChat.remitente_id == otro_id,
            MensajeChat.leido == False
        ).count()
        
        # Info del último viaje para contexto rápido (opcional)
        ultimo_viaje = Viaje.query.filter_by(cliente_id=otro_id).order_by(Viaje.fecha_creacion.desc()).first()
        
        resultado.append({
            "cliente_id": cliente.id,
            "cliente_nombre": cliente.nombre,
            "ultimo_mensaje": msj.contenido,
            "fecha_ultimo_mensaje": msj.timestamp.strftime("%Y-%m-%d %H:%M"),
            "unread": unread,
            "viaje_id": msj.viaje_id, # Para mantener compatibilidad de UI si es necesario
            "estado_pago": ultimo_viaje.estado_pago if ultimo_viaje else 'n/a'
        })
        
    return jsonify(resultado), 200

@app.route('/api/admin/aprobar_pago', methods=['POST'])
@jwt_required()
def aprobar_pago():
    datos = request.json
    pago_id = datos.get('pago_id')
    admin_id = get_jwt_identity()
    
    pago = Pago.query.get(pago_id)
    if not pago: return jsonify({"error": "Pago no encontrado"}), 404
    
    viaje = Viaje.query.get(pago.viaje_id)
    viaje.estado_pago = 'aprobado'
    viaje.estado_logistico = 'buscando_chofer'
    
    # Generar Ticket QR (Hash único)
    hash_str = hashlib.sha256(f"viaje_{viaje.id}_{viaje.cliente_id}_{viaje.fecha_creacion}".encode()).hexdigest()
    nuevo_ticket = TicketQR(
        viaje_id=viaje.id,
        codigo_hash=hash_str,
        estado='generado'
    )
    db.session.add(nuevo_ticket)
    db.session.commit()
    
    # Mensaje automático en el chat con el PIN (últimos 4 del hash)
    pin = hash_str[-4:].upper()
    mensaje = MensajeChat(
        viaje_id=viaje.id,
        remitente_id=admin_id,
        destinatario_id=viaje.cliente_id,
        contenido=f"¡Excelente! Tu pago ha sido aprobado. Tu ticket QR ha sido generado. Tu PIN de abordaje es: {pin}"
    )
    db.session.add(mensaje)
    db.session.commit()
    
    mensaje_dict = {
        'id': mensaje.id,
        'viaje_id': viaje.id,
        'remitente_id': admin_id,
        'destinatario_id': viaje.cliente_id,
        'contenido': mensaje.contenido,
        'timestamp': mensaje.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    }
    socketio.emit('nuevo_mensaje', mensaje_dict, room='admins')
    socketio.emit('nuevo_mensaje', mensaje_dict, room=f"cliente_{viaje.cliente_id}")
    
    # Notificar al cliente
    socketio.emit('pago_actualizado', {'viaje_id': viaje.id, 'estado': 'aprobado'}, room=f"cliente_{viaje.cliente_id}")
    
    # NOTIFICAR A TODOS LOS CHOFERES (Uber-style)
    socketio.emit('nuevo_viaje_disponible', {
        'viaje_id': viaje.id,
        'origen': viaje.dir_origen,
        'destino': viaje.dir_destino,
        'tarifa': float(viaje.monto_total),
        'tipo_servicio': viaje.tipo_servicio
    }, room='choferes')
    
    return jsonify({"mensaje": "Pago aprobado, ticket generado", "hash": hash_str}), 200

# 8.2 Validar Abordaje (PIN o QR)
@app.route('/api/viaje/validar_abordaje', methods=['POST'])
@jwt_required()
def validar_abordaje():
    datos = request.json
    viaje_id = datos.get('viaje_id')
    pin_o_qr = datos.get('codigo') # Puede ser el hash completo o solo los 4 dígitos
    
    viaje = Viaje.query.get(viaje_id)
    if not viaje: return jsonify({"error": "Viaje no encontrado"}), 404
    
    ticket = TicketQR.query.filter_by(viaje_id=viaje.id).first()
    if not ticket: return jsonify({"error": "Ticket no generado"}), 404
    
    # Validar (PIN: últimos 4 caracteres del hash)
    es_valido = False
    if pin_o_qr == ticket.codigo_hash:
        es_valido = True
    elif pin_o_qr.upper() == ticket.codigo_hash[-4:].upper():
        es_valido = True
        
    if es_valido:
        ticket.estado = 'usado'
        viaje.estado_logistico = 'en_viaje'
        db.session.commit()
        
        # Notificar a las salas
        socketio.emit('abordaje_confirmado', {'viaje_id': viaje.id}, room=f"cliente_{viaje.cliente_id}")
        socketio.emit('abordaje_confirmado', {'viaje_id': viaje.id}, room='admins')
        
        return jsonify({"mensaje": "Abordaje validado con éxito. ¡Buen viaje!"}), 200
    else:
        return jsonify({"error": "Código o PIN incorrecto"}), 400

@app.route('/api/admin/rechazar_pago', methods=['POST'])
@jwt_required()
def rechazar_pago():
    datos = request.json
    pago_id = datos.get('pago_id')
    motivo = datos.get('motivo', 'Comprobante inválido')
    admin_id = get_jwt_identity()
    
    pago = Pago.query.get(pago_id)
    if not pago: return jsonify({"error": "Pago no encontrado"}), 404
    
    viaje = Viaje.query.get(pago.viaje_id)
    viaje.estado_pago = 'rechazado'
    
    # Enviar mensaje al cliente
    mensaje = MensajeChat(
        viaje_id=viaje.id,
        remitente_id=admin_id,
        destinatario_id=viaje.cliente_id,
        contenido=f"Tu pago ha sido rechazado. Motivo: {motivo}"
    )
    db.session.add(mensaje)
    db.session.commit()
    
    # Notificar al cliente
    mensaje_dict = {
        'id': mensaje.id,
        'viaje_id': viaje.id,
        'remitente_id': admin_id,
        'destinatario_id': viaje.cliente_id,
        'contenido': mensaje.contenido,
        'timestamp': mensaje.timestamp.strftime("%Y-%m-%d %H:%M:%S")
    }
    socketio.emit('nuevo_mensaje', mensaje_dict, room='admins')
    socketio.emit('nuevo_mensaje', mensaje_dict, room=f"cliente_{viaje.cliente_id}")
    socketio.emit('pago_actualizado', {'viaje_id': viaje.id, 'estado': 'rechazado'}, room=f"cliente_{viaje.cliente_id}")
    
    return jsonify({"mensaje": "Pago rechazado exitosamente"}), 200

# 9. Endpoints del Cliente
@app.route('/api/cliente/mis_viajes', methods=['GET'])
@jwt_required()
def mis_viajes():
    cliente_id = int(get_jwt_identity())
    viajes = Viaje.query.filter_by(cliente_id=cliente_id).order_by(Viaje.fecha_creacion.desc()).all()
    
    resultado = []
    for v in viajes:
        # Buscar el hash del ticket QR si existe
        qr = TicketQR.query.filter_by(viaje_id=v.id).first()
        resultado.append({
            "viaje_id": v.id,
            "origen": v.dir_origen,
            "destino": v.dir_destino,
            "monto": float(v.monto_total),
            "tipo_servicio": v.tipo_servicio,
            "estado_pago": v.estado_pago,
            "estado_logistico": v.estado_logistico,
            "fecha": v.fecha_creacion.strftime("%Y-%m-%d %H:%M"),
            "fecha_limite_pago": v.fecha_limite_pago.isoformat() if v.fecha_limite_pago else None,
            "qr_hash": qr.codigo_hash if qr else None,
            "nombre_chofer": Usuario.query.get(v.chofer_id).nombre if v.chofer_id else None
        })
    return jsonify(resultado), 200

# Endpoint para que el cliente obtenga el ID del admin con quien debe chatear
@app.route('/api/chat/admin-info', methods=['GET'])
@jwt_required()
def get_admin_info():
    # Retorna el primer admin registrado (el principal)
    admin = Usuario.query.filter_by(rol='admin').order_by(Usuario.id.asc()).first()
    if not admin:
        return jsonify({"error": "No hay administrador configurado"}), 404
    return jsonify({"admin_id": admin.id, "admin_nombre": admin.nombre}), 200

# 10. Chat Endpoints
@app.route('/api/chat/history/<int:otro_id>', methods=['GET'])
@jwt_required()
def get_chat_history(otro_id):
    from sqlalchemy import or_
    
    current_user_id = int(get_jwt_identity())
    otro_id_int = int(otro_id)
    
    # Determinar quién es el cliente en esta conversación
    current_user = Usuario.query.get(current_user_id)
    
    if current_user and current_user.rol == 'cliente':
        # El usuario actual es el cliente — cargamos TODOS sus mensajes de viajes
        # sin importar cuál admin los envió
        client_id = current_user_id
    else:
        # El usuario actual es admin — otro_id es el cliente
        client_id = otro_id_int
    
    print(f"[HISTORY] current={current_user_id} rol={current_user.rol if current_user else '?'} client_id={client_id}")
    
    # 1. Obtener todos los viaje_ids del cliente
    viajes_ids = [v.id for v in Viaje.query.filter_by(cliente_id=client_id).all()]
    print(f"[HISTORY] viajes del cliente: {viajes_ids}")
    
    # 2. Mensajes de sus viajes (TODOS, sin importar remitente/destinatario)
    mensajes_viaje = []
    if viajes_ids:
        mensajes_viaje = MensajeChat.query.filter(
            MensajeChat.viaje_id.in_(viajes_ids)
        ).all()
    
    # 3. Mensajes directos sin viaje entre los dos usuarios
    mensajes_directos = MensajeChat.query.filter(
        MensajeChat.viaje_id == None,
        or_(
            db.and_(MensajeChat.remitente_id == client_id, MensajeChat.destinatario_id == otro_id_int),
            db.and_(MensajeChat.remitente_id == otro_id_int, MensajeChat.destinatario_id == client_id)
        )
    ).all()
    
    # 4. Combinar, deduplicar y ordenar
    ids_vistos = set()
    todos_mensajes = []
    for m in mensajes_viaje + mensajes_directos:
        if m.id not in ids_vistos:
            ids_vistos.add(m.id)
            todos_mensajes.append(m)
    todos_mensajes.sort(key=lambda m: m.timestamp)
    
    print(f"[HISTORY] Total mensajes encontrados: {len(todos_mensajes)}")
    
    resultado = []
    for m in todos_mensajes:
        viaje = Viaje.query.get(m.viaje_id) if m.viaje_id else None
        resultado.append({
            'id': m.id,
            'viaje_id': m.viaje_id,
            'remitente_id': m.remitente_id,
            'destinatario_id': m.destinatario_id,
            'contenido': m.contenido,
            'leido': m.leido,
            'timestamp': m.timestamp.strftime("%Y-%m-%d %H:%M:%S"),
            'viaje_info': {
                'id': viaje.id,
                'estado': viaje.estado_pago
            } if viaje else None
        })
    return jsonify(resultado), 200

@app.route('/api/chat/mark_read/<int:otro_id>', methods=['POST'])
@jwt_required()
def mark_chat_read(otro_id):
    current_user_id = int(get_jwt_identity())
    otro_id_int = int(otro_id)
    
    # Marcar mensajes directos como leídos (remitente=otro, destinatario=yo)
    mensajes_directos = MensajeChat.query.filter(
        MensajeChat.remitente_id == otro_id_int,
        MensajeChat.destinatario_id == current_user_id,
        MensajeChat.leido == False
    ).all()
    
    # Marcar mensajes del viaje como leídos (fetch IDs primero, luego update sin join)
    viajes_del_cliente = [v.id for v in Viaje.query.filter_by(cliente_id=otro_id_int).all()]
    mensajes_viaje = []
    if viajes_del_cliente:
        mensajes_viaje = MensajeChat.query.filter(
            MensajeChat.viaje_id.in_(viajes_del_cliente),
            MensajeChat.remitente_id == otro_id_int,
            MensajeChat.leido == False
        ).all()
    
    for m in mensajes_directos + mensajes_viaje:
        m.leido = True
    
    db.session.commit()
    return jsonify({"mensaje": "Mensajes marcados como leídos"}), 200


# --- Tareas Programadas ---
@scheduler.task('interval', id='check_expired_trips', minutes=1, misfire_grace_time=900)
def check_expired_trips():
    with app.app_context():
        ahora = datetime.utcnow()
        # Buscar viajes pendientes que superaron la fecha límite
        expirados = Viaje.query.filter(
            Viaje.estado_pago == 'pendiente',
            Viaje.fecha_limite_pago < ahora
        ).all()
        
        for v in expirados:
            v.estado_pago = 'cancelado'
            v.estado_logistico = 'cancelado'
            print(f"Viaje {v.id} cancelado por tiempo límite excedido.")
        
        if expirados:
            db.session.commit()

@app.route('/api/viajes/cancelar/<int:viaje_id>', methods=['POST'])
@jwt_required()
def cancelar_viaje(viaje_id):
    cliente_id = get_jwt_identity()
    viaje = Viaje.query.get(viaje_id)
    
    if not viaje:
        return jsonify({"error": "Viaje no encontrado"}), 404
        
    if str(viaje.cliente_id) != str(cliente_id):
        return jsonify({"error": "No autorizado"}), 403
        
    if viaje.estado_pago not in ['pendiente', 'rechazado']:
        return jsonify({"error": "Solo se pueden cancelar viajes pendientes o rechazados"}), 400
        
    viaje.estado_pago = 'cancelado'
    viaje.estado_logistico = 'cancelado'
    db.session.commit()
    
    # Emitir evento vía socket
    socketio.emit('viaje_cancelado', {'viaje_id': viaje_id}, room=f"cliente_{cliente_id}")
    
    return jsonify({"mensaje": "Reserva cancelada exitosamente"}), 200

if __name__ == '__main__':
    socketio.run(app, debug=True, port=5001, allow_unsafe_werkzeug=True)