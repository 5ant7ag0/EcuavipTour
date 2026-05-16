from repositories import UsuarioRepository
from database import Viaje, Calificacion, db
from sqlalchemy import func

class AdminUserService:
    def __init__(self):
        self.usuario_repo = UsuarioRepository()

    def get_all_users(self, rol=None, search=None, activo=None, sort='desc', start_date=None, end_date=None):
        query = self.usuario_repo.model.query
        
        if rol:
            query = query.filter_by(rol=rol)
        
        if activo is not None:
            # Convertir string 'true'/'false' a boolean si es necesario
            is_active = str(activo).lower() == 'true'
            query = query.filter_by(activo=is_active)
        
        if start_date:
            query = query.filter(self.usuario_repo.model.fecha_registro >= start_date)
        
        if end_date:
            query = query.filter(self.usuario_repo.model.fecha_registro <= end_date)
        
        if search:
            search_filter = f"%{search}%"
            query = query.filter(
                (self.usuario_repo.model.nombre.ilike(search_filter)) | 
                (self.usuario_repo.model.correo.ilike(search_filter)) |
                (self.usuario_repo.model.telefono.ilike(search_filter)) |
                (self.usuario_repo.model.cedula.ilike(search_filter))
            )
        
        if sort == 'asc':
            query = query.order_by(self.usuario_repo.model.fecha_registro.asc())
        else:
            query = query.order_by(self.usuario_repo.model.fecha_registro.desc())
            
        usuarios = query.all()
        
        resultado = []
        for u in usuarios:
            user_data = {
                "id": u.id,
                "nombre": u.nombre,
                "correo": u.correo,
                "telefono": u.telefono,
                "cedula": u.cedula,
                "foto_perfil_url": u.foto_perfil_url,
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

    def update_user_admin(self, usuario_id, data):
        usuario = self.usuario_repo.get_by_id(usuario_id)
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404
        
        if 'rol' in data:
            usuario.rol = data['rol']
        if 'activo' in data:
            usuario.activo = data['activo']
        if 'nombre' in data:
            usuario.nombre = data['nombre']
        if 'correo' in data:
            usuario.correo = data['correo']
        if 'cedula' in data:
            usuario.cedula = data['cedula']
        if 'telefono' in data:
            usuario.telefono = data['telefono']
            
        self.usuario_repo.update(usuario)
        return {"mensaje": "Usuario actualizado correctamente", "usuario": {
            "id": usuario.id,
            "nombre": usuario.nombre,
            "rol": usuario.rol,
            "activo": usuario.activo
        }}, 200

    def update_user_photo(self, usuario_id, file):
        import os
        from werkzeug.utils import secure_filename
        
        usuario = self.usuario_repo.get_by_id(usuario_id)
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404
            
        filename = secure_filename(f"admin_update_user_{usuario_id}_{file.filename}")
        # Asegurar que el path sea absoluto desde la raíz del backend
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        upload_folder = os.path.join(base_dir, 'uploads/perfiles')
        os.makedirs(upload_folder, exist_ok=True)
        
        file_path = os.path.join(upload_folder, filename)
        file.save(file_path)
        
        # Guardar path relativo para servirlo
        usuario.foto_perfil_url = f"uploads/perfiles/{filename}"
        self.usuario_repo.update(usuario)
        
        return {
            "mensaje": "Foto actualizada correctamente", 
            "foto_perfil_url": usuario.foto_perfil_url
        }, 200
