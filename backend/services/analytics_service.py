from database import Viaje, Usuario, Pago, db
from sqlalchemy import func
from datetime import datetime, timedelta

class AnalyticsService:
    def get_kpi_stats(self):
        # 1. Ingresos Totales (Viajes con pago aprobado)
        ingresos_totales = db.session.query(func.sum(Viaje.monto_total))\
            .filter(Viaje.estado_pago == 'aprobado').scalar() or 0
        
        # 2. Viajes Activos (En curso)
        viajes_activos = Viaje.query.filter(Viaje.estado_logistico.in_(['en_curso', 'recogiendo'])).count()
        
        # 3. Pagos Pendientes
        pagos_pendientes = Viaje.query.filter_by(estado_pago='pendiente').count()
        
        # 4. Choferes en Línea (Activos)
        choferes_online = Usuario.query.filter_by(rol='chofer', activo=True).count()
        
        return {
            "ingresos_totales": float(ingresos_totales),
            "viajes_activos": viajes_activos,
            "pagos_pendientes": pagos_pendientes,
            "choferes_online": choferes_online
        }, 200

    def get_revenue_chart(self, period='month'):
        # Ingresos por día en los últimos 30 días
        limit_date = datetime.utcnow() - timedelta(days=30)
        
        stats = db.session.query(
            func.date(Viaje.fecha_creacion).label('fecha'),
            func.sum(Viaje.monto_total).label('total')
        ).filter(Viaje.fecha_creacion >= limit_date, Viaje.estado_pago == 'aprobado')\
         .group_by(func.date(Viaje.fecha_creacion))\
         .order_by(func.date(Viaje.fecha_creacion)).all()
        
        return {
            "labels": [str(s.fecha) for s in stats],
            "data": [float(s.total) for s in stats]
        }, 200

    def get_trip_distribution(self):
        stats = db.session.query(
            Viaje.estado_logistico,
            func.count(Viaje.id)
        ).group_by(Viaje.estado_logistico).all()
        
        return {
            "labels": [s[0] for s in stats],
            "data": [s[1] for s in stats]
        }, 200

    def get_top_routes(self):
        # Top 5 rutas más frecuentes
        stats = db.session.query(
            Viaje.dir_origen,
            Viaje.dir_destino,
            func.count(Viaje.id).label('count')
        ).group_by(Viaje.dir_origen, Viaje.dir_destino)\
         .order_by(func.count(Viaje.id).desc())\
         .limit(5).all()
        
        return [{
            "ruta": f"{s[0]} -> {s[1]}",
            "cantidad": s[2]
        } for s in stats], 200

    def get_service_type_stats(self):
        stats = db.session.query(
            Viaje.tipo_servicio,
            func.count(Viaje.id)
        ).group_by(Viaje.tipo_servicio).all()
        
        return {
            "labels": [s[0] for s in stats],
            "data": [s[1] for s in stats]
        }, 200

    def get_recent_movements(self):
        viajes = Viaje.query.order_by(Viaje.fecha_creacion.desc()).limit(10).all()
        
        resultado = []
        for v in viajes:
            cliente = Usuario.query.get(v.cliente_id)
            resultado.append({
                "id": v.id,
                "cliente": cliente.nombre if cliente else "Sistema",
                "monto": float(v.monto_total),
                "estado": v.estado_logistico,
                "fecha": v.fecha_creacion.isoformat()
            })
        return resultado, 200
