from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from services import PagoService, ChatService, AdminUserService, AnalyticsService, AdminVehiculoService
import os

admin_bp = Blueprint('admin_bp', __name__)
# The upload folder will be configured when assembling the app
pago_service = PagoService(upload_folder=os.path.join(os.path.dirname(os.path.abspath(__file__)), '../uploads/comprobantes'))
chat_service = ChatService()
user_service = AdminUserService()
analytics_service = AnalyticsService()
vehiculo_service = AdminVehiculoService()

@admin_bp.route('/vehiculos', methods=['GET'])
@jwt_required()
def get_vehiculos():
    estado = request.args.get('estado')
    search = request.args.get('search')
    marca = request.args.get('marca')
    modelo = request.args.get('modelo')
    anio = request.args.get('anio')
    tipo = request.args.get('tipo')
    asientos = request.args.get('asientos')
    
    resultado, status_code = vehiculo_service.get_all_vehiculos(estado, search, marca, modelo, anio, tipo, asientos)
    return jsonify(resultado), status_code

@admin_bp.route('/vehiculos/estado', methods=['POST'])
@jwt_required()
def cambiar_estado_vehiculo():
    vehiculo_id = request.json.get('vehiculo_id')
    nuevo_estado = request.json.get('estado')
    resultado, status_code = vehiculo_service.cambiar_estado(vehiculo_id, nuevo_estado)
    return jsonify(resultado), status_code

@admin_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_admin_stats():
    # Devolvemos un objeto con todas las métricas necesarias para el Dashboard
    period = request.args.get('period', 'month')
    
    kpis, _ = analytics_service.get_kpi_stats()
    revenue_chart, _ = analytics_service.get_revenue_chart(period)
    distribution, _ = analytics_service.get_trip_distribution()
    routes, _ = analytics_service.get_top_routes()
    service_stats, _ = analytics_service.get_service_type_stats()
    movements, _ = analytics_service.get_recent_movements()
    
    return jsonify({
        "kpis": kpis,
        "charts": {
            "revenue": revenue_chart,
            "distribution": distribution,
            "routes": routes,
            "services": service_stats
        },
        "movements": movements
    }), 200

@admin_bp.route('/pagos', methods=['GET'])
@jwt_required()
def get_pagos():
    estado_filtro = request.args.get('estado', 'pendientes')
    resultado, status_code = pago_service.get_pagos_admin(estado_filtro)
    return jsonify(resultado), status_code

@admin_bp.route('/aprobar_pago', methods=['POST'])
@jwt_required()
def aprobar_pago():
    pago_id = request.json.get('pago_id')
    resultado, status_code = pago_service.aprobar_pago(pago_id)
    return jsonify(resultado), status_code

@admin_bp.route('/inbox', methods=['GET'])
@jwt_required()
def get_inbox():
    resultado, status_code = chat_service.get_inbox_admin()
    return jsonify(resultado), status_code

@admin_bp.route('/usuarios', methods=['GET'])
@jwt_required()
def get_usuarios():
    rol = request.args.get('rol')
    search = request.args.get('search')
    activo = request.args.get('activo')
    sort = request.args.get('sort', 'desc')
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')
    resultado, status_code = user_service.get_all_users(rol, search, activo, sort, start_date, end_date)
    return jsonify(resultado), status_code

@admin_bp.route('/usuarios/toggle_status', methods=['POST'])
@jwt_required()
def toggle_usuario_status():
    usuario_id = request.json.get('usuario_id')
    resultado, status_code = user_service.toggle_user_status(usuario_id)
    return jsonify(resultado), status_code

@admin_bp.route('/usuarios/update', methods=['POST'])
@jwt_required()
def update_usuario_admin():
    data = request.json
    usuario_id = data.get('usuario_id')
    resultado, status_code = user_service.update_user_admin(usuario_id, data)
    return jsonify(resultado), status_code

@admin_bp.route('/usuarios/update_photo', methods=['POST'])
@jwt_required()
def update_usuario_photo():
    usuario_id = request.form.get('usuario_id')
    if 'foto' not in request.files:
        return jsonify({"error": "No hay archivo"}), 400
        
    file = request.files['foto']
    if file.filename == '':
        return jsonify({"error": "Nombre de archivo vacío"}), 400
        
    resultado, status_code = user_service.update_user_photo(usuario_id, file)
    return jsonify(resultado), status_code
