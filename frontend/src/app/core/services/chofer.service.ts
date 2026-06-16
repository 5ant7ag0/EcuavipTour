import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { AuthService } from './auth.service';
import { SoapService } from './soap.service';

@Injectable({
  providedIn: 'root'
})
export class ChoferService {
  private namespace = 'http://ecuaviptour.com/soap/chofer';

  constructor(private soapService: SoapService, private authService: AuthService) { }

  getViajesDisponibles(): Observable<any> {
    return this.soapService.post(
      this.namespace,
      'getViajesDisponiblesRequest',
      {},
      this.authService.getToken() || undefined
    ).pipe(
      map(res => {
        return (res && res.viajes) || [];
      })
    );
  }

  getMisViajes(): Observable<any> {
    return this.soapService.post(
      this.namespace,
      'getMisViajesChoferRequest',
      {},
      this.authService.getToken() || undefined
    ).pipe(
      map(res => {
        return (res && res.viajes) || [];
      })
    );
  }

  getVehiculo(): Observable<any> {
    return this.soapService.post(
      this.namespace,
      'getVehiculoRequest',
      {},
      this.authService.getToken() || undefined
    ).pipe(
      map(res => {
        return (res && res.vehiculo) || null;
      })
    );
  }

  updateVehiculo(formData: FormData): Observable<any> {
    return new Observable(observer => {
      Promise.all([
        this.fileToBase64(formData.get('foto_auto')),
        this.fileToBase64(formData.get('foto_matricula')),
        this.fileToBase64(formData.get('foto_licencia'))
      ]).then(([fotoAuto, fotoMatricula, fotoLicencia]) => {
        const payload: any = {
          placa: formData.get('placa') || undefined,
          marca: formData.get('marca') || undefined,
          modelo: formData.get('modelo') || undefined,
          anio: formData.get('anio') ? Number(formData.get('anio')) : undefined,
          tipo_vehiculo: formData.get('tipo_vehiculo') || undefined,
          capacidad_max: formData.get('capacidad_max') ? Number(formData.get('capacidad_max')) : undefined,
          color: formData.get('color') || undefined,
        };

        if (fotoAuto) {
          payload.foto_auto_base64 = fotoAuto.base64;
          payload.foto_auto_filename = fotoAuto.name;
        }
        if (fotoMatricula) {
          payload.foto_matricula_base64 = fotoMatricula.base64;
          payload.foto_matricula_filename = fotoMatricula.name;
        }
        if (fotoLicencia) {
          payload.foto_licencia_base64 = fotoLicencia.base64;
          payload.foto_licencia_filename = fotoLicencia.name;
        }

        this.soapService.post(
          this.namespace,
          'updateVehiculoRequest',
          payload,
          this.authService.getToken() || undefined
        ).subscribe({
          next: (res) => {
            observer.next(res);
            observer.complete();
          },
          error: (err) => observer.error(err)
        });
      }).catch(err => observer.error(err));
    });
  }

  private fileToBase64(file: any): Promise<{ base64: string, name: string } | null> {
    if (!file || !(file instanceof File)) {
      return Promise.resolve(null);
    }
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        resolve({
          base64: reader.result as string,
          name: file.name
        });
      };
      reader.onerror = (error) => reject(error);
    });
  }

  updateEstadoFrecuencia(viajeProgramadoId: number, estado: string): Observable<any> {
    return this.soapService.post(
      'http://ecuaviptour.com/soap/viajes',
      'updateEstadoFrecuenciaRequest',
      {
        viaje_programado_id: viajeProgramadoId,
        estado: estado
      },
      this.authService.getToken() || undefined
    );
  }
}
