from repositories import UsuarioRepository
from database import Viaje, Calificacion, db
from sqlalchemy import func

class AdminUserService:
    def __init__(self):
        self.usuario_repo = UsuarioRepository()

    def get_all_users(self, rol=None, search=None):
        query = self.usuario_repo.model.query
        
        if rol:
            query = query.filter_by(rol=rol)
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (self.usuario_repo.model.nombre.ilike(search_filter)) | 
                (self.usuario_repo.model.correo.ilike(search_filter)) |
                (self.usuario_repo.model.telefono.ilike(search_filter))
            )
        
        usuarios = query.order_by(self.usuario_repo.model.fecha_registro.desc()).all()
        
        resultado = []
        for u in usuarios:
            user_data = {
                "id": u.id,
                "nombre": u.nombre,
                "correo": u.correo,
                "telefono": u.telefono,
                "rol": u.rol,
                "activo": u.activo,
                "fecha_registro": u.fecha_registro.isoformat() if u.fecha_registro else None
            }
            
            # Si es chofer, agregar estadísticas
            if u.rol == 'chofer':
                viajes_completados = Viaje.query.filter_by(chofer_id=u.id, estado_logistico='finalizado').count()
                
                # Promedio de estrellas
                avg_rating = db.session.query(func.avg(Calificacion.estrellas))\
                    .join(Viaje, Viaje.id == Calificacion.viaje_id)\
                    .filter(Viaje.chofer_id == u.id).scalar()
                
                user_data["viajes_completados"] = viajes_completados
                user_data["promedio_calificacion"] = float(avg_rating) if avg_rating else 0.0
            
            resultado.append(user_data)
            
        return resultado, 200

    def toggle_user_status(self, usuario_id):
        usuario = self.usuario_repo.get_by_id(usuario_id)
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404
        
        usuario.activo = not usuario.activo
        self.usuario_repo.update(usuario)
        
        return {"mensaje": f"Usuario {'activado' if usuario.activo else 'desactivado'} correctamente", "activo": usuario.activo}, 200
