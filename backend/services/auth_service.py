from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token
from repositories import UsuarioRepository

class AuthService:
    def __init__(self):
        self.usuario_repo = UsuarioRepository()

    def register(self, datos):
        if not datos or not datos.get('correo') or not datos.get('password') or not datos.get('nombre'):
            return {"error": "Faltan datos obligatorios"}, 400

        usuario_existente = self.usuario_repo.get_by_email(datos.get('correo'))
        if usuario_existente:
            return {"error": "El correo ya está registrado"}, 400

        nuevo_usuario = self.usuario_repo.create(
            nombre=datos.get('nombre'),
            correo=datos.get('correo'),
            password_hash=generate_password_hash(datos.get('password')),
            telefono=datos.get('telefono', ''),
            cedula=datos.get('cedula', ''),
            rol=datos.get('rol', 'cliente')
        )
        
        token = create_access_token(identity=str(nuevo_usuario.id))
        return {
            "mensaje": "Usuario registrado", 
            "token": token, 
            "usuario": {
                "id": nuevo_usuario.id, 
                "nombre": nuevo_usuario.nombre, 
                "correo": nuevo_usuario.correo,
                "rol": nuevo_usuario.rol,
                "telefono": nuevo_usuario.telefono,
                "cedula": nuevo_usuario.cedula,
                "foto_perfil_url": nuevo_usuario.foto_perfil_url
            }
        }, 201

    def login(self, datos):
        if not datos or not datos.get('correo') or not datos.get('password'):
            return {"error": "Faltan datos obligatorios"}, 400

        usuario = self.usuario_repo.get_by_email(datos.get('correo'))
        if not usuario or not check_password_hash(usuario.password_hash, datos.get('password')):
            return {"error": "Credenciales inválidas"}, 401

        token = create_access_token(identity=str(usuario.id))
        return {
            "mensaje": "Login exitoso", 
            "token": token, 
            "usuario": {
                "id": usuario.id, 
                "nombre": usuario.nombre, 
                "correo": usuario.correo, 
                "rol": usuario.rol, 
                "telefono": usuario.telefono,
                "cedula": usuario.cedula,
                "foto_perfil_url": usuario.foto_perfil_url
            }
        }, 200

    def update_profile(self, usuario_id, datos):
        usuario = self.usuario_repo.get_by_id(usuario_id)
        if not usuario:
            return {"error": "Usuario no encontrado"}, 404

        # Campos permitidos para actualizar
        update_data = {}
        if 'nombre' in datos:
            update_data['nombre'] = datos['nombre']
        if 'telefono' in datos:
            update_data['telefono'] = datos['telefono']
        if 'cedula' in datos:
            update_data['cedula'] = datos['cedula']
        if 'foto_perfil_url' in datos:
            update_data['foto_perfil_url'] = datos['foto_perfil_url']
        if 'password' in datos and datos['password']:
            update_data['password_hash'] = generate_password_hash(datos['password'])

        updated_user = self.usuario_repo.update(usuario, **update_data)
        
        return {
            "mensaje": "Perfil actualizado correctamente",
            "usuario": {
                "id": updated_user.id,
                "nombre": updated_user.nombre,
                "correo": updated_user.correo,
                "rol": updated_user.rol,
                "telefono": updated_user.telefono,
                "cedula": updated_user.cedula,
                "foto_perfil_url": updated_user.foto_perfil_url
            }
        }, 200
