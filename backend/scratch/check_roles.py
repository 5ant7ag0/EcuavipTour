from database import db, Usuario
from app import app

with app.app_context():
    roles = db.session.query(Usuario.rol).distinct().all()
    print("Roles en BD:", [r[0] for r in roles])
