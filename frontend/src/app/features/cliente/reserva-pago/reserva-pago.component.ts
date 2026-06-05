import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ReservaService } from '../../../core/services/reserva.service';
import { ClienteService } from '../../../core/services/cliente.service';
import { CountdownService } from '../../../core/services/countdown.service';
import { Subscription, Observable } from 'rxjs';

@Component({
  selector: 'app-reserva-pago',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reserva-pago.component.html'
})
export class ReservaPagoComponent implements OnInit, OnDestroy {
  reservaParams: any = {};
  selectedFile: File | null = null;
  filePreview: string | null = null;
  loading = false;
  success = false;
  error = '';
  countdown$: Observable<{time: string, isCritical: boolean, isExpired: boolean}> | null = null;
  private countdownSub?: Subscription;

  asTimer(timer: any): any {
    return timer;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private reservaService: ReservaService,
    private clienteService: ClienteService,
    private countdownService: CountdownService
  ) {}

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      this.reservaParams = { ...params };
      if (this.reservaParams.viajeId) {
        this.loading = true;
        this.clienteService.getMisViajes().subscribe({
          next: (viajes) => {
            this.loading = false;
            const viaje: any = viajes.find((v: any) => Number(v.viaje_id || v.id) === Number(this.reservaParams.viajeId));
            if (viaje) {
              this.reservaParams.origen = viaje.origen;
              this.reservaParams.destino = viaje.destino;
              this.reservaParams.tarifa = viaje.tarifa;
              this.reservaParams.tipo = viaje.tipo_servicio;
              this.reservaParams.pasajeros = viaje.num_pasajeros;
              this.reservaParams.hora = viaje.fecha_viaje;
              
              if (viaje.fecha_limite_pago) {
                this.startCountdown(viaje.fecha_limite_pago);
              }
            } else {
              this.error = 'No se encontró la reservación indicada.';
            }
          },
          error: (err) => {
            this.loading = false;
            this.error = 'Error al cargar los detalles de la reservación.';
          }
        });
      } else if (!this.reservaParams.origen || !this.reservaParams.destino) {
        this.router.navigate(['/cliente/cotizar']);
      } else {
        // New booking: start a 15-minute countdown on-screen
        const currentKey = `${this.reservaParams.origen}|${this.reservaParams.destino}|${this.reservaParams.tarifa}|${this.reservaParams.pasajeros}|${this.reservaParams.hora}|${this.reservaParams.asientos}`;
        const savedKey = sessionStorage.getItem('reserva_pago_key');
        const savedLimit = sessionStorage.getItem('reserva_pago_limite');
        let targetDate: string;

        if (savedKey === currentKey && savedLimit) {
          targetDate = savedLimit;
        } else {
          targetDate = new Date(Date.now() + 15 * 60000).toISOString();
          sessionStorage.setItem('reserva_pago_key', currentKey);
          sessionStorage.setItem('reserva_pago_limite', targetDate);
        }
        this.startCountdown(targetDate);
      }
    });
  }

  ngOnDestroy() {
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }
  }

  private startCountdown(targetDate: string) {
    if (this.countdownSub) {
      this.countdownSub.unsubscribe();
    }
    this.countdown$ = this.countdownService.getCountdown(targetDate);
    this.countdownSub = this.countdown$.subscribe((val: any) => {
      if (val && val.isExpired) {
        sessionStorage.removeItem('reserva_pago_key');
        sessionStorage.removeItem('reserva_pago_limite');
        alert('El tiempo límite para realizar el pago ha expirado. Tu reservación ha sido cancelada.');
        this.autoCancelarViaje();
      }
    });
  }

  autoCancelarViaje() {
    sessionStorage.removeItem('reserva_pago_key');
    sessionStorage.removeItem('reserva_pago_limite');
    const viajeId = this.reservaParams.viajeId;
    if (viajeId) {
      this.clienteService.cancelarViaje(Number(viajeId)).subscribe({
        next: () => this.router.navigate(['/cliente/cotizar']),
        error: () => this.router.navigate(['/cliente/cotizar'])
      });
    } else {
      this.router.navigate(['/cliente/cotizar']);
    }
  }

  onFileSelected(event: any) {
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
    if (!this.selectedFile) {
      this.error = 'Por favor, sube el comprobante de transferencia.';
      return;
    }

    this.loading = true;
    this.error = '';

    if (this.reservaParams.reintentar === 'true' || this.reservaParams.viajeId) {
      // Caso 1: Solo subir nuevo comprobante a viaje existente
      const viajeId = this.reservaParams.viajeId;
      this.reservaService.subirComprobante(viajeId, this.selectedFile!).subscribe({
        next: () => {
          sessionStorage.removeItem('reserva_pago_key');
          sessionStorage.removeItem('reserva_pago_limite');
          this.loading = false;
          this.success = true;
          setTimeout(() => {
            this.router.navigate(['/cliente/en-curso']);
          }, 3000);
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error al reintentar pago: ' + (err.error?.error || 'Desconocido');
        }
      });
    } else {
      // Caso 2: Crear reserva nueva y luego subir comprobante
      this.reservaService.crearReserva(this.reservaParams).subscribe({
        next: (res: any) => {
          const viajeId = res.viaje_id;
          this.reservaService.subirComprobante(viajeId, this.selectedFile!).subscribe({
            next: () => {
              sessionStorage.removeItem('reserva_pago_key');
              sessionStorage.removeItem('reserva_pago_limite');
              this.loading = false;
              this.success = true;
              setTimeout(() => {
                this.router.navigate(['/cliente/en-curso']);
              }, 3000);
            },
            error: (err) => {
              this.loading = false;
              this.error = 'Error al subir comprobante: ' + (err.error?.error || 'Desconocido');
            }
          });
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error al crear la reserva: ' + (err.error?.error || 'Desconocido');
        }
      });
    }
  }

  cancelarReserva() {
    const confirmacion = confirm('¿Estás seguro de que deseas cancelar esta reservación?');
    if (!confirmacion) return;

    sessionStorage.removeItem('reserva_pago_key');
    sessionStorage.removeItem('reserva_pago_limite');
    const viajeId = this.reservaParams.viajeId;
    if (viajeId) {
      this.loading = true;
      this.clienteService.cancelarViaje(Number(viajeId)).subscribe({
        next: () => {
          this.loading = false;
          this.router.navigate(['/cliente/cotizar']);
        },
        error: (err) => {
          this.loading = false;
          this.error = 'Error al cancelar la reservación: ' + (err.error?.error || 'Desconocido');
        }
      });
    } else {
      this.router.navigate(['/cliente/cotizar']);
    }
  }

  obtenerAsientosString(): string {
    if (!this.reservaParams.asientos) return '';
    try {
      const arr = JSON.parse(this.reservaParams.asientos);
      if (Array.isArray(arr) && arr.length > 0) {
        return arr.join(', ');
      }
    } catch (e) {}
    return '';
  }
}
