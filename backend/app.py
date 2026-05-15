import os
from flask import Flask, jsonify, send_from_directory
from flask_cors import CORS
from dotenv import load_dotenv
from flask_socketio import SocketIO
from flask_jwt_extended import JWTManager
from flask_apscheduler import APScheduler

# 1. Cargar variables de entorno
load_dotenv()

app = Flask(__name__)
CORS(app)

# 1.5 Configuración de SocketIO y JWT
socketio = SocketIO(app, cors_allowed_origins="*")
app.config['JWT_SECRET_KEY'] = os.getenv("JWT_SECRET_KEY", 'ecuavip-super-secret-key-123')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = False # Tokens no expiran para simplificar
jwt = JWTManager(app)

# 1.6 Configuración de APScheduler
class Config:
    SCHEDULER_API_ENABLED = True

app.config.from_object(Config())
scheduler = APScheduler()
scheduler.init_app(app)
scheduler.start()

# 1.6 Configuración de Subidas (Uploads)
UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'uploads/comprobantes')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# 2. Configuración de la Base de Datos desde .env
uri = os.getenv("DATABASE_URL")
if uri and uri.startswith("postgres://"):
    uri = uri.replace("postgres://", "postgresql://", 1)

if not uri:
    raise RuntimeError("No se pudo cargar DATABASE_URL del archivo .env")

app.config['SQLALCHEMY_DATABASE_URI'] = uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_pre_ping': True,
    'pool_recycle': 300
}

# 3. Inicialización de la base de datos
from database import db
db.init_app(app)

# 4. Registrar Sockets
from sockets import register_socket_events
register_socket_events(socketio)

# 5. Registrar Blueprints (Rutas)
from routes import auth_bp, viaje_bp, chofer_bp, admin_bp, pago_bp, chat_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(viaje_bp, url_prefix='/api/viajes')
app.register_blueprint(chofer_bp, url_prefix='/api/chofer')
app.register_blueprint(admin_bp, url_prefix='/api/admin')
app.register_blueprint(pago_bp, url_prefix='/api/pagos')
app.register_blueprint(chat_bp, url_prefix='/api/chat')

# Además, en `app.py` original habían endpoints en la raíz de `/api/` 
# Mapearemos la ruta antigua `/api/cotizar` al nuevo Blueprint aunque el prefijo sea viajes,
# pero como está en viaje_routes.py con `@viaje_bp.route('/cotizar')`, ahora la URL real será `/api/viajes/cotizar`.
# Para mantener compatibilidad con el frontend sin cambiar el frontend ahora mismo, 
# podemos registrar un route suelto aquí o moverlo.
# Dejaré el route suelto para mantener retrocompatibilidad de API estrictamente.

from services import ViajeService
from flask import request
viaje_service = ViajeService()

@app.route('/api/cotizar', methods=['POST'])
def cotizar():
    resultado, status_code = viaje_service.cotizar(request.json)
    return jsonify(resultado), status_code

# Rutas estáticas y de diagnóstico
@app.route('/')
def home():
    return jsonify({"proyecto": "Ecuavip Tour API Refactored", "estado": "online"}), 200

@app.route('/uploads/comprobantes/<filename>')
def uploaded_file(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    socketio.run(app, debug=True, host='0.0.0.0', port=5001, allow_unsafe_werkzeug=True)