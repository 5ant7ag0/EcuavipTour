from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services import ChatService

chat_bp = Blueprint('chat_bp', __name__)
chat_service = ChatService()

@chat_bp.route('/history/<int:target_id>', methods=['GET'])
@jwt_required()
def get_history(target_id):
    user_id = int(get_jwt_identity())
    tipo_receptor = request.args.get('tipo_receptor', 'admin')
    viaje_id = request.args.get('viaje_id')
    if viaje_id:
        viaje_id = int(viaje_id)
        
    resultado, status_code = chat_service.get_chat_history(
        user_id=user_id, 
        target_id=target_id, 
        tipo_receptor=tipo_receptor,
        viaje_id=viaje_id
    )
    return jsonify(resultado), status_code

@chat_bp.route('/admin-info', methods=['GET'])
@jwt_required()
def get_admin_info():
    # Helper for frontend to know who the default support contact is
    # In a real app this might be load balanced, but here we return a placeholder or first admin
    from database import Usuario
    admin = Usuario.query.filter_by(rol='admin').first()
    if admin:
        return jsonify({"admin_id": admin.id, "admin_nombre": admin.nombre}), 200
    return jsonify({"admin_id": 1, "admin_nombre": "Soporte Ecuavip"}), 200
