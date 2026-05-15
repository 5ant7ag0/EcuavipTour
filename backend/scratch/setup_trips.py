from database import db, Usuario, Viaje, Pago, MensajeChat, TicketQR, Calificacion
from app import app
from datetime import datetime

with app.app_context():
    alesso = Usuario.query.filter_by(correo='alesso@gmail.com').first()
    stalyn = Usuario.query.filter_by(correo='stalyn@gmail.com').first()
    
    if not alesso or not stalyn:
        print("Error: No se encontraron los usuarios.")
        exit()
        
    print(f"Alesso ID: {alesso.id}")
    print(f"Stalyn ID: {stalyn.id}")
    
    # Obtener IDs de viajes de Alesso para limpiar cascada manualmente si no está configurada
    viaje_ids = [v.id for v in Viaje.query.filter_by(cliente_id=alesso.id).all()]
    
    if viaje_ids:
        Pago.query.filter(Pago.viaje_id.in_(viaje_ids)).delete(synchronize_session=False)
        MensajeChat.query.filter(MensajeChat.viaje_id.in_(viaje_ids)).delete(synchronize_session=False)
        TicketQR.query.filter(TicketQR.viaje_id.in_(viaje_ids)).delete(synchronize_session=False)
        Calificacion.query.filter(Calificacion.viaje_id.in_(viaje_ids)).delete(synchronize_session=False)
        Viaje.query.filter(Viaje.id.in_(viaje_ids)).delete(synchronize_session=False)
    
    # Crear viaje 1: Finalizado
    v1 = Viaje(
        cliente_id=alesso.id,
        chofer_id=stalyn.id,
        dir_origen="Aeropuerto UIO",
        dir_destino="Hotel Marriott Quito",
        distancia_km=40,
        monto_total=25,
        tipo_servicio="pasajero",
        tipo_modalidad="compartido",
        estado_pago="aprobado",
        estado_logistico="finalizado",
        fecha_creacion=datetime(2026, 5, 10, 10, 0, 0)
    )
    db.session.add(v1)
    
    # Crear viaje 2: En curso
    v2 = Viaje(
        cliente_id=alesso.id,
        chofer_id=stalyn.id,
        dir_origen="Cumbayá, Parque Central",
        dir_destino="Quicentro Norte",
        distancia_km=15,
        monto_total=12,
        tipo_servicio="pasajero",
        tipo_modalidad="privado_express",
        estado_pago="aprobado",
        estado_logistico="en_curso",
        fecha_creacion=datetime.now()
    )
    db.session.add(v2)
    
    db.session.commit()
    print("Base de datos actualizada: Alesso tiene 1 viaje finalizado y 1 en curso con Stalyn.")
