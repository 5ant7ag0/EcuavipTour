from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from services import ViajeService
from database import Viaje

viaje_bp = Blueprint('viaje_bp', __name__)
viaje_service = ViajeService()

@viaje_bp.route('/cotizar', methods=['POST'])
def cotizar():
    resultado, status_code = viaje_service.cotizar(request.json)
    return jsonify(resultado), status_code

@viaje_bp.route('/reservar', methods=['POST'])
@jwt_required()
def reservar_viaje():
    identity = int(get_jwt_identity())
    from database import Usuario
    user = Usuario.query.get(identity)
    cliente_id = identity
    
    # Si es admin y envía un cliente_id en el payload, usamos ese cliente
    if user and user.rol == 'admin' and request.json and 'cliente_id' in request.json:
        cliente_id = int(request.json.get('cliente_id'))
        
    resultado, status_code = viaje_service.reservar(request.json, cliente_id)
    return jsonify(resultado), status_code

@viaje_bp.route('/mis-viajes', methods=['GET'])
@jwt_required()
def mis_viajes():
    cliente_id = int(get_jwt_identity())
    resultado, status_code = viaje_service.get_viajes_cliente(cliente_id)
    return jsonify(resultado), status_code

@viaje_bp.route('/activo', methods=['GET'])
@jwt_required()
def get_activo():
    user_id = int(get_jwt_identity())
    resultado, status_code = viaje_service.get_viaje_activo(user_id)
    return jsonify(resultado), status_code

@viaje_bp.route('/validar_abordaje', methods=['POST'])
@jwt_required()
def validar_abordaje():
    resultado, status_code = viaje_service.validar_abordaje(request.json)
    if status_code == 200:
        # Notificar al cliente via sockets
        from app import socketio
        viaje_id = request.json.get('viaje_id')
        viaje = Viaje.query.get(viaje_id)
        if viaje:
            room_cliente = f"cliente_{viaje.cliente_id}"
            socketio.emit('viaje_actualizado_cliente', {
                'viaje_id': viaje_id,
                'estado': 'en_curso'
            }, room=room_cliente)
            socketio.emit('viaje_actualizado_admin', {
                'viaje_id': viaje_id,
                'estado': 'en_curso'
            }, room='admins')
            
    return jsonify(resultado), status_code
    
@viaje_bp.route('/cancelar', methods=['POST'])
@jwt_required()
def cancelar():
    resultado, status_code = viaje_service.cancelar_viaje_admin(request.json)
    if status_code == 200:
        from app import socketio
        viaje_id = request.json.get('viaje_id')
        viaje = Viaje.query.get(viaje_id)
        if viaje:
            room_cliente = f"cliente_{viaje.cliente_id}"
            socketio.emit('viaje_cancelado', {
                'viaje_id': viaje_id,
                'mensaje': 'El viaje ha sido cancelado.'
            }, room=room_cliente)
            socketio.emit('viaje_actualizado_admin', {
                'viaje_id': viaje_id,
                'estado': 'cancelado'
            }, room='admins')
    return jsonify(resultado), status_code
    
@viaje_bp.route('/calificar', methods=['POST'])
@jwt_required()
def calificar():
    resultado, status_code = viaje_service.calificar_viaje(request.json)
    return jsonify(resultado), status_code


