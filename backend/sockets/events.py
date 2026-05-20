from flask import request
from flask_socketio import emit, join_room
from database import db, Viaje, MensajeChat, Usuario

def register_socket_events(socketio):
    @socketio.on('connect')
    def handle_connect():
        print("Nuevo cliente conectado a WebSocket")
        emit('server_message', {'data': 'Conexión WebSocket exitosa con Flask'})

    @socketio.on('disconnect')
    def handle_disconnect():
        print("Cliente desconectado de WebSocket")

    @socketio.on('join')
    def on_join(data):
        role = data.get('role', '').lower()
        user_id = data.get('user_id')
        
        print(f"[JOIN] role={role} user_id={user_id} sid={request.sid}")
        
        if role == 'admin':
            join_room('admins')
            print(f"   -> Usuario {user_id} unido a sala 'admins'")
        elif role == 'cliente' and user_id:
            room = f"cliente_{user_id}"
            join_room(room)
            print(f"   -> Usuario {user_id} unido a sala '{room}'")
        elif role == 'chofer':
            join_room('choferes')
            if user_id:
                room = f"chofer_{user_id}"
                join_room(room)
                print(f"   -> Chofer {user_id} unido a sala '{room}'")
            viajes_pendientes = Viaje.query.filter_by(estado_logistico='buscando_chofer').all()
            for v in viajes_pendientes:
                emit('nuevo_viaje_disponible', {
                    'viaje_id': v.id,
                    'cliente_id': v.cliente_id,
                    'nombre_cliente': Usuario.query.get(v.cliente_id).nombre,
                    'origen': v.dir_origen,
                    'destino': v.dir_destino,
                    'tarifa': float(v.monto_total),
                    'tipo_servicio': v.tipo_servicio
                }, room=request.sid)



    @socketio.on('enviar_mensaje')
    def on_enviar_mensaje(data):
        viaje_id = data.get('viaje_id')
        remitente_id = data.get('remitente_id')
        destinatario_id = data.get('destinatario_id')
        tipo_receptor = data.get('tipo_receptor', 'admin') # 'admin' o 'chofer'
        contenido = data.get('contenido')
        
        if not contenido or not remitente_id:
            return
        
        nuevo_mensaje = MensajeChat(
            viaje_id=viaje_id,
            remitente_id=remitente_id,
            destinatario_id=destinatario_id,
            tipo_receptor=tipo_receptor,
            contenido=contenido
        )
        db.session.add(nuevo_mensaje)
        db.session.commit()
        
        mensaje_dict = {
            'id': nuevo_mensaje.id,
            'viaje_id': viaje_id,
            'remitente_id': remitente_id,
            'destinatario_id': destinatario_id,
            'tipo_receptor': tipo_receptor,
            'contenido': contenido,
            'timestamp': nuevo_mensaje.timestamp.strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # Lógica de Emisión Mejorada por Canales
        remitente = Usuario.query.get(remitente_id)
        
        if tipo_receptor == 'admin':
            # Canal de Soporte
            if remitente and remitente.rol == 'admin':
                # El admin responde -> enviar al cliente específico y a otros admins
                if destinatario_id:
                    emit('nuevo_mensaje', mensaje_dict, room=f"cliente_{destinatario_id}")
                emit('nuevo_mensaje', mensaje_dict, room='admins', include_self=True)
            else:
                # El cliente escribe -> enviar a todos los admins y de vuelta al cliente
                emit('nuevo_mensaje', mensaje_dict, room='admins')
                emit('nuevo_mensaje', mensaje_dict, room=f"cliente_{remitente_id}")
        
        elif tipo_receptor == 'chofer':
            # Canal de Viaje (Cliente <-> Chofer)
            if viaje_id:
                viaje = Viaje.query.get(viaje_id)
                if viaje:
                    # Enviar a ambos para que sus UIs se actualicen
                    emit('nuevo_mensaje', mensaje_dict, room=f"cliente_{viaje.cliente_id}")
                    if viaje.chofer_id:
                        emit('nuevo_mensaje', mensaje_dict, room=f"chofer_{viaje.chofer_id}")
            elif destinatario_id:
                # Fallback chat directo
                emit('nuevo_mensaje', mensaje_dict, room=f"cliente_{destinatario_id}")
                emit('nuevo_mensaje', mensaje_dict, room=f"chofer_{destinatario_id}")
                emit('nuevo_mensaje', mensaje_dict, room=f"cliente_{remitente_id}")
                emit('nuevo_mensaje', mensaje_dict, room=f"chofer_{remitente_id}")

    @socketio.on('aceptar_viaje')
    def handle_aceptar_viaje(data):
        viaje_id = data.get('viaje_id')
        chofer_id = data.get('chofer_id')
        
        viaje = Viaje.query.get(viaje_id)
        if not viaje:
            return
        
        if viaje.chofer_id is None:
            viaje.chofer_id = chofer_id
            viaje.estado_logistico = 'aceptado'
            db.session.commit()
            
            emit('viaje_confirmado_chofer', {'viaje_id': viaje_id, 'mensaje': '¡Viaje asignado con éxito!'}, room=request.sid)
            
            room_cliente = f"cliente_{viaje.cliente_id}"
            emit('chofer_asignado', {
                'viaje_id': viaje_id, 
                'chofer_id': chofer_id,
                'nombre_chofer': Usuario.query.get(chofer_id).nombre,
                'estado': 'aceptado'
            }, room=room_cliente)
            
            emit('viaje_actualizado_admin', {'viaje_id': viaje_id, 'estado': 'aceptado'}, room='admins')
        else:
            emit('viaje_ya_tomado', {'mensaje': 'Lo sentimos, este viaje ya fue aceptado por otro chofer.'}, room=request.sid)

    @socketio.on('actualizar_ubicacion_chofer')
    def handle_actualizar_ubicacion(data):
        viaje_id = data.get('viaje_id')
        lat = data.get('lat')
        lng = data.get('lng')
        
        viaje = Viaje.query.get(viaje_id)
        if viaje:
            room_cliente = f"cliente_{viaje.cliente_id}"
            emit('ubicacion_chofer_actualizada', {'lat': lat, 'lng': lng}, room=room_cliente)

    @socketio.on('llegada_origen')
    def handle_llegada_origen(data):
        viaje_id = data.get('viaje_id')
        viaje = Viaje.query.get(viaje_id)
        if viaje:
            viaje.estado_logistico = 'esperando_cliente'
            db.session.commit()
            
            room_cliente = f"cliente_{viaje.cliente_id}"
            emit('chofer_en_punto', {'viaje_id': viaje_id, 'mensaje': 'El chofer ha llegado al punto de inicio'}, room=room_cliente)
            emit('viaje_actualizado_admin', {'viaje_id': viaje_id, 'estado': 'esperando_cliente'}, room='admins')

    @socketio.on('finalizar_viaje')
    def handle_finalizar_viaje(data):
        viaje_id = data.get('viaje_id')
        viaje = Viaje.query.get(viaje_id)
        if viaje:
            viaje.estado_logistico = 'finalizado'
            db.session.commit()
            
            room_cliente = f"cliente_{viaje.cliente_id}"
            emit('viaje_finalizado', {'viaje_id': viaje_id}, room=room_cliente)
            
            emit('viaje_actualizado_admin', {'viaje_id': viaje_id, 'estado': 'finalizado'}, room='admins')

    @socketio.on('cancelar_viaje')
    def handle_cancelar_viaje(data):
        viaje_id = data.get('viaje_id')
        motivo = data.get('motivo', 'Cancelado por el chofer')
        viaje = Viaje.query.get(viaje_id)
        if viaje:
            # En lugar de cancelar todo el viaje, liberamos el chofer y lo regresamos a 'buscando_chofer'
            viaje.chofer_id = None
            viaje.vehiculo_id = None
            viaje.estado_logistico = 'buscando_chofer'
            db.session.commit()
            
            # Emitir al cliente que se está buscando otro chofer
            room_cliente = f"cliente_{viaje.cliente_id}"
            socketio.emit('buscando_nuevo_chofer', {
                'viaje_id': viaje_id, 
                'mensaje': 'El chofer asignado canceló el viaje. Estamos buscando otro conductor de inmediato...'
            }, room=room_cliente)
            
            # Notificar a todos los choferes en tiempo real que hay un viaje disponible
            cliente_usuario = Usuario.query.get(viaje.cliente_id)
            socketio.emit('nuevo_viaje_disponible', {
                'viaje_id': viaje.id,
                'cliente_id': viaje.cliente_id,
                'nombre_cliente': cliente_usuario.nombre if cliente_usuario else 'Cliente VIP',
                'origen': viaje.dir_origen,
                'destino': viaje.dir_destino,
                'tarifa': float(viaje.monto_total),
                'tipo_servicio': viaje.tipo_servicio
            }, room='choferes')
            
            # Emitir viaje_actualizado globalmente para refrescar vistas reactivamente
            socketio.emit('viaje_actualizado', {
                'viaje_id': viaje_id,
                'estado': 'buscando_chofer'
            })
            
            socketio.emit('viaje_actualizado_admin', {'viaje_id': viaje_id, 'estado': 'buscando_chofer'}, room='admins')

