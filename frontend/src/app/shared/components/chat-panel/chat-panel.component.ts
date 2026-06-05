import { Component, Input, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from '../../../core/services/chat.service';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-panel.component.html'
})
export class ChatPanelComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @Input() otroId!: number;
  @Input() viajeId?: number;

  mensajes: any[] = [];
  nuevoMensaje = '';
  usuario: any;
  loading = true;

  @ViewChild('scrollMe') private myScrollContainer!: ElementRef;
  private socketSub: Subscription | null = null;
  private lastMessagesLength = 0;
  isReopening = false;

  constructor(
    private chatService: ChatService,
    private socketService: SocketService,
    private authService: AuthService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['otroId'] && !changes['otroId'].firstChange) {
      this.lastMessagesLength = 0; // Reset length on change of chat
      this.reSubscribeSocket();
      this.cargarHistorial();
    }
  }

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    if (this.usuario && this.usuario.id) {
      this.usuario.id = Number(this.usuario.id);
    }
    this.lastMessagesLength = 0; // Reset length on init
    this.cargarHistorial();
    this.reSubscribeSocket();
  }

  private reSubscribeSocket() {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
      this.socketSub = null;
    }

    this.socketSub = this.socketService.listen('nuevo_mensaje').subscribe((data: any) => {
      console.log('[ChatPanel] nuevo_mensaje recibido:', data, '| otroId:', this.otroId, '| miId:', this.usuario?.id);

      const miId = this.usuario?.id;
      const otro = this.otroId;

      const involucraAMi = (data.remitente_id === miId || data.destinatario_id === miId);
      const involucraAlOtro = (data.remitente_id === otro || data.destinatario_id === otro);
      const esCanalAdmin = (this.usuario?.rol?.toLowerCase() === 'admin' && data.tipo_receptor === 'admin');
      const esDelViajeActual = this.viajeId && data.viaje_id === this.viajeId;

      console.log('[ChatPanel] Check:', { involucraAMi, involucraAlOtro, esCanalAdmin, esDelViajeActual });

      if ((involucraAMi && involucraAlOtro) || esDelViajeActual || (esCanalAdmin && involucraAlOtro)) {
        // Robust de-duplication swapping optimistic message with real message
        const yaExiste = this.mensajes.find(m => 
          m.contenido === data.contenido && 
          m.remitente_id === data.remitente_id &&
          (m.id === data.id || m.id === 0)
        );

        if (!yaExiste) {
          console.log('[ChatPanel] Agregando mensaje:', data.contenido);
          this.mensajes.push(data);
          this.processMessages();
        } else if (data.id) {
          // If message exists as optimistic (id=0), replace it with the real one from DB
          const index = this.mensajes.indexOf(yaExiste);
          this.mensajes[index] = data;
          this.processMessages();
        }
      } else {
        console.log('[ChatPanel] Mensaje descartado por filtro');
      }
    });
  }

  processMessages() {
    let lastViajeId: number | null = null;
    this.mensajes = this.mensajes.map((m) => {
      const remitente_id = m.remitente_id != null ? Number(m.remitente_id) : (m.remitente ? Number(m.remitente.id) : null);
      const destinatario_id = m.destinatario_id != null ? Number(m.destinatario_id) : (m.destinatario ? Number(m.destinatario.id) : null);
      const viaje_id = m.viaje_id != null ? Number(m.viaje_id) : (m.viaje ? Number(m.viaje.id) : null);

      const isNewTrip = viaje_id && viaje_id !== lastViajeId;
      if (viaje_id) lastViajeId = viaje_id;

      const soporteAsignado = m.soporteAsignado || (m.soporte_asignado_id ? {
        id: Number(m.soporte_asignado_id),
        nombre: m.soporte_asignado_nombre
      } : null);

      return {
        ...m,
        remitente_id,
        destinatario_id,
        viaje_id,
        isNewTrip,
        estado: m.estado || 'abierto',
        soporteAsignado
      };
    });
  }

  ngAfterViewChecked() {
    if (this.mensajes.length !== this.lastMessagesLength) {
      this.lastMessagesLength = this.mensajes.length;
      this.scrollToBottom();
    }
  }

  scrollToBottom(): void {
    try {
      if (this.myScrollContainer) {
        this.myScrollContainer.nativeElement.scrollTop = this.myScrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  ngOnDestroy() {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
  }

  cargarHistorial() {
    this.loading = true;
    this.chatService.getHistorial(this.otroId, 'admin', this.viajeId).subscribe({
      next: (res) => {
        this.lastMessagesLength = 0; // Reset length so it scrolls down
        this.mensajes = res;
        this.processMessages();
        this.loading = false;
      },
      error: (err) => {
        console.error('[ChatPanel] Error cargando historial:', err);
        this.loading = false;
      }
    });
  }

  get isResuelto(): boolean {
    if (this.mensajes.length === 0) return false;
    const ultimo = this.mensajes[this.mensajes.length - 1];
    return ultimo && (ultimo.estado === 'resuelto' || (ultimo.viaje_info && ultimo.viaje_info.estado === 'resuelto'));
  }

  get isClienteYResuelto(): boolean {
    const esCliente = this.usuario?.rol?.toLowerCase() !== 'admin';
    return esCliente && this.isResuelto && !this.isReopening;
  }

  iniciarNuevoChat() {
    this.isReopening = true;
    this.nuevoMensaje = '';
  }

  enviar() {
    if (!this.nuevoMensaje.trim()) return;

    this.isReopening = false; // Reset reopening state

    const payload = {
      viaje_id: this.viajeId || null,
      remitente_id: this.usuario.id,
      destinatario_id: this.otroId,
      tipo_receptor: 'admin',
      contenido: this.nuevoMensaje.trim()
    };

    // Optimistic Update: Mostrar el mensaje de inmediato en la UI
    const msjOptimista = {
      ...payload,
      id: 0,
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0]
    };
    this.mensajes.push(msjOptimista);
    this.processMessages();

    console.log('[ChatPanel] Enviando mensaje:', payload);
    this.socketService.emit('enviar_mensaje', payload);
    this.nuevoMensaje = '';
  }
}
