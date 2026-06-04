export interface Viaje {
  id?: number;
  viaje_id?: number; // Compatibilidad con rastreo
  cliente_id?: number;
  chofer_id?: number;
  vehiculo_id?: number;
  origen: string;
  dir_origen?: string; // Compatibilidad con rastreo
  destino: string;
  dir_destino?: string; // Compatibilidad con rastreo
  distancia_km: number;
  tarifa: number;
  tipo_servicio: 'pasajero' | 'encomienda' | 'express';
  estado_pago?: 'pendiente' | 'comprobante_subido' | 'aprobado' | 'rechazado';
  estado_logistico?: 'pendiente' | 'buscando_chofer' | 'en_curso' | 'finalizado' | 'cancelado' | 'esperando_cliente' | 'aceptado' | 'asignado' | 'en_viaje';
  fecha?: string;
  // Extra fields that API might return
  monto?: number;
  cliente?: string;
  unidad?: string;
  chofer?: string;
}
