import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { Viaje } from '../../interfaces/models/viaje.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private apiUrl = 'http://localhost:5001/api/viajes';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getMisViajes(): Observable<Viaje[]> {
    return this.http.get<Viaje[]>(`${this.apiUrl}/mis-viajes`, { headers: this.getHeaders() });
  }

  cancelarViaje(id: number): Observable<any> {
    return this.http.post(`${this.apiUrl.replace('/api/cliente', '/api/viajes')}/cancelar/${id}`, {}, { headers: this.getHeaders() });
  }

  markAsRead(otroId: number): Observable<any> {
    return this.http.post(`http://localhost:5001/api/chat/mark_read/${otroId}`, {}, { headers: this.getHeaders() });
  }

  calificarViaje(datos: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/calificar`, datos, { headers: this.getHeaders() });
  }
}
