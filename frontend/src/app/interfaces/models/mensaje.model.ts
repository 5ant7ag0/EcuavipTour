export interface Mensaje {
  id?: number;
  viaje_id?: number;
  remitente_id: number;
  destinatario_id?: number;
  tipo_receptor?: 'admin' | 'chofer';
  contenido: string;
  leido?: boolean;
  timestamp?: string;
}
