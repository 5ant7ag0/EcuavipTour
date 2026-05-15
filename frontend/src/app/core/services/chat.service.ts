import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private apiUrl = 'http://127.0.0.1:5001/api/chat';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getHistorial(otroId: number, tipoReceptor: string = 'admin', viajeId?: number): Observable<any[]> {
    let url = `${this.apiUrl}/history/${otroId}?tipo_receptor=${tipoReceptor}`;
    if (viajeId) {
      url += `&viaje_id=${viajeId}`;
    }
    return this.http.get<any[]>(url, { headers: this.getHeaders() });
  }

  markAsRead(otroId: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/mark_read/${otroId}`, {}, { headers: this.getHeaders() });
  }

  getAdminInfo(): Observable<{ admin_id: number; admin_nombre: string }> {
    return this.http.get<any>(`${this.apiUrl}/admin-info`, { headers: this.getHeaders() });
  }
}
