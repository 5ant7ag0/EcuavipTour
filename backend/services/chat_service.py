from repositories import MensajeRepository, ViajeRepository, UsuarioRepository
from database import db, Viaje, MensajeChat, Usuario
from sqlalchemy import or_, and_, case, func

class ChatService:
    def __init__(self):
        self.mensaje_repo = MensajeRepository()
        self.viaje_repo = ViajeRepository()
        self.usuario_repo = UsuarioRepository()

    def get_inbox_admin(self):
        # Determinamos quién es el cliente en la conversación para agrupar correctamente
        cliente_expr = case(
            (Usuario.rol != 'admin', MensajeChat.remitente_id),
            else_=MensajeChat.destinatario_id
        )

        # Subquery para encontrar la última fecha de mensaje por cada cliente
        subquery = db.session.query(
            func.max(MensajeChat.timestamp).label('max_fecha'),
            cliente_expr.label('cliente_id_sub')
        ).join(Usuario, MensajeChat.remitente_id == Usuario.id)\
         .filter(MensajeChat.tipo_receptor == 'admin')\
         .group_by('cliente_id_sub').subquery()

        # Obtenemos los mensajes que coinciden con esas fechas máximas
        mensajes = db.session.query(MensajeChat).join(Usuario, MensajeChat.remitente_id == Usuario.id).join(
            subquery,
            and_(
                cliente_expr == subquery.c.cliente_id_sub,
                MensajeChat.timestamp == subquery.c.max_fecha
            )
        ).filter(MensajeChat.tipo_receptor == 'admin').order_by(MensajeChat.timestamp.desc()).all()

        resultado = []
        vistos = set()
        for msj in mensajes:
            # Determinar quién es el cliente en esta conversación
            remitente = Usuario.query.get(msj.remitente_id)
            if not remitente: continue
            
            cliente_id = msj.remitente_id if remitente.rol != 'admin' else msj.destinatario_id
            if not cliente_id or cliente_id in vistos: continue
            vistos.add(cliente_id)
            
            cliente = Usuario.query.get(cliente_id)
            if not cliente: continue

            # Conteo de no leídos
            unread = MensajeChat.query.filter(
                MensajeChat.tipo_receptor == 'admin',
                MensajeChat.remitente_id == cliente_id,
                MensajeChat.leido == False
            ).count()
            
            ultimo_viaje = Viaje.query.filter_by(cliente_id=cliente_id).order_by(Viaje.fecha_creacion.desc()).first()
            
            resultado.append({
                "cliente_id": cliente.id,
                "cliente_nombre": cliente.nombre,
                "ultimo_mensaje": msj.contenido,
                "fecha_ultimo_mensaje": msj.timestamp.strftime("%Y-%m-%d %H:%M"),
                "unread": unread,
                "viaje_id": msj.viaje_id, # Puede ser null
                "estado_pago": ultimo_viaje.estado_pago if ultimo_viaje else 'n/a'
            })
            
        return resultado, 200

    def get_chat_history(self, user_id, target_id, tipo_receptor='admin', viaje_id=None):
        # We find the messages between these two users or for this trip
        if tipo_receptor == 'chofer':
            # Trip messages are specific to the trip
            mensajes = MensajeChat.query.filter_by(
                viaje_id=viaje_id,
                tipo_receptor='chofer'
            ).order_by(MensajeChat.timestamp.asc()).all()
        else:
            # Admin messages are for the client's support history
            # If the user is admin, target_id is the client
            # If the user is client, target_id is the admin (but we show all support messages for that client)
            
            # Check if user_id is admin or client
            user = self.usuario_repo.get_by_id(user_id)
            cliente_id = target_id if user and user.rol == 'admin' else user_id

            mensajes = MensajeChat.query.filter(
                MensajeChat.tipo_receptor == 'admin',
                or_(
                    MensajeChat.remitente_id == cliente_id,
                    MensajeChat.destinatario_id == cliente_id
                )
            ).order_by(MensajeChat.timestamp.asc()).all()
            
            # Mark as read
            for m in mensajes:
                if m.remitente_id != user_id and not m.leido:
                    m.leido = True
            db.session.commit()
        
        resultado = []
        for m in mensajes:
            resultado.append({
                "id": m.id,
                "viaje_id": m.viaje_id,
                "remitente_id": m.remitente_id,
                "destinatario_id": m.destinatario_id,
                "tipo_receptor": m.tipo_receptor,
                "contenido": m.contenido,
                "timestamp": m.timestamp.strftime("%Y-%m-%d %H:%M:%S")
            })
            
        return resultado, 200
