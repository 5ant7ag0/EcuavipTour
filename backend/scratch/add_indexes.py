from database import db
from app import app

with app.app_context():
    print("Aplicando índices a la tabla mensajechat...")
    try:
        db.session.execute(db.text("CREATE INDEX IF NOT EXISTS idx_mensaje_receptor_remitente ON mensajechat (tipo_receptor, remitente_id)"))
        db.session.execute(db.text("CREATE INDEX IF NOT EXISTS idx_mensaje_receptor_destinatario ON mensajechat (tipo_receptor, destinatario_id)"))
        db.session.execute(db.text("CREATE INDEX IF NOT EXISTS idx_mensaje_viaje ON mensajechat (viaje_id)"))
        db.session.commit()
        print("¡Índices creados con éxito!")
    except Exception as e:
        print(f"Error al crear índices: {e}")
        db.session.rollback()
