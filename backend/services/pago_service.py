import os
from werkzeug.utils import secure_filename
from repositories import PagoRepository, ViajeRepository, UsuarioRepository

class PagoService:
    def __init__(self, upload_folder):
        self.pago_repo = PagoRepository()
        self.viaje_repo = ViajeRepository()
        self.usuario_repo = UsuarioRepository()
        self.upload_folder = upload_folder

    def subir_comprobante(self, file, viaje_id):
        if file.filename == '':
            return {"error": "Nombre de archivo vacío"}, 400
        
        filename = secure_filename(f"viaje_{viaje_id}_{file.filename}")
        file_path = os.path.join(self.upload_folder, filename)
        file.save(file_path)
        
        viaje = self.viaje_repo.get_by_id(viaje_id)
        if not viaje:
            return {"error": "Viaje no encontrado"}, 404
            
        nuevo_pago = self.pago_repo.create(
            viaje_id=viaje_id,
            comprobante_url=f"/uploads/comprobantes/{filename}",
            monto_pagado=viaje.monto_total
        )
        
        self.viaje_repo.update(viaje, estado_pago='comprobante_subido')
        
        return {"mensaje": "Comprobante subido exitosamente", "pago_id": nuevo_pago.id}, 200

    def get_pagos_admin(self, estado_filtro):
        mapeo_estados = {
            'pendientes': 'comprobante_subido',
            'aprobados': 'aprobado',
            'rechazados': 'rechazado'
        }
        estado_db = mapeo_estados.get(estado_filtro, 'comprobante_subido')
        
        # We need a custom query here, or we can fetch all and filter in memory since repos are basic.
        # But for now, let's use the basic repository pattern we have.
        # For a clean implementation, this should be in PagoRepository.
        # Since I'm migrating, I'll keep the logic using repos.
        
        pagos = self.pago_repo.get_all()
        resultado = []
        for pago in pagos:
            viaje = self.viaje_repo.get_by_id(pago.viaje_id)
            if viaje.estado_pago == estado_db:
                cliente = self.usuario_repo.get_by_id(viaje.cliente_id)
                resultado.append({
                    "pago_id": pago.id,
                    "viaje_id": viaje.id,
                    "cliente_id": cliente.id,
                    "cliente_nombre": cliente.nombre,
                    "cliente_correo": cliente.correo,
                    "monto": float(pago.monto_pagado),
                    "comprobante_url": f"http://127.0.0.1:5001{pago.comprobante_url}",
                    "origen": viaje.dir_origen,
                    "destino": viaje.dir_destino,
                    "tipo_servicio": viaje.tipo_servicio,
                    "estado_pago": viaje.estado_pago,
                    "fecha": pago.fecha_pago.strftime("%Y-%m-%d %H:%M")
                })
        return resultado, 200

    def aprobar_pago(self, pago_id):
        pago = self.pago_repo.get_by_id(pago_id)
        if not pago: 
            return {"error": "Pago no encontrado"}, 404
        
        viaje = self.viaje_repo.get_by_id(pago.viaje_id)
        self.viaje_repo.update(viaje, estado_pago='aprobado', estado_logistico='buscando_chofer')
        
        # Generar TicketQR
        from database import TicketQR, db
        import uuid
        ticket_existente = TicketQR.query.filter_by(viaje_id=viaje.id).first()
        if not ticket_existente:
            nuevo_ticket = TicketQR(
                viaje_id=viaje.id,
                codigo_hash=str(uuid.uuid4()),
                estado='generado'
            )
            db.session.add(nuevo_ticket)
            db.session.commit()
            
        return {"mensaje": "Pago aprobado, buscando chofer", "viaje_id": viaje.id}, 200
