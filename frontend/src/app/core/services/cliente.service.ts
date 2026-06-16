import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';
import { SoapService } from './soap.service';
import { Viaje } from '../../interfaces/models/viaje.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService {
  private viajesNamespace = 'http://ecuaviptour.com/soap/viajes';
  private chatNamespace = 'http://ecuaviptour.com/soap/chat';

  constructor(private soapService: SoapService, private authService: AuthService) { }

  getMisViajes(): Observable<Viaje[]> {
    return this.soapService.post(
      this.viajesNamespace,
      'getMisViajesRequest',
      {},
      this.authService.getToken() || undefined
    ).pipe(
      map(res => {
        // Enforce that return is an array
        return (res && res.viajes) || [];
      })
    );
  }

  getMisReservas(): Observable<any[]> {
    return this.soapService.post(
      this.viajesNamespace,
      'getMisReservasRequest',
      {},
      this.authService.getToken() || undefined
    ).pipe(
      map(res => {
        return (res && res.reservas) || [];
      })
    );
  }

  cancelarViaje(id: number): Observable<any> {
    return this.soapService.post(
      this.viajesNamespace,
      'cancelarViajeRequest',
      { viaje_id: id },
      this.authService.getToken() || undefined
    );
  }

  markAsRead(otroId: number): Observable<any> {
    return this.soapService.post(
      this.chatNamespace,
      'markReadRequest',
      { otro_id: otroId },
      this.authService.getToken() || undefined
    );
  }

  calificarViaje(datos: any): Observable<any> {
    return this.soapService.post(
      this.viajesNamespace,
      'calificarRequest',
      {
        viaje_id: datos.viaje_id,
        estrellas: datos.estrellas,
        comentario: datos.comentario
      },
      this.authService.getToken() || undefined
    );
  }
}
