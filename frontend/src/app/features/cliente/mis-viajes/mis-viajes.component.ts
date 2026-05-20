import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { QRCodeModule } from 'angularx-qrcode';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ClienteService } from '../../../core/services/cliente.service';
import { SocketService } from '../../../core/services/socket.service';
import { ViajeService } from '../../../core/services/viaje.service';

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
  
  private socketSub?: Subscription;

  constructor(
    private clienteService: ClienteService,
    private socketService: SocketService,
    private viajeService: ViajeService
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
    this.socketSub = this.socketService.listen('viaje_actualizado').subscribe(() => this.cargarViajes());
    
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
    this.clienteService.getMisViajes().subscribe({
      next: (res) => {
        this.viajes = (res || []).filter(v => (v.tipo_servicio || '').toLowerCase() !== 'encomienda');
        this.loading = false;
      },
      error: () => this.loading = false
    });
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
      case 'aprobado': return 'bg-green-50 text-green-600 border border-green-100';
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
    window.print();
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
    
    const userStr = localStorage.getItem('usuario');
    const user = userStr ? JSON.parse(userStr) : null;
    if (!user) {
      this.showToast('Usuario no autenticado', 'error');
      this.ratingLoading = false;
      return;
    }

    const datos = {
      viaje_id: this.ratingViaje.viaje_id || this.ratingViaje.id,
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
}
