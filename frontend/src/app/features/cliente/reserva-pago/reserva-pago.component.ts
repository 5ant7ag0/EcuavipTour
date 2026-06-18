import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReservaService } from '../../../core/services/reserva.service';
import { SoapService } from '../../../core/services/soap.service';
import { CountdownService } from '../../../core/services/countdown.service';
import { Subscription, Observable } from 'rxjs';

@Component({
  selector: 'app-reserva-pago',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reserva-pago.component.html'
})
export class ReservaPagoComponent implements OnInit, OnDestroy {
  reservaId: number | null = null;
  viajeId: number | null = null;
  reservaDetails: any = null;
  selectedFile: File | null = null;
  filePreview: string | null = null;
  loading = false;
  success = false;
  error = '';
  isExpired = false;

  // Parámetros de vista cargados inmediatamente
  origen = '';
  destino = '';
  asiento: string | null = null;
  abordaje = '';
  tarifa = 0;
  hora = '';
  pin = '';

  reservaParams: any = {};

  countdown$: Observable<{time: string, isCritical: boolean, isExpired: boolean}> | null = null;
  private countdownSub?: Subscription;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservaService: ReservaService,
    private soapService: SoapService,
    private countdownService: CountdownService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.reservaParams = params;
      const idParam = params['reservaId'];
      const viajeIdParam = params['viajeId'];

      if (idParam) {
        // Modo Viaje Compartido
        this.reservaId = Number(idParam);
        this.origen = params['origen'] || '';
        this.destino = params['destino'] || '';
        this.asiento = params['asiento'] || null;
        this.abordaje = params['abordaje'] || '';
        this.tarifa = params['tarifa'] ? Number(params['tarifa']) : 0;
        this.hora = params['hora'] || '';
        this.pin = params['pin'] || '';

        const targetStr = params['fechaLimite'] ? params['fechaLimite'].replace(' ', 'T') : '';
        if (targetStr) {
          this.startCountdown(targetStr);
        }

        this.cargarReserva();
      } else if (viajeIdParam) {
        // Modo Reintento de Pago Viaje Exprés
        this.viajeId = Number(viajeIdParam);
        this.origen = params['origen'] || '';
        this.destino = params['destino'] || '';
        this.asiento = params['asiento'] || null;
        this.tarifa = params['tarifa'] ? Number(params['tarifa']) : 0;
        this.hora = params['hora'] || '';

        this.cargarViajeActivo();
      } else if (params['origen']) {
        // Modo Creación y Pago de Nuevo Viaje Exprés
        this.origen = params['origen'] || '';
        this.destino = params['destino'] || '';
        this.tarifa = params['tarifa'] ? Number(params['tarifa']) : 0;
        this.hora = params['hora'] || '';
        
        const parsedAsientos = params['asientos'];
        if (parsedAsientos) {
          try {
            const arr = JSON.parse(parsedAsientos);
            this.asiento = (Array.isArray(arr) && arr.length > 0) ? arr.join(', ') : null;
          } catch (e) {
            this.asiento = parsedAsientos;
          }
        }

        // Timer de 15 minutos desde ahora para subir comprobante
        const targetDate = new Date(Date.now() + 15 * 60000).toISOString();
        this.startCountdown(targetDate);
      } else {
        this.router.navigate(['/cliente/cotizar']);
      }
    });
  }

  ngOnDestroy() {
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }
  }

  cargarReserva() {
    this.loading = true;
    this.error = '';
    this.soapService.post(
      'http://ecuaviptour.com/soap/viajes',
      'getMisReservasRequest',
      {}
    ).subscribe({
      next: (res) => {
        this.loading = false;
        const list = res.reservas || [];
        this.reservaDetails = list.find((r: any) => Number(r.id) === this.reservaId);
        
        if (this.reservaDetails) {
          // Si el estado en el servidor es cancelado/confirmado, actualizamos la vista
          const estadoPago = (this.reservaDetails.estado_pago || '').toUpperCase();
          if ('CANCELADO' === estadoPago) {
            this.isExpired = true;
            this.error = 'Esta reserva ha sido cancelada por expiración del tiempo de pago.';
          } else if ('CONFIRMADO' === estadoPago) {
            this.success = true;
          }

          // Sincronizar datos cargados del servidor en caso de cambio
          this.origen = this.reservaDetails.dir_origen || this.origen;
          this.destino = this.reservaDetails.dir_destino || this.destino;
          this.asiento = this.reservaDetails.numero_asiento || this.asiento;
          this.abordaje = this.reservaDetails.punto_abordaje || this.abordaje;
          this.pin = this.reservaDetails.pin_abordaje || this.pin;
          this.hora = this.reservaDetails.fecha_hora_salida || this.hora;
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error cargando reserva:', err);
      }
    });
  }

  cargarViajeActivo() {
    this.loading = true;
    this.error = '';
    this.soapService.post(
      'http://ecuaviptour.com/soap/viajes',
      'getViajeActivoRequest',
      {}
    ).subscribe({
      next: (res: any) => {
        this.loading = false;
        const v = res && res.viaje;
        if (v && Number(v.viaje_id || v.id) === this.viajeId) {
          this.origen = v.origen || this.origen;
          this.destino = v.destino || this.destino;
          this.tarifa = v.monto || this.tarifa;
          this.hora = v.fecha || this.hora;
          if (v.referencia) {
            this.reservaParams.referencia = v.referencia;
          }
          if (v.tipo_servicio) {
            this.reservaParams.tipo = v.tipo_servicio;
          }
          if (v.asientos) {
            this.asiento = Array.isArray(v.asientos) ? v.asientos.join(', ') : v.asientos;
          }
          if (v.estado_pago === 'comprobante_subido') {
            const isEncomienda = (v.tipo_servicio || '').toLowerCase() === 'encomienda';
            this.router.navigate([isEncomienda ? '/cliente/paquetes' : '/cliente/en-curso']);
          } else if (v.estado_pago === 'rechazado') {
            this.error = 'Tu comprobante de pago fue rechazado. Por favor, sube un nuevo comprobante.';
          }
          if (v.fecha_limite_pago) {
            this.startCountdown(v.fecha_limite_pago.replace(' ', 'T'));
          }
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error cargando viaje activo:', err);
      }
    });
  }

  private startCountdown(targetDate: string) {
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }
    this.countdown$ = this.countdownService.getCountdown(targetDate);
    this.countdownSub = this.countdown$.subscribe((val: any) => {
      if (val && val.isExpired) {
        this.isExpired = true;
        this.error = 'El tiempo límite de 15 minutos para realizar el pago ha expirado. Tu reservación ha sido cancelada.';
      }
    });
  }

  onFileSelected(event: any) {
    if (this.isExpired) return;
    const file = event.target.files[0];
    if (file) {
      if (file.type.match(/image\/*/) == null) {
        this.error = 'Solo se permiten imágenes (JPG, PNG).';
        return;
      }
      this.selectedFile = file;
      this.error = '';

      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.filePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  confirmarPago() {
    if (this.isExpired) return;
    if (!this.selectedFile) {
      this.error = 'Por favor, sube el comprobante de transferencia bancaria.';
      return;
    }

    this.loading = true;
    this.error = '';

    if (this.reservaId) {
      // Caso 1: Reserva de Frecuencia Compartida
      this.reservaService.subirComprobanteReserva(this.reservaId, this.selectedFile!).subscribe({
        next: () => {
          this.loading = false;
          this.success = true;
          setTimeout(() => {
            this.router.navigate(['/cliente/cotizar'], { queryParams: { tab: 'my-trips' } });
          }, 2500);
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error al subir comprobante: ' + (err.error?.error || 'Intenta nuevamente');
        }
      });
    } else if (this.viajeId) {
      // Caso 2: Reintento de Pago de Viaje Exprés existente
      this.reservaService.subirComprobante(this.viajeId, this.selectedFile!).subscribe({
        next: () => {
          this.loading = false;
          this.success = true;
          setTimeout(() => {
            const isEncomienda = (this.reservaParams.tipo || '').toLowerCase() === 'encomienda';
            this.router.navigate([isEncomienda ? '/cliente/paquetes' : '/cliente/en-curso']);
          }, 2500);
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error al subir comprobante: ' + (err.error?.error || 'Intenta nuevamente');
        }
      });
    } else {
      // Caso 3: Nuevo Viaje Exprés (Crear y Subir)
      this.reservaService.crearReserva(this.reservaParams).subscribe({
        next: (res: any) => {
          const createdViajeId = res.viaje_id;
          this.reservaService.subirComprobante(createdViajeId, this.selectedFile!).subscribe({
            next: () => {
              this.loading = false;
              this.success = true;
              setTimeout(() => {
                const isEncomienda = (this.reservaParams.tipo || '').toLowerCase() === 'encomienda';
                this.router.navigate([isEncomienda ? '/cliente/paquetes' : '/cliente/en-curso']);
              }, 2500);
            },
            error: (err) => {
              this.loading = false;
              this.error = 'Error al subir comprobante: ' + (err.error?.error || 'Intenta nuevamente');
            }
          });
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error al crear la solicitud de viaje: ' + (err.error?.error || 'Intenta nuevamente');
        }
      });
    }
  }

  cancelarReserva() {
    this.router.navigate(['/cliente/cotizar']);
  }
}
