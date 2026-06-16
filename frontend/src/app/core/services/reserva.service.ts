import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { SoapService } from './soap.service';

@Injectable({
  providedIn: 'root'
})
export class ReservaService {
  private viajesNamespace = 'http://ecuaviptour.com/soap/viajes';
  private pagosNamespace = 'http://ecuaviptour.com/soap/pagos';

  constructor(private soapService: SoapService, private authService: AuthService) { }

  crearReserva(datosViaje: any): Observable<any> {
    let asientosArray: number[] = [];
    if (datosViaje.asientos) {
      if (typeof datosViaje.asientos === 'string') {
        try {
          asientosArray = JSON.parse(datosViaje.asientos);
        } catch (e) {
          asientosArray = [];
        }
      } else if (Array.isArray(datosViaje.asientos)) {
        asientosArray = datosViaje.asientos;
      }
    }

    return this.soapService.post(
      this.viajesNamespace,
      'reservarRequest',
      {
        origen: datosViaje.origen,
        lat_origen: datosViaje.lat_origen,
        lng_origen: datosViaje.lng_origen,
        destino: datosViaje.destino,
        lat_destino: datosViaje.lat_destino,
        lng_destino: datosViaje.lng_destino,
        referencia: datosViaje.referencia,
        tipo_servicio: datosViaje.tipo_servicio || datosViaje.tipo,
        duracion_minutos: datosViaje.duracion_minutos,
        distancia: datosViaje.distancia,
        fecha_viaje: datosViaje.fecha_viaje || datosViaje.hora,
        tarifa: datosViaje.tarifa,
        num_pasajeros: datosViaje.num_pasajeros || datosViaje.pasajeros,
        chofer_id: datosViaje.chofer_id,
        cliente_id: datosViaje.cliente_id,
        estado_pago: datosViaje.estado_pago,
        asientos: asientosArray.length > 0 ? asientosArray : undefined
      },
      this.authService.getToken() || undefined
    );
  }

  subirComprobante(viajeId: number, file: File): Observable<any> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Data = reader.result as string;
        this.soapService.post(
          this.pagosNamespace,
          'subirComprobanteRequest',
          {
            viaje_id: viajeId,
            file_base64: base64Data,
            filename: file.name
          },
          this.authService.getToken() || undefined
        ).subscribe({
          next: (res) => {
            observer.next(res);
            observer.complete();
          },
          error: (err) => observer.error(err)
        });
      };
      reader.onerror = (error) => observer.error(error);
    });
  }

  subirComprobanteReserva(reservaId: number, file: File): Observable<any> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Data = reader.result as string;
        this.soapService.post(
          this.viajesNamespace,
          'subirComprobanteReservaRequest',
          {
            reserva_id: reservaId,
            file_base64: base64Data,
            filename: file.name
          },
          this.authService.getToken() || undefined
        ).subscribe({
          next: (res) => {
            observer.next(res);
            observer.complete();
          },
          error: (err) => observer.error(err)
        });
      };
      reader.onerror = (error) => observer.error(error);
    });
  }
}
