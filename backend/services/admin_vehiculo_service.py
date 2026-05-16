from repositories import VehiculoRepository, UsuarioRepository
from database import db

class AdminVehiculoService:
    def __init__(self):
        self.vehiculo_repo = VehiculoRepository()
        self.usuario_repo = UsuarioRepository()

    def get_all_vehiculos(self, estado=None, search=None, marca=None, modelo=None, anio=None, tipo=None, asientos=None):
        query = self.vehiculo_repo.model.query
        
        if estado:
            query = query.filter_by(estado=estado)
        if marca:
            query = query.filter_by(marca=marca)
        if modelo:
            query = query.filter_by(modelo=modelo)
        if anio:
            try:
                # Si es un número exacto, lo buscamos así
                query = query.filter_by(anio=int(anio))
            except:
                # Si no es un número válido (ej. escribió "202"), no filtramos o podríamos hacer un cast a string
                pass
        if tipo:
            query = query.filter(self.vehiculo_repo.model.tipo_vehiculo.ilike(tipo))
        if asientos:
            if asientos == '+7':
                query = query.filter(self.vehiculo_repo.model.capacidad_max > 7)
            else:
                try:
                    query = query.filter_by(capacidad_max=int(asientos))
                except:
                    pass
            
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (self.vehiculo_repo.model.placa.ilike(search_filter)) |
                (self.vehiculo_repo.model.marca.ilike(search_filter)) |
                (self.vehiculo_repo.model.modelo.ilike(search_filter))
            )
        
        vehiculos = query.all()
        resultado = []
        for v in vehiculos:
            chofer = self.usuario_repo.get_by_id(v.chofer_id)
            resultado.append({
                "id": v.id,
                "placa": v.placa,
                "marca": v.marca,
                "modelo": v.modelo,
                "anio": v.anio,
                "color": v.color,
                "tipo_vehiculo": v.tipo_vehiculo,
                "capacidad_max": v.capacidad_max,
                "estado": v.estado,
                "foto_auto_url": v.foto_auto_url,
                "foto_matricula_url": v.foto_matricula_url,
                "foto_licencia_url": v.foto_licencia_url,
                "chofer": {
                    "id": chofer.id if chofer else None,
                    "nombre": chofer.nombre if chofer else "N/A",
                    "correo": chofer.correo if chofer else "N/A",
                    "telefono": chofer.telefono if chofer else "N/A"
                }
            })
        return resultado, 200

    def cambiar_estado(self, vehiculo_id, nuevo_estado):
        v = self.vehiculo_repo.get_by_id(vehiculo_id)
        if not v:
            return {"error": "Vehículo no encontrado"}, 404
        
        v.estado = nuevo_estado
        db.session.commit()
        return {"message": f"Vehículo {nuevo_estado} correctamente"}, 200
