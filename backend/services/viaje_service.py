from datetime import datetime, timedelta
from repositories import ViajeRepository

class ViajeService:
    def __init__(self):
        self.viaje_repo = ViajeRepository()

    def cotizar(self, datos):
        if not datos:
            return {"error": "No hay datos"}, 400
        
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
            return {
                "precio_total": round(precio_total, 2),
                "precio_unitario": round(precio_total, 2),
                "zona": "Express 24H (Tababela)"
            }, 200

        elif tipo_servicio == 'encomienda':
            precio_unitario = precio_zona * 0.70
            precio_total = precio_unitario
            return {
                "precio_total": round(precio_total, 2),
                "precio_unitario": round(precio_unitario, 2),
                "zona": zona,
                "mensaje": "Peso máximo permitido de maleta: 25Kg"
            }, 200
            
        elif tipo_servicio == 'pasajero':
            precio_total = precio_zona * num_pasajeros
            return {
                "precio_total": round(precio_total, 2),
                "precio_unitario": round(precio_zona, 2),
                "zona": zona
            }, 200

        return {"error": "Tipo de servicio inválido"}, 400

    def reservar(self, datos, cliente_id):
        chofer_id = datos.get('chofer_id')
        fecha_viaje_str = datos.get('fecha_viaje')
        duracion_minutos = int(datos.get('duracion_minutos', 30))
        
        fecha_viaje = None
        if fecha_viaje_str:
            try:
                fecha_viaje = datetime.strptime(fecha_viaje_str, "%Y-%m-%d %H:%M")
            except Exception:
                try:
                    fecha_viaje = datetime.fromisoformat(fecha_viaje_str)
                except Exception:
                    pass

        # 1. Validation of driver schedule conflict
        if chofer_id and fecha_viaje:
            chofer_id = int(chofer_id)
            from database import Viaje
            proposed_start = fecha_viaje
            proposed_end = proposed_start + timedelta(minutes=duracion_minutos)
            
            active_viajes = Viaje.query.filter(
                Viaje.chofer_id == chofer_id,
                Viaje.fecha_viaje.isnot(None),
                ~Viaje.estado_logistico.in_(['finalizado', 'cancelado'])
            ).all()
            
            has_conflict = False
            for v in active_viajes:
                v_start = v.fecha_viaje
                v_dur = v.duracion_minutos or 30
                v_end = v_start + timedelta(minutes=v_dur)
                
                # Check overlap: start1 < end2 and start2 < end1
                if v_start < proposed_end and proposed_start < v_end:
                    has_conflict = True
                    break
            
            if has_conflict:
                return {
                    "error": "El conductor seleccionado ya tiene un viaje programado, activo o en ruta que coincide o se cruza con ese horario. Por favor, seleccione otro conductor."
                }, 409

        estado_pago = datos.get('estado_pago', 'pendiente')
        vehiculo_id = None
        
        if chofer_id:
            chofer_id = int(chofer_id)
            from database import Vehiculo
            # Buscar el vehículo activo del chofer asignado
            veh = Vehiculo.query.filter_by(chofer_id=chofer_id, estado='activo').first()
            if veh:
                vehiculo_id = veh.id
            estado_logistico = 'aceptado'
        else:
            if estado_pago == 'aprobado':
                estado_logistico = 'buscando_chofer'
            else:
                estado_logistico = 'pendiente'

        nuevo_viaje = self.viaje_repo.create(
            cliente_id=cliente_id,
            chofer_id=chofer_id,
            vehiculo_id=vehiculo_id,
            dir_origen=datos.get('origen'),
            lat_origen=0.0, 
            lng_origen=0.0,
            dir_destino=datos.get('destino'),
            lat_destino=0.0,
            lng_destino=0.0,
            distancia_km=datos.get('distancia_km', 0),
            monto_total=datos.get('tarifa'),
            tipo_servicio=datos.get('tipo_servicio'),
            tipo_modalidad='compartido' if datos.get('tipo_servicio') == 'pasajero' else 'privado_express',
            estado_pago=estado_pago,
            estado_logistico=estado_logistico,
            fecha_limite_pago=datetime.utcnow() + timedelta(minutes=15),
            fecha_viaje=fecha_viaje,
            duracion_minutos=duracion_minutos
        )

        if estado_pago == 'aprobado':
            from database import TicketQR, db
            import uuid
            ticket_existente = TicketQR.query.filter_by(viaje_id=nuevo_viaje.id).first()
            if not ticket_existente:
                nuevo_ticket = TicketQR(
                    viaje_id=nuevo_viaje.id,
                    codigo_hash=str(uuid.uuid4()),
                    estado='generado'
                )
                db.session.add(nuevo_ticket)
                db.session.commit()
        
        # 3. Sockets Notifications in Real Time
        try:
            from app import socketio
            
            # Notification to Client
            room_cliente = f"cliente_{cliente_id}"
            chofer_nombre = ""
            vehiculo_placa = ""
            vehiculo_marca = ""
            vehiculo_modelo = ""
            
            if chofer_id:
                from database import Usuario
                chof = Usuario.query.get(chofer_id)
                if chof:
                    chofer_nombre = chof.nombre
                if vehiculo_id:
                    from database import Vehiculo
                    veh = Vehiculo.query.get(vehiculo_id)
                    if veh:
                        vehiculo_placa = veh.placa
                        vehiculo_marca = veh.marca
                        vehiculo_modelo = veh.modelo
            
            socketio.emit('viaje_despachado_cliente', {
                'viaje_id': nuevo_viaje.id,
                'estado': estado_logistico,
                'chofer_id': chofer_id,
                'chofer_nombre': chofer_nombre,
                'vehiculo_placa': vehiculo_placa,
                'vehiculo_marca': vehiculo_marca,
                'vehiculo_modelo': vehiculo_modelo,
                'mensaje': "¡Tu viaje ha sido despachado!"
            }, room=room_cliente)
            
            # Notification to Driver
            if chofer_id:
                room_chofer = f"chofer_{chofer_id}"
                socketio.emit('nuevo_viaje_chofer', {
                    'viaje_id': nuevo_viaje.id,
                    'origen': nuevo_viaje.dir_origen,
                    'destino': nuevo_viaje.dir_destino,
                    'mensaje': "Nuevo viaje manual asignado por administración"
                }, room=room_chofer)
            
            # Broadcast to Fleet Monitor (Admin panel)
            socketio.emit('viaje_creado_admin', {
                'viaje_id': nuevo_viaje.id,
                'estado': estado_logistico
            }, room='admins')
            
            # Standard updates for general screens
            socketio.emit('viaje_actualizado', {
                'viaje_id': nuevo_viaje.id,
                'estado': estado_logistico
            })
        except Exception as se:
            print("Error sending socket notifications:", se)
            
        return {"mensaje": "Reserva creada exitosamente", "viaje_id": nuevo_viaje.id}, 201

    def get_viajes_cliente(self, cliente_id):
        from database import TicketQR, Usuario, Vehiculo, Calificacion
        viajes = self.viaje_repo.get_by_cliente_id(cliente_id)
        resultado = []
        for v in viajes:
            qr = TicketQR.query.filter_by(viaje_id=v.id).first()
            
            nombre_chofer = None
            if v.chofer_id:
                chofer = Usuario.query.get(v.chofer_id)
                if chofer:
                    nombre_chofer = chofer.nombre
            
            vehiculo_data = None
            if v.vehiculo_id:
                veh = Vehiculo.query.get(v.vehiculo_id)
                if veh:
                    vehiculo_data = {
                        "placa": veh.placa,
                        "modelo": veh.modelo,
                        "tipo": veh.tipo_vehiculo,
                        "foto_auto_url": veh.foto_auto_url
                    }
            
            calif = Calificacion.query.filter_by(viaje_id=v.id).first()
            calificacion_data = {
                "estrellas": calif.estrellas,
                "comentario": calif.comentario
            } if calif else None
            
            resultado.append({
                "id": v.id,
                "viaje_id": v.id,
                "origen": v.dir_origen,
                "destino": v.dir_destino,
                "distancia_km": float(v.distancia_km) if v.distancia_km else 0,
                "monto": float(v.monto_total) if v.monto_total else 0,
                "estado_pago": v.estado_pago,
                "estado_logistico": v.estado_logistico,
                "tipo_servicio": v.tipo_servicio,
                "fecha": v.fecha_creacion.strftime("%Y-%m-%d %H:%M") if v.fecha_creacion else "Sin fecha",
                "fecha_limite_pago": v.fecha_limite_pago.isoformat() if v.fecha_limite_pago else None,
                "qr_hash": qr.codigo_hash if qr else None,
                "nombre_chofer": nombre_chofer,
                "vehiculo": vehiculo_data,
                "calificacion": calificacion_data
            })
        return resultado, 200

    def get_viaje_activo(self, user_id):
        from database import Viaje, Usuario, TicketQR, Vehiculo, db
        v = Viaje.query.filter(
            db.or_(Viaje.cliente_id == user_id, Viaje.chofer_id == user_id),
            Viaje.estado_logistico.in_(['pendiente', 'buscando_chofer', 'aceptado', 'esperando_cliente', 'en_curso'])
        ).order_by(Viaje.fecha_creacion.desc()).first()

        if not v:
            return None, 200

        chofer_data = None
        if v.chofer_id:
            chofer = Usuario.query.get(v.chofer_id)
            if chofer:
                chofer_data = {"id": chofer.id, "nombre": chofer.nombre, "telefono": chofer.telefono}

        vehiculo_data = None
        if v.vehiculo_id:
            veh = Vehiculo.query.get(v.vehiculo_id)
            if veh:
                vehiculo_data = {
                    "placa": veh.placa,
                    "marca": veh.marca,
                    "modelo": veh.modelo,
                    "anio": veh.anio,
                    "tipo": veh.tipo_vehiculo,
                    "foto_auto_url": veh.foto_auto_url
                }

        cliente = Usuario.query.get(v.cliente_id)
        nombre_cliente = cliente.nombre if cliente else "Cliente Desconocido"
        qr = TicketQR.query.filter_by(viaje_id=v.id).first()

        resultado = {
            "id": v.id,
            "viaje_id": v.id,
            "origen": v.dir_origen,
            "destino": v.dir_destino,
            "distancia": float(v.distancia_km) if v.distancia_km else 0,
            "tarifa": float(v.monto_total) if v.monto_total else 0,
            "estado_pago": v.estado_pago,
            "estado_logistico": v.estado_logistico,
            "tipo_servicio": v.tipo_servicio,
            "chofer": chofer_data,
            "vehiculo": vehiculo_data,
            "nombre_cliente": nombre_cliente,
            "qr_hash": qr.codigo_hash if qr else None
        }
        return resultado, 200

    def validar_abordaje(self, datos):
        from database import Viaje, db
        viaje_id = datos.get('viaje_id')
        codigo = datos.get('codigo')

        viaje = Viaje.query.get(viaje_id)
        if not viaje:
            return {"error": "Viaje no encontrado"}, 404

        # En un sistema real verificaríamos contra el PIN generado
        # Por ahora aceptamos cualquier código de 4 dígitos o validamos contra un campo si existe
        # Asumiremos que el 'pin' es '1234' para pruebas o simplemente lo validamos
        if len(codigo) == 4:
            viaje.estado_logistico = 'en_curso'
            db.session.commit()
            return {"mensaje": "Abordaje verificado correctamente", "estado": "en_curso"}, 200
        else:
            return {"error": "Código de abordaje inválido"}, 400

    def cancelar_viaje_admin(self, datos):
        from database import Viaje, db
        viaje_id = datos.get('viaje_id')
        viaje = Viaje.query.get(viaje_id)
        if not viaje:
            return {"error": "Viaje no encontrado"}, 404
        
        viaje.estado_logistico = 'cancelado'
        viaje.estado_pago = 'cancelado'
        viaje.chofer_id = None
        viaje.vehiculo_id = None
        db.session.commit()
        return {"mensaje": "Viaje cancelado correctamente"}, 200

    def calificar_viaje(self, datos):
        from database import Calificacion, db
        viaje_id = datos.get('viaje_id')
        cliente_id = datos.get('cliente_id')
        estrellas = datos.get('estrellas')
        comentario = datos.get('comentario')
        
        if not viaje_id or not estrellas:
            return {"error": "Faltan datos obligatorios"}, 400
            
        nueva = Calificacion(
            viaje_id=viaje_id,
            cliente_id=cliente_id,
            estrellas=estrellas,
            comentario=comentario
        )
        db.session.add(nueva)
        db.session.commit()
        return {"mensaje": "Calificación enviada correctamente"}, 200


