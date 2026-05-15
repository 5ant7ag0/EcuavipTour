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

  constructor(
    private chatService: ChatService,
    private socketService: SocketService,
    private authService: AuthService
  ) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['otroId'] && !changes['otroId'].firstChange) {
      this.reSubscribeSocket();
      this.cargarHistorial();
    }
  }

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
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
        const existe = this.mensajes.find(m => (m.id && m.id === data.id) || (m.contenido === data.contenido && m.timestamp === data.timestamp));
        if (!existe) {
          console.log('[ChatPanel] Agregando mensaje:', data.contenido);
          this.mensajes.push(data);
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
      const isNewTrip = m.viaje_id && m.viaje_id !== lastViajeId;
      if (m.viaje_id) lastViajeId = m.viaje_id;
      return { ...m, isNewTrip };
    });
  }

  ngAfterViewChecked() {
    this.scrollToBottom();
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
    this.chatService.getHistorial(this.otroId).subscribe({
      next: (res) => {
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

  enviar() {
    if (!this.nuevoMensaje.trim()) return;

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
