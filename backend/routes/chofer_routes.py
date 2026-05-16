from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services import ChoferService
import os
from werkzeug.utils import secure_filename

chofer_bp = Blueprint('chofer_bp', __name__)
chofer_service = ChoferService()

UPLOAD_FOLDER_VEHICULOS = os.path.join(os.path.dirname(os.path.abspath(__file__)), '../uploads/vehiculos')
if not os.path.exists(UPLOAD_FOLDER_VEHICULOS):
    os.makedirs(UPLOAD_FOLDER_VEHICULOS)

@chofer_bp.route('/vehiculo', methods=['GET'])
@jwt_required()
def get_vehiculo():
    chofer_id = int(get_jwt_identity())
    resultado, status_code = chofer_service.get_vehiculo(chofer_id)
    return jsonify(resultado), status_code

@chofer_bp.route('/vehiculo', methods=['POST'])
@jwt_required()
def update_vehiculo():
    chofer_id = int(get_jwt_identity())
    data = request.form.to_dict()
    
    # Manejo de archivos
    for field in ['foto_auto', 'foto_matricula', 'foto_licencia']:
        if field in request.files:
            file = request.files[field]
            if file and file.filename:
                filename = secure_filename(f"chofer_{chofer_id}_{field}_{file.filename}")
                file_path = os.path.join(UPLOAD_FOLDER_VEHICULOS, filename)
                file.save(file_path)
                data[f"{field}_url"] = f"uploads/vehiculos/{filename}"
    
    resultado, status_code = chofer_service.update_vehiculo(chofer_id, data)
    return jsonify(resultado), status_code

@chofer_bp.route('/viajes/disponibles', methods=['GET'])
# ... (rest of the file)
@jwt_required()
def viajes_disponibles():
    resultado, status_code = chofer_service.get_viajes_disponibles()
    return jsonify(resultado), status_code

@chofer_bp.route('/mis-viajes', methods=['GET'])
@jwt_required()
def mis_viajes_chofer():
    chofer_id = int(get_jwt_identity())
    resultado, status_code = chofer_service.get_viajes_chofer(chofer_id)
    return jsonify(resultado), status_code
