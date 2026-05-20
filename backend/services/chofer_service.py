from repositories import ViajeRepository, UsuarioRepository, VehiculoRepository
from database import db

class ChoferService:
    def __init__(self):
        self.viaje_repo = ViajeRepository()
        self.usuario_repo = UsuarioRepository()
        self.vehiculo_repo = VehiculoRepository()

    def get_vehiculo(self, chofer_id):
        v = self.vehiculo_repo.get_by_chofer_id(chofer_id)
        if not v:
            return None, 200 # No tiene vehículo registrado aún
        
        return {
            "id": v.id,
            "placa": v.placa,
            "marca": v.marca,
            "modelo": v.modelo,
            "anio": v.anio,
            "tipo_vehiculo": v.tipo_vehiculo,
            "capacidad_max": v.capacidad_max,
            "color": v.color,
            "estado": v.estado,
            "foto_auto_url": v.foto_auto_url,
            "foto_matricula_url": v.foto_matricula_url,
            "foto_licencia_url": v.foto_licencia_url,
            "licencia_tipo": v.licencia_tipo,
            "licencia_vigencia": v.licencia_vigencia
        }, 200

    def update_vehiculo(self, chofer_id, data):
        try:
            v = self.vehiculo_repo.get_by_chofer_id(chofer_id)
            
            # Si no existe, crear uno nuevo
            if not v:
                from database import Vehiculo
                v = Vehiculo(chofer_id=chofer_id)
                db.session.add(v)
            
            # Lógica de permisos por estado
            if v.estado == 'activo':
                # Solo permitir modelo, marca, año, capacidad y color (los documentos e identificación quedan bloqueados)
                if 'marca' in data: v.marca = data['marca']
                if 'modelo' in data: v.modelo = data['modelo']
                if 'anio' in data: v.anio = int(data['anio']) if data.get('anio') else None
                if 'capacidad_max' in data: v.capacidad_max = int(data['capacidad_max']) if data.get('capacidad_max') else 0
                if 'color' in data: v.color = data['color']
            else:
                # En pendiente o rechazado permite todo
                if 'placa' in data: v.placa = data['placa']
                if 'marca' in data: v.marca = data['marca']
                if 'modelo' in data: v.modelo = data['modelo']
                if 'anio' in data: v.anio = int(data['anio']) if data.get('anio') else None
                if 'tipo_vehiculo' in data: v.tipo_vehiculo = data['tipo_vehiculo']
                if 'capacidad_max' in data: v.capacidad_max = int(data['capacidad_max']) if data.get('capacidad_max') else 0
                if 'color' in data: v.color = data['color']
                
                # Campos de licencia y fotos solo modificables antes de la aprobación activa
                if 'licencia_tipo' in data: v.licencia_tipo = data['licencia_tipo']
                if 'licencia_vigencia' in data: v.licencia_vigencia = data['licencia_vigencia']
                if 'foto_auto_url' in data: v.foto_auto_url = data['foto_auto_url']
                if 'foto_matricula_url' in data: v.foto_matricula_url = data['foto_matricula_url']
                if 'foto_licencia_url' in data: v.foto_licencia_url = data['foto_licencia_url']
            
            # Si se edita algo y estaba rechazado, vuelve a pendiente
            if v.estado == 'rechazado':
                v.estado = 'pendiente'
                
            db.session.commit()
            return {"message": "Vehículo actualizado correctamente", "estado": v.estado}, 200
        except Exception as e:
            db.session.rollback()
            print(f"DEBUG: Error actualizando vehículo: {str(e)}")
            return {"error": f"Error en el servidor: {str(e)}"}, 500

    def get_viajes_chofer(self, chofer_id):
        # ... (rest of the file remains same)
        viajes = self.viaje_repo.get_by_chofer_id(chofer_id)
        resultado = []
        for v in viajes:
            cliente = self.usuario_repo.get_by_id(v.cliente_id)
            resultado.append({
                "id": v.id,
                "cliente": cliente.nombre,
                "origen": v.dir_origen,
                "destino": v.dir_destino,
                "distancia_km": float(v.distancia_km),
                "monto": float(v.monto_total),
                "estado_logistico": v.estado_logistico,
                "tipo_servicio": v.tipo_servicio,
                "fecha": v.fecha_creacion.strftime("%Y-%m-%d %H:%M")
            })
        return resultado, 200

    def get_viajes_disponibles(self):
        viajes = self.viaje_repo.get_pendientes_para_choferes()
        resultado = []
        for v in viajes:
            resultado.append({
                "id": v.id,
                "origen": v.dir_origen,
                "destino": v.dir_destino,
                "distancia_km": float(v.distancia_km),
                "tarifa": float(v.monto_total),
                "tipo_servicio": v.tipo_servicio,
                "fecha": v.fecha_creacion.strftime("%Y-%m-%d %H:%M")
            })
        return resultado, 200
