import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { SocketService } from '../../../core/services/socket.service';
import { QRCodeModule } from 'angularx-qrcode';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-validacion-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeModule],
  templateUrl: './validacion-pagos.component.html'
})
export class ValidacionPagosComponent implements OnInit, OnDestroy {
  pagos: any[] = [];
  loading = true;
  error = '';
  
  // Tabs State
  currentTab: 'pendientes' | 'aprobados' | 'rechazados' = 'pendientes';
  
  // Modal State
  selectedPago: any = null;
  showModal = false;
  isRejecting = false;
  motivoRechazo = '';
  processingId: number | null = null;
  
  // Reactividad
  toast: { message: string, type: 'success' | 'error' | 'info' | null } = { message: '', type: null };
  private toastTimeout: any;
  
  // Success state
  qrHashGenerado: string | null = null;

  private socketSub: Subscription | null = null;

  constructor(
    private adminService: AdminService, 
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarPagos();
    this.setupSockets();
  }

  setupSockets() {
    // Auto-recargar si el admin está en esta pantalla
    this.socketSub = this.socketService.listen('nuevo_comprobante').subscribe((data) => {
      this.showToast('¡Nuevo comprobante recibido!', 'info');
      if (this.currentTab === 'pendientes') {
        this.cargarPagos(false);
      }
    });

    this.socketService.listen('pago_actualizado').subscribe(() => {
      setTimeout(() => this.cargarPagos(false), 300);
    });
  }

  showToast(message: string, type: 'success' | 'error' | 'info') {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toast = { message, type };
    this.toastTimeout = setTimeout(() => this.toast = { message: '', type: null }, 4000);
  }

  ngOnDestroy() {
    if (this.socketSub) this.socketSub.unsubscribe();
  }

  setTab(tab: 'pendientes' | 'aprobados' | 'rechazados') {
    this.currentTab = tab;
    this.cargarPagos();
  }

  cargarPagos(showLoading = true) {
    if (showLoading) this.loading = true;
    this.adminService.getPagos(this.currentTab).subscribe({
      next: (res) => {
        this.pagos = res;
        this.loading = false;

        // Si el modal está abierto, actualizamos la referencia de selectedPago para que refleje el nuevo comprobante
        if (this.selectedPago) {
          const updatedPago = this.pagos.find(
            p => p.pago_id === this.selectedPago.pago_id || p.viaje_id === this.selectedPago.viaje_id
          );
          if (updatedPago) {
            this.selectedPago = updatedPago;
          }
        }
      },
      error: (err) => {
        this.error = 'No se pudieron cargar los pagos.';
        this.loading = false;
      }
    });
  }

  abrirChat(viajeId: number, clienteId: number) {
    this.router.navigate(['/admin/mensajeria'], { queryParams: { viajeId, clienteId } });
  }

  verComprobante(pago: any) {
    this.selectedPago = pago;
    this.showModal = true;
    this.isRejecting = false;
    this.motivoRechazo = '';
    this.qrHashGenerado = null;
  }

  cerrarModal() {
    this.showModal = false;
    this.selectedPago = null;
  }

  iniciarRechazo() {
    this.isRejecting = true;
  }

  aprobar() {
    if (!this.selectedPago) return;
    this.processingId = this.selectedPago.pago_id;
    
    this.adminService.aprobarPago(this.selectedPago.pago_id).subscribe({
      next: (res) => {
        this.qrHashGenerado = res.hash;
        this.removerPagoLocal(this.selectedPago.pago_id);
        this.processingId = null;
        this.showToast('Pago aprobado exitosamente', 'success');
        // Mantenemos el modal abierto un par de segundos para mostrar el QR
        setTimeout(() => this.cerrarModal(), 5000);
      },
      error: (err) => {
        this.showToast(err.error?.error || 'Error al aprobar', 'error');
        this.processingId = null;
      }
    });
  }

  removerPagoLocal(id: number) {
    this.pagos = this.pagos.filter(p => p.pago_id !== id);
    if (this.currentTab === 'pendientes') {
      this.adminService.updatePendingCount(this.pagos.length);
    }
  }

  rechazar() {
    if (!this.selectedPago || !this.motivoRechazo.trim()) return;
    this.processingId = this.selectedPago.pago_id;

    this.adminService.rechazarPago(this.selectedPago.pago_id, this.motivoRechazo).subscribe({
      next: (res) => {
        this.pagos = this.pagos.filter(p => p.pago_id !== this.selectedPago.pago_id);
        if (this.currentTab === 'pendientes') {
          this.adminService.updatePendingCount(this.pagos.length);
        }
        this.cerrarModal();
        this.processingId = null;
      },
      error: (err) => {
        alert('Error al rechazar: ' + (err.error?.error || 'Desconocido'));
        this.processingId = null;
      }
    });
  }
}
