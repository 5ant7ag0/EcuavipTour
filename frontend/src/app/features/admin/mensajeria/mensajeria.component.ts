import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { AdminService } from '../../../core/services/admin.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
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

  // Helpdesk State
  activeTab: 'unassigned' | 'my-chats' | 'history' = 'unassigned';
  categoriasSoporte: string[] = ['Problema con el pago', 'Duda de ruta', 'Reclamo', 'Soporte General', 'Otro'];
  selectedCategory: string = 'Soporte General';

  // Modal State
  showModal = false;
  showResolveConfirmModal = false;
  isRejecting = false;
  motivoRechazo = '';
  processingId: number | null = null;
  qrHashGenerado: string | null = null;

  private socketSub: Subscription | null = null;
  private errorMsgSub: Subscription | null = null;
  private supportAssignSub: Subscription | null = null;
  private caseResolveSub: Subscription | null = null;

  constructor(
    private adminService: AdminService,
    private socketService: SocketService,
    private route: ActivatedRoute,
    private router: Router,
    public authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.cargarInbox();
    this.socketService.connectAndJoin();

    // Suscribirse a mensajes nuevos para recargar el inbox y subir el chat a la cima
    this.socketSub = this.socketService.listen('nuevo_mensaje').subscribe((msg: any) => {
      this.cargarInbox(false); // Refrescar lista de la izquierda
    });

    // Escuchar alertas de colisión de soporte
    this.errorMsgSub = this.socketService.listen('error_mensaje').subscribe((data: any) => {
      alert('⚠️ Conflicto de Soporte: ' + data.error);
    });

    // Escuchar cuando un soporte es asignado en tiempo real
    this.supportAssignSub = this.socketService.listen('soporte_asignado').subscribe((data: any) => {
      console.log('[Mensajeria] soporte_asignado recibido:', data);
      this.cargarInbox(false); // Recargar inbox para refrescar listado y tabs
      if (this.selectedClienteId === Number(data.cliente_id) && this.selectedChat) {
        this.selectedChat.soporte_asignado_id = data.soporte_asignado_id;
        this.selectedChat.soporte_asignado_nombre = data.soporte_asignado_nombre;
        this.selectedChat.soporte_asignado_avatar = data.soporte_asignado_avatar;
        this.selectedChat.categoria = data.categoria;
      }
    });

    // Escuchar cuando un caso es resuelto en tiempo real
    this.caseResolveSub = this.socketService.listen('caso_resuelto').subscribe((data: any) => {
      console.log('[Mensajeria] caso_resuelto recibido:', data);
      this.cargarInbox(false); // Recargar inbox para refrescar listado y tabs
      if (this.selectedClienteId === Number(data.cliente_id)) {
        this.selectedClienteId = null;
        this.selectedChat = null;
        this.router.navigate([], { queryParams: { clienteId: null, viajeId: null } });
      }
    });

    // Leer el viajeId de la URL si se entró desde "Validación Pagos"
    this.route.queryParams.subscribe(params => {
      this.resolveSelectedChatFromParams(params);
    });
  }

  ngOnDestroy() {
    if (this.socketSub) this.socketSub.unsubscribe();
    if (this.errorMsgSub) this.errorMsgSub.unsubscribe();
    if (this.supportAssignSub) this.supportAssignSub.unsubscribe();
    if (this.caseResolveSub) this.caseResolveSub.unsubscribe();
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

  cambiarTab(tab: 'unassigned' | 'my-chats' | 'history') {
    this.activeTab = tab;
    this.selectedClienteId = null;
    this.selectedChat = null;
    this.router.navigate([], { queryParams: { clienteId: null, viajeId: null } });
  }

  get filteredInbox(): any[] {
    const currentUserId = this.authService.getUsuario()?.id;
    if (this.activeTab === 'unassigned') {
      return this.inbox.filter(c => c.estado !== 'resuelto' && !c.soporte_asignado_id);
    } else if (this.activeTab === 'my-chats') {
      return this.inbox.filter(c => c.estado !== 'resuelto' && c.soporte_asignado_id == currentUserId);
    } else {
      return this.inbox.filter(c => c.estado === 'resuelto');
    }
  }

  resolveSelectedChatFromParams(params: any) {
    if (this.inbox.length === 0) return;

    let chat: any = null;

    if (params['viajeId']) {
      const vId = Number(params['viajeId']);
      // 1. Intentar buscar por viaje_id (comparación flexible)
      chat = this.inbox.find(c => c.viaje_id == vId);
    }

    // 2. Si no se encontró por viaje_id, intentar por clienteId
    if (!chat && params['clienteId']) {
      const cId = Number(params['clienteId']);
      chat = this.inbox.find(c => c.cliente_id == cId);
    }

    if (chat) {
      this.selectedClienteId = chat.cliente_id;
      this.selectedChat = chat;
      this.marcarLeido(chat.cliente_id);
      
      // Auto-selección lógica de la pestaña según el estado y asignación
      if (chat.estado === 'resuelto') {
        this.activeTab = 'history';
      } else {
        const currentUserId = this.authService.getUsuario()?.id;
        if (chat.soporte_asignado_id == currentUserId) {
          this.activeTab = 'my-chats';
        } else {
          this.activeTab = 'unassigned';
        }
      }
    } else if (params['clienteId']) {
      // 3. Fallback: si no está en la bandeja aún, permitir abrir chat directo con el cliente
      const cId = Number(params['clienteId']);
      this.selectedClienteId = cId;
      this.selectedChat = {
        cliente_id: cId,
        cliente_nombre: 'Cliente',
        viaje_id: params['viajeId'] ? Number(params['viajeId']) : null,
        estado: 'abierto'
      };
    } else {
      this.selectedClienteId = null;
      this.selectedChat = null;
    }
  }

  seleccionarChat(clienteId: number) {
    // Al seleccionar manualmente un chat del inbox, limpiamos viajeId para no causar interferencias
    this.router.navigate([], { queryParams: { clienteId, viajeId: null } });
  }

  atenderCaso(clienteId: number) {
    this.chatService.assignSupport(clienteId, this.selectedCategory).subscribe({
      next: (res) => {
        this.cargarInbox(false); // Refrescar inbox
        
        // Actualizar UI del chat activo localmente de inmediato
        if (this.selectedChat && this.selectedChat.cliente_id === clienteId) {
          const userObj = this.authService.getUsuario();
          this.selectedChat.soporte_asignado_id = userObj.id;
          this.selectedChat.soporte_asignado_nombre = userObj.nombre;
          this.selectedChat.soporte_asignado_avatar = userObj.foto_perfil_url || '';
          this.selectedChat.categoria = this.selectedCategory;
        }

        // Pasar automáticamente a chats asignados
        this.activeTab = 'my-chats';
      },
      error: (err) => {
        alert('⚠️ ' + (err.error?.error || 'No se pudo asignar el caso.'));
      }
    });
  }

  resolverCaso(clienteId: number) {
    this.showResolveConfirmModal = true;
  }

  confirmarResolverCaso() {
    if (!this.selectedChat) return;
    const clienteId = this.selectedChat.cliente_id;
    this.showResolveConfirmModal = false;

    this.chatService.resolveCase(clienteId).subscribe({
      next: () => {
        this.cargarInbox(false); // Recargar bandeja
        // Limpiar el chat activo de inmediato
        this.selectedClienteId = null;
        this.selectedChat = null;
        this.router.navigate([], { queryParams: { clienteId: null, viajeId: null } });
      },
      error: (err) => {
        alert('⚠️ No se pudo resolver el caso: ' + (err.error?.error || 'Error desconocido'));
      }
    });
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
