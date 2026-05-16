from flask import Blueprint, request, jsonify
from services import AuthService

from flask_jwt_extended import jwt_required, get_jwt_identity
import os
from werkzeug.utils import secure_filename

auth_bp = Blueprint('auth_bp', __name__)
auth_service = AuthService()

@auth_bp.route('/register', methods=['POST'])
def register():
    resultado, status_code = auth_service.register(request.json)
    return jsonify(resultado), status_code

@auth_bp.route('/login', methods=['POST'])
def login():
    resultado, status_code = auth_service.login(request.json)
    return jsonify(resultado), status_code

@auth_bp.route('/update-profile', methods=['POST'])
@jwt_required()
def update_profile():
    usuario_id = get_jwt_identity()
    resultado, status_code = auth_service.update_profile(usuario_id, request.json)
    return jsonify(resultado), status_code

@auth_bp.route('/upload-avatar', methods=['POST'])
@jwt_required()
def upload_avatar():
    usuario_id = get_jwt_identity()
    if 'foto' not in request.files:
        return jsonify({"error": "No hay archivo"}), 400
    
    file = request.files['foto']
    if file.filename == '':
        return jsonify({"error": "Nombre de archivo vacío"}), 400
    
    if file:
        filename = secure_filename(f"user_{usuario_id}_avatar_{file.filename}")
        upload_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../uploads/avatars')
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        avatar_url = f"uploads/avatars/{filename}"
        resultado, status_code = auth_service.update_profile(usuario_id, {"foto_perfil_url": avatar_url})
        return jsonify(resultado), status_code
    
    return jsonify({"error": "Error desconocido"}), 500
