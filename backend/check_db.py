import os
from app import app
from models import db, Viaje, Pago

with app.app_context():
    viajes = Viaje.query.all()
    print("Viajes:")
    for v in viajes:
        print(f"ID: {v.id}, Estado Pago: {v.estado_pago}, Cliente: {v.cliente_id}")
    
    pagos = Pago.query.all()
    print("\nPagos:")
    for p in pagos:
        print(f"ID: {p.id}, Viaje ID: {p.viaje_id}, URL: {p.comprobante_url}")
