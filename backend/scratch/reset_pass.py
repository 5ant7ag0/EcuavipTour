from database import db, Usuario
from app import app
from werkzeug.security import generate_password_hash

with app.app_context():
    u = Usuario.query.filter_by(correo='stalyn@gmail.com').first()
    if u:
        u.password_hash = generate_password_hash('123456')
        db.session.commit()
        print("Password reset to 123456")
    else:
        print("User not found")
