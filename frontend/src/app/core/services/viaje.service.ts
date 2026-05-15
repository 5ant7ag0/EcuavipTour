import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface CotizacionRequest {
  distancia_km: number;
  tipo_servicio: 'pasajero' | 'encomienda' | 'express';
  num_pasajeros: number;
}

export interface CotizacionResponse {
  precio_total: number;
  precio_unitario: number;
  zona: string;
  mensaje?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ViajeService {
  private apiUrl = 'http://localhost:5001/api/viajes';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  validarAbordaje(viajeId: number, codigo: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/validar_abordaje`, {
      viaje_id: viajeId,
      codigo: codigo
    }, { headers: this.getHeaders() });
  }

  cotizarViaje(request: CotizacionRequest): Observable<CotizacionResponse> {
    const distancia = request.distancia_km;
    const tipo_servicio = request.tipo_servicio;
    const num_pasajeros = request.num_pasajeros;

    let precio_zona = 0;
    let zona = '';

    if (distancia <= 145) {
      precio_zona = 15;
      zona = 'Norte (Hasta La Marín/Condado)';
    } else if (distancia <= 155) {
      precio_zona = 18;
      zona = 'Valles y Sur';
    } else if (distancia <= 165) {
      precio_zona = 20;
      zona = 'Carapungo/Calderón';
    } else {
      precio_zona = 22;
      zona = 'Mitad del Mundo / Extremos';
    }

    if (tipo_servicio === 'express') {
      const base = 60;
      let precio_total = base;
      if (distancia > 165) {
        precio_total += (distancia - 165) * 0.50;
      }
      return of({
        precio_total: Number(precio_total.toFixed(2)),
        precio_unitario: Number(precio_total.toFixed(2)),
        zona: 'Express 24H (Tababela)'
      });
    }

    if (tipo_servicio === 'encomienda') {
      const precio_unitario = precio_zona * 0.70;
      return of({
        precio_total: Number(precio_unitario.toFixed(2)),
        precio_unitario: Number(precio_unitario.toFixed(2)),
        zona: zona,
        mensaje: 'Peso máximo permitido de maleta: 25Kg'
      });
    }

    // pasajero
    const precio_total = precio_zona * num_pasajeros;
    return of({
      precio_total: Number(precio_total.toFixed(2)),
      precio_unitario: Number(precio_zona.toFixed(2)),
      zona: zona
    });
  }

  getViajeActivo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/activo`, { headers: this.getHeaders() });
  }

  cancelarViaje(viajeId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/cancelar`, {
      viaje_id: viajeId
    }, { headers: this.getHeaders() });
  }

  calificarViaje(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/calificar`, datos, { headers: this.getHeaders() });
  }
}
