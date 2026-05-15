from .auth_routes import auth_bp
from .viaje_routes import viaje_bp
from .chofer_routes import chofer_bp
from .admin_routes import admin_bp
from .pago_routes import pago_bp
from .chat_routes import chat_bp

__all__ = [
    'auth_bp',
    'viaje_bp',
    'chofer_bp',
    'admin_bp',
    'pago_bp',
    'chat_bp'
]
