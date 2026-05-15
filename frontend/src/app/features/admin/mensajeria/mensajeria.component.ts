import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { SocketService } from '../../../core/services/socket.service';
import { ChatPanelComponent } from '../../../shared/components/chat-panel/chat-panel.component';
import { QRCodeModule } from 'angularx-qrcode';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-mensajeria',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatPanelComponent, QRCodeModule],
  templateUrl: './mensajeria.component.html'
})
export class MensajeriaComponent implements OnInit, OnDestroy {
  inbox: any[] = [];
  selectedClienteId: number | null = null;
  selectedChat: any = null; // Toda la info del inbox seleccionado
  loading = true;

  // Modal State
  showModal = false;
  isRejecting = false;
  motivoRechazo = '';
  processingId: number | null = null;
  qrHashGenerado: string | null = null;

  private socketSub: Subscription | null = null;

  constructor(
    private adminService: AdminService,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarInbox();
    this.socketService.connectAndJoin();

    // Suscribirse a mensajes nuevos para recargar el inbox y subir el chat a la cima
    this.socketSub = this.socketService.listen('nuevo_mensaje').subscribe((msg: any) => {
      this.cargarInbox(false); // Refrescar lista de la izquierda
    });

    // Leer el viajeId de la URL si se entró desde "Validación Pagos"
    this.route.queryParams.subscribe(params => {
      if (params['viajeId']) {
        const vId = Number(params['viajeId']);
        this.seleccionarChat(vId);
      }
    });
  }

  ngOnDestroy() {
    if (this.socketSub) this.socketSub.unsubscribe();
  }

  cargarInbox(showLoading = true) {
    if (showLoading) this.loading = true;
    this.adminService.getInbox().subscribe({
      next: (res) => {
        this.inbox = res;
        this.loading = false;
        // Calcular total unread para el navbar (Contar CHATS con mensajes, no total de mensajes)
        const chatsConUnread = this.inbox.filter(chat => (chat.unread || 0) > 0).length;
        this.adminService.updateUnreadCount(chatsConUnread);

        // Si ya hay un seleccionado, actualizar su info
        if (this.selectedClienteId) {
          this.selectedChat = this.inbox.find(c => c.cliente_id === this.selectedClienteId) || this.selectedChat;
          this.marcarLeido(this.selectedClienteId);
        }
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  seleccionarChat(clienteId: number) {
    this.selectedClienteId = clienteId;
    if (this.inbox.length > 0) {
      this.selectedChat = this.inbox.find(c => c.cliente_id === clienteId);
      this.marcarLeido(clienteId);
      this.router.navigate([], { queryParams: { clienteId }, queryParamsHandling: 'merge' });
    }
  }

  marcarLeido(clienteId: number) {
    const chat = this.inbox.find(c => c.cliente_id === clienteId);
    if (chat && chat.unread > 0) {
      chat.unread = 0;
      const chatsConUnread = this.inbox.filter(c => (c.unread || 0) > 0).length;
      this.adminService.updateUnreadCount(chatsConUnread);
      this.adminService.markAsRead(clienteId).subscribe();
    }
  }

  // ---- Acciones Contextuales ----
  
  verComprobante() {
    this.showModal = true;
    this.isRejecting = false;
    this.motivoRechazo = '';
    this.qrHashGenerado = null;
  }

  cerrarModal() {
    this.showModal = false;
  }

  iniciarRechazo() {
    this.isRejecting = true;
    this.showModal = true;
  }

  aprobarPago() {
    if (!this.selectedChat || !this.selectedChat.pago_id) return;
    this.processingId = this.selectedChat.pago_id;
    
    this.adminService.aprobarPago(this.selectedChat.pago_id).subscribe({
      next: (res) => {
        this.qrHashGenerado = res.hash;
        this.processingId = null;
        this.cargarInbox(false); // Refrescar estado
        this.showModal = true; // Mostrar modal de éxito
        setTimeout(() => this.cerrarModal(), 5000);
      },
      error: (err) => {
        alert('Error al aprobar: ' + (err.error?.error || 'Desconocido'));
        this.processingId = null;
      }
    });
  }

  rechazar() {
    if (!this.selectedChat || !this.selectedChat.pago_id || !this.motivoRechazo.trim()) return;
    this.processingId = this.selectedChat.pago_id;

    this.adminService.rechazarPago(this.selectedChat.pago_id, this.motivoRechazo).subscribe({
      next: (res) => {
        this.cerrarModal();
        this.processingId = null;
        this.cargarInbox(false); // Refrescar estado
      },
      error: (err) => {
        alert('Error al rechazar: ' + (err.error?.error || 'Desconocido'));
        this.processingId = null;
      }
    });
  }
}
