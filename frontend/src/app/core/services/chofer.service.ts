import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class ChoferService {
  private apiUrl = 'http://localhost:5001/api/chofer';

  constructor(private http: HttpClient, private authService: AuthService) { }

  private getHeaders() {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
  }

  getViajesDisponibles(): Observable<any> {
    return this.http.get(`${this.apiUrl}/viajes/disponibles`, { headers: this.getHeaders() });
  }

  getMisViajes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/mis-viajes`, { headers: this.getHeaders() });
  }

  getVehiculo(): Observable<any> {
    return this.http.get(`${this.apiUrl}/vehiculo`, { headers: this.getHeaders() });
  }

  updateVehiculo(formData: FormData): Observable<any> {
    return this.http.post(`${this.apiUrl}/vehiculo`, formData, { headers: this.getHeaders() });
  }
}
