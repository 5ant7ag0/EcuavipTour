from database import db, Viaje
from app import app

with app.app_context():
    v = Viaje.query.get(29)
    if v:
        v.estado_logistico = 'aceptado'
        db.session.commit()
        print("Trip 29 reset to aceptado")
    else:
        print("Trip 29 not found")
