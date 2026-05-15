from flask import Blueprint, request, jsonify
from services import AuthService

from flask_jwt_extended import jwt_required, get_jwt_identity

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
