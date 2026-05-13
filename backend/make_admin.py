from app import app
from models import db, Usuario
from werkzeug.security import generate_password_hash

with app.app_context():
    email = 'frixon@gmail.com'
    password = '1234'
    usuario = Usuario.query.filter_by(correo=email).first()
    
    if usuario:
        usuario.rol = 'admin'
        usuario.password_hash = generate_password_hash(password)
        db.session.commit()
        print(f"Usuario {email} actualizado a admin.")
    else:
        nuevo_usuario = Usuario(
            nombre='Frixon',
            correo=email,
            password_hash=generate_password_hash(password),
            telefono='0999999999',
            rol='admin'
        )
        db.session.add(nuevo_usuario)
        db.session.commit()
        print(f"Usuario {email} creado como admin.")
