import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QRCodeModule } from 'angularx-qrcode';
import { FormsModule } from '@angular/forms';
import { Subscription, forkJoin } from 'rxjs';
import { ClienteService } from '../../../core/services/cliente.service';
import { SocketService } from '../../../core/services/socket.service';
import { ViajeService } from '../../../core/services/viaje.service';
import { CountdownService } from '../../../core/services/countdown.service';
import { AuthService } from '../../../core/services/auth.service';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

@Component({
  selector: 'app-mis-viajes',
  standalone: true,
  imports: [CommonModule, RouterModule, QRCodeModule, FormsModule],
  templateUrl: './mis-viajes.component.html',
  styles: [`
    .animate-fade-in-up { animation: fadeInUp 0.4s ease-out forwards; }
    .animate-fade-in-right { animation: fadeInRight 0.4s ease-out forwards; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes fadeInRight { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
    @media print {
      body * { visibility: hidden; }
      .fixed, .fixed * { visibility: visible; }
      .fixed { position: absolute; left: 0; top: 0; width: 100%; box-shadow: none !important; border: none !important; }
    }
  `]
})
export class MisViajesComponent implements OnInit, OnDestroy {
  viajes: any[] = [];
  loading = true;
  filtro = 'activos';
  
  // Modal de cancelación
  showCancelModal = false;
  cancellingId: number | null = null;
  
  // Modal de Factura
  showInvoiceModal = false;
  selectedViaje: any = null;

  // Modal de Calificación
  showRatingModal = false;
  ratingViaje: any = null;
  ratingStars = 5;
  ratingComment = '';
  ratingLoading = false;
  
  // Toast notifications
  toast: { message: string | null, type: 'success' | 'error' | 'info' | null } = { message: null, type: null };
  
  // Modal de Check-in (viajes compartidos)
  showCheckInModal = false;
  selectedCheckInReserva: any = null;

  private socketSub?: Subscription;

  constructor(
    private clienteService: ClienteService,
    private socketService: SocketService,
    private viajeService: ViajeService,
    private countdownService: CountdownService,
    private authService: AuthService
  ) {}

  ngOnInit() {
    this.cargarViajes();
    this.setupSocket();
  }

  ngOnDestroy() {
    if (this.socketSub) this.socketSub.unsubscribe();
  }

  setupSocket() {
    this.socketService.connectAndJoin();
    this.socketSub = this.socketService.listen('viaje_actualizado_cliente').subscribe(() => this.cargarViajes());
    
    this.socketService.listen('pago_actualizado').subscribe(() => this.cargarViajes());
    
    this.socketService.listen('viaje_cancelado').subscribe((data: any) => {
      this.showToast(data.mensaje || 'Un viaje ha sido cancelado', 'info');
      this.cargarViajes();
    });

    this.socketService.listen('buscando_nuevo_chofer').subscribe((data: any) => {
      this.showToast(data.mensaje || 'El chofer asignado canceló el viaje. Buscando otro conductor...', 'info');
      this.cargarViajes();
    });
  }

  cargarViajes() {
    this.loading = true;
    forkJoin({
      viajes: this.clienteService.getMisViajes(),
      reservas: this.clienteService.getMisReservas()
    }).subscribe({
      next: (res) => {
        const mappedViajes = (res.viajes || []).filter(v => (v.tipo_servicio || '').toLowerCase() !== 'encomienda').map((v: any) => {
          if (v.fecha_limite_pago) {
            v.timer$ = this.countdownService.getCountdown(v.fecha_limite_pago);
          }
          if (v.estado_pago) {
            v.estado_pago = v.estado_pago.toLowerCase();
          }
          v.isCompartido = false;
          return v;
        });

        const rawReservas = (res.reservas || []).map((r: any) => {
          const mapped: any = {
            viaje_id: r.id,
            id: r.id,
            viaje_programado_id: r.viaje_programado_id,
            origen: r.dir_origen,
            destino: r.dir_destino,
            monto: r.precio_asiento,
            fecha: r.fecha_hora_salida,
            estado_pago: r.estado_pago ? r.estado_pago.toLowerCase() : 'pendiente',
            estado_logistico: r.estado_logistico ? r.estado_logistico.toLowerCase() : 'pendiente',
            asientos: r.numero_asiento ? r.numero_asiento.toString() : '',
            punto_abordaje: r.punto_abordaje,
            pin_abordaje: r.pin_abordaje,
            comprobante_url: r.comprobante_url,
            calificacion: r.calificacion,
            isCompartido: true
          };
          if (r.fecha_limite_pago) {
            mapped.timer$ = this.countdownService.getCountdown(r.fecha_limite_pago);
          }
          return mapped;
        });

        // Agrupar reservas por viaje_programado_id (frecuencia compartida)
        const groupedReservasMap = new Map<number, any>();
        for (const r of rawReservas) {
          const vpId = r.viaje_programado_id;
          if (!groupedReservasMap.has(vpId)) {
            groupedReservasMap.set(vpId, {
              ...r,
              reservaIds: [r.id],
              asientosList: r.asientos ? [r.asientos] : []
            });
          } else {
            const existing = groupedReservasMap.get(vpId);
            existing.reservaIds.push(r.id);
            if (r.asientos) {
              existing.asientosList.push(r.asientos);
            }
            existing.monto += r.monto;
            
            // Priorizar estado: abordo > confirmado > aprobado > comprobante_subido > pendiente > rechazado > cancelado
            const statusPriority = (status: string) => {
              switch(status) {
                case 'abordo': return 6;
                case 'confirmado': return 5;
                case 'aprobado': return 4;
                case 'comprobante_subido': return 3;
                case 'pendiente': return 2;
                case 'rechazado': return 1;
                case 'cancelado': return 0;
                default: return -1;
              }
            };
            if (statusPriority(r.estado_pago) > statusPriority(existing.estado_pago)) {
              existing.estado_pago = r.estado_pago;
              existing.pin_abordaje = r.pin_abordaje;
              existing.viaje_id = r.id;
              existing.id = r.id;
              existing.timer$ = r.timer$;
              existing.comprobante_url = r.comprobante_url;
            }
            if (r.calificacion) {
              existing.calificacion = r.calificacion;
            }
            // Priorizar estado logístico también
            const logPriority = (log: string) => {
              switch(log) {
                case 'finalizado': return 3;
                case 'en_ruta': return 2;
                case 'programado': return 1;
                case 'pendiente': return 0;
                default: return -1;
              }
            };
            if (logPriority(r.estado_logistico) > logPriority(existing.estado_logistico)) {
              existing.estado_logistico = r.estado_logistico;
            }
          }
        }

        const mappedReservas = Array.from(groupedReservasMap.values()).map(r => {
          r.asientosList.sort((a: string, b: string) => Number(a) - Number(b));
          r.asientos = r.asientosList.join(', ');
          return r;
        });

        this.viajes = [...mappedViajes, ...mappedReservas];
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando historial de viajes:', err);
        this.loading = false;
      }
    });
  }

  abrirCheckIn(reserva: any) {
    this.selectedCheckInReserva = reserva;
    this.showCheckInModal = true;
  }

  cerrarCheckIn() {
    this.showCheckInModal = false;
    this.selectedCheckInReserva = null;
  }

  getViajesFiltrados() {
    let filtrados = this.viajes;
    if (this.filtro === 'pendientes') {
      filtrados = this.viajes.filter(v => v.estado_logistico === 'pendiente' || v.estado_pago === 'pendiente' || v.estado_pago === 'comprobante_subido');
    } else if (this.filtro === 'finalizados') {
      filtrados = this.viajes.filter(v => v.estado_logistico === 'finalizado' || v.estado_logistico === 'cancelado');
    } else if (this.filtro === 'activos') {
      filtrados = this.viajes.filter(v => v.estado_logistico !== 'finalizado' && v.estado_logistico !== 'cancelado');
    }
    
    return filtrados.sort((a, b) => new Date(b.fecha || b.fecha_creacion).getTime() - new Date(a.fecha || a.fecha_creacion).getTime());
  }

  getStatusColor(estado: string): string {
    switch(estado) {
      case 'pendiente': return 'bg-amber-50 text-amber-600 border border-amber-100';
      case 'comprobante_subido': return 'bg-blue-50 text-blue-600 border border-blue-100';
      case 'aprobado': 
      case 'confirmado': return 'bg-green-50 text-green-600 border border-green-100';
      case 'abordo': return 'bg-emerald-50 text-emerald-600 border border-emerald-100';
      case 'rechazado': return 'bg-red-50 text-red-600 border border-red-100';
      case 'cancelado': return 'bg-gray-50 text-gray-400 border border-gray-100';
      default: return 'bg-gray-50 text-gray-500';
    }
  }

  // Lógica de cancelación
  cancelarViaje(id: number) {
    this.cancellingId = id;
    this.showCancelModal = true;
  }

  cerrarModalCancelacion() {
    this.showCancelModal = false;
    this.cancellingId = null;
  }

  confirmarCancelacion() {
    if (!this.cancellingId) return;
    
    const id = this.cancellingId;
    this.viajeService.cancelarViaje(id).subscribe({
      next: () => {
        this.showToast('Reserva cancelada correctamente', 'success');
        this.cargarViajes();
        this.cerrarModalCancelacion();
      },
      error: (err) => {
        this.showToast(err.error?.error || 'No se pudo cancelar el viaje', 'error');
        this.cerrarModalCancelacion();
      }
    });
  }

  // Métodos de Factura
  verFactura(viaje: any) {
    this.selectedViaje = viaje;
    this.showInvoiceModal = true;
  }

  cerrarModalFactura() {
    this.showInvoiceModal = false;
    this.selectedViaje = null;
  }

  descargarPDF() {
    const element = document.getElementById('invoice-print-container');
    if (!element) return;

    html2canvas(element, {
      scale: 2,
      useCORS: true,
      backgroundColor: '#ffffff'
    }).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      // Scale receipt to fit nicely in the middle of an A4 page
      const receiptWidth = 110;
      const receiptHeight = (canvas.height * receiptWidth) / canvas.width;
      
      const x = (pdfWidth - receiptWidth) / 2;
      const y = 20; // 20mm margin from top
      
      pdf.addImage(imgData, 'PNG', x, y, receiptWidth, receiptHeight);
      
      const invoiceId = this.selectedViaje?.viaje_id || this.selectedViaje?.id || '000000';
      const filename = `factura_${invoiceId.toString().padStart(6, '0')}.pdf`;
      pdf.save(filename);
    }).catch(err => {
      console.error('Error al generar PDF:', err);
    });
  }

  compartirWhatsApp(viaje: any) {
    if (!viaje) return;
    const msg = `*Ecuavip Tour - Detalle de Viaje*%0A` +
      `---------------------------------------%0A` +
      `*Origen:* ${viaje.origen}%0A` +
      `*Destino:* ${viaje.destino}%0A` +
      `*Fecha:* ${viaje.fecha}%0A` +
      `*Chofer:* ${viaje.nombre_chofer || 'Asignando...'}%0A` +
      `*Total:* $${viaje.monto.toFixed(2)}%0A` +
      `---------------------------------------%0A` +
      `¡Gracias por viajar con nosotros! 🚘✨`;
    window.open(`https://api.whatsapp.com/send?text=${msg}`, '_blank');
  }

  // Métodos de Calificación
  calificar(viaje: any) {
    this.ratingViaje = viaje;
    this.ratingStars = 5;
    this.ratingComment = '';
    this.showRatingModal = true;
  }

  cerrarModalRating() {
    this.showRatingModal = false;
    this.ratingViaje = null;
  }

  seleccionarEstrellas(n: number) {
    this.ratingStars = n;
  }

  enviarCalificacion() {
    if (!this.ratingViaje || this.ratingStars === 0) return;
    this.ratingLoading = true;
    
    const user = this.authService.getUsuario();
    if (!user) {
      this.showToast('Usuario no autenticado', 'error');
      this.ratingLoading = false;
      return;
    }

    const datos = {
      viaje_id: this.ratingViaje.isCompartido ? undefined : (this.ratingViaje.viaje_id || this.ratingViaje.id),
      reserva_id: this.ratingViaje.isCompartido ? (this.ratingViaje.id) : undefined,
      isCompartido: this.ratingViaje.isCompartido,
      cliente_id: user.id,
      estrellas: this.ratingStars,
      comentario: this.ratingComment
    };

    this.clienteService.calificarViaje(datos).subscribe({
      next: () => {
        this.showToast('¡Gracias por tu opinión!', 'success');
        this.ratingLoading = false;
        this.showRatingModal = false;
        this.cargarViajes();
      },
      error: (err) => {
        this.showToast(err.error?.error || 'Error al enviar calificación', 'error');
        this.ratingLoading = false;
        this.showRatingModal = false;
      }
    });
  }

  showToast(message: string, type: 'success' | 'error' | 'info') {
    this.toast = { message, type };
    setTimeout(() => {
      this.toast = { message: null, type: null };
    }, 4000);
  }

  // Helper para el timer (si se usa en el HTML)
  asTimer(raw: any) {
    if (!raw) return { time: '00:00', isCritical: false };
    return raw;
  }

  canTrack(v: any): boolean {
    if (!v) return false;
    if (v.estado_logistico === 'finalizado' || v.estado_logistico === 'cancelado') return false;
    const estado = v.estado_pago?.toLowerCase();
    return estado === 'aprobado' || estado === 'confirmado' || estado === 'abordo';
  }
}
