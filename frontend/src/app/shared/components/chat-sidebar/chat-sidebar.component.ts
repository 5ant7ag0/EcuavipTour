import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { ChatService } from '../../../core/services/chat.service';
import { Mensaje } from '../../../interfaces/models/mensaje.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chat-sidebar',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './chat-sidebar.component.html',
  styleUrls: ['./chat-sidebar.component.css']
})
export class ChatSidebarComponent implements OnInit, OnChanges, OnDestroy, AfterViewChecked {
  @Input() isOpen: boolean = false;
  @Input() tipoReceptor: 'admin' | 'chofer' = 'admin';
  @Input() viajeId: number | undefined;
  @Input() destinatarioId: number | undefined;
  @Input() tituloCabecera: string = 'Soporte EcuavipTour';
  @Input() fotoPerfilUrl: string | undefined;
  
  @Output() closed = new EventEmitter<void>();
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  nuevoMensaje = '';
  mensajes: any[] = [];
  miId: number = 0;
  miRol: string = '';
  respuestasRapidas: string[] = [];
  private socketSubs: Subscription[] = [];
  private lastMessagesLength = 0;
  isReopening = false;

  get isResuelto(): boolean {
    if (this.mensajes.length === 0) return false;
    const ultimo = this.mensajes[this.mensajes.length - 1];
    return ultimo && (ultimo.estado === 'resuelto' || (ultimo.viaje_info && ultimo.viaje_info.estado === 'resuelto'));
  }

  get soporteAsignado(): any {
    if (this.isResuelto) {
      for (let i = this.mensajes.length - 1; i >= 0; i--) {
        const m = this.mensajes[i];
        if (m && m.soporteAsignado) {
          return m.soporteAsignado;
        }
      }
      return null;
    }
    // Si está abierto, solo consideramos los agentes asignados a mensajes activos (no resueltos)
    for (let i = this.mensajes.length - 1; i >= 0; i--) {
      const m = this.mensajes[i];
      if (m && m.estado !== 'resuelto') {
        if (m.soporteAsignado) {
          return m.soporteAsignado;
        }
      }
    }
    return null;
  }

  get estadoCaso(): 'esperando' | 'asignado' | 'resuelto' {
    if (this.isResuelto) return 'resuelto';
    return this.soporteAsignado ? 'asignado' : 'esperando';
  }

  get isClienteYResuelto(): boolean {
    const esCliente = this.miRol?.toLowerCase() !== 'admin';
    return esCliente && this.isResuelto && !this.isReopening;
  }

  iniciarNuevoChat() {
    this.isReopening = true;
    this.nuevoMensaje = '';
  }

  constructor(
    private socketService: SocketService,
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  processMessage(m: any): any {
    const remitente_id = m.remitente_id != null ? Number(m.remitente_id) : (m.remitente ? Number(m.remitente.id) : null);
    const destinatario_id = m.destinatario_id != null ? Number(m.destinatario_id) : (m.destinatario ? Number(m.destinatario.id) : null);
    const viaje_id = m.viaje_id != null ? Number(m.viaje_id) : (m.viaje ? Number(m.viaje.id) : null);
    return {
      ...m,
      remitente_id,
      destinatario_id,
      viaje_id
    };
  }

  ngOnInit(): void {
    this.updateSocketChatState();
    const usuario = this.authService.getUsuario();
    if (usuario) {
      this.miId = Number(usuario.id);
      this.miRol = usuario.rol;
      this.configurarRespuestasRapidas();
    }
    this.socketService.connectAndJoin();
    
    const sub1 = this.socketService.listen('nuevo_mensaje').subscribe((msj: any) => {
      const processed = this.processMessage(msj);
      const esParaEsteChat = 
        (this.tipoReceptor === 'chofer' && processed.viaje_id === this.viajeId) || 
        (this.tipoReceptor === 'admin' && processed.tipo_receptor === 'admin') ||
        (processed.tipo_receptor === this.tipoReceptor);
        
      if (esParaEsteChat) {
        const yaExiste = this.mensajes.find(m => 
          m.contenido === processed.contenido && 
          m.remitente_id === processed.remitente_id &&
          (m.id === processed.id || m.id === 0)
        );
        
        if (!yaExiste) {
          this.mensajes.push(processed);
        } else if (processed.id) {
          const index = this.mensajes.indexOf(yaExiste);
          this.mensajes[index] = processed;
        }
      }
    });
    this.socketSubs.push(sub1);

    const sub2 = this.socketService.listen('soporte_asignado').subscribe((data: any) => {
      console.log('[ChatSidebar] soporte_asignado recibido:', data);
      if (Number(data.cliente_id) === this.miId) {
        this.mensajes = this.mensajes.map(m => ({
          ...m,
          soporteAsignado: {
            id: data.soporte_asignado_id,
            nombre: data.soporte_asignado_nombre,
            fotoPerfilUrl: data.soporte_asignado_avatar
          },
          categoria: data.categoria
        }));
      }
    });
    this.socketSubs.push(sub2);

    const sub3 = this.socketService.listen('caso_resuelto').subscribe((data: any) => {
      console.log('[ChatSidebar] caso_resuelto recibido:', data);
      if (Number(data.cliente_id) === this.miId) {
        this.mensajes = this.mensajes.map(m => ({
          ...m,
          estado: 'resuelto'
        }));
      }
    });
    this.socketSubs.push(sub3);

    this.cargarHistorial();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      this.updateSocketChatState();
      if (this.isOpen) {
        this.cargarHistorial();
      }
    }
    if (changes['viajeId'] || changes['destinatarioId']) {
      if (this.isOpen) {
        this.lastMessagesLength = 0; // Reset length so it scrolls to bottom
        this.cargarHistorial();
      }
    }
  }

  ngOnDestroy(): void {
    this.socketService.isChatActive = false;
    this.socketSubs.forEach(s => s.unsubscribe());
  }

  ngAfterViewChecked(): void {
    if (this.mensajes.length !== this.lastMessagesLength) {
      this.lastMessagesLength = this.mensajes.length;
      this.scrollToBottom();
    }
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim()) return;

    this.isReopening = false; // Reset reopening state

    const mensaje: Mensaje = {
      viaje_id: this.viajeId,
      remitente_id: this.miId,
      destinatario_id: this.destinatarioId,
      tipo_receptor: this.tipoReceptor,
      contenido: this.nuevoMensaje.trim()
    };

    const msjOptimista = this.processMessage({
      ...mensaje,
      id: 0,
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0] 
    });
    this.mensajes.push(msjOptimista);

    this.socketService.emit('enviar_mensaje', mensaje);
    this.nuevoMensaje = '';
  }

  configurarRespuestasRapidas(): void {
    if (this.tipoReceptor === 'admin') {
      this.respuestasRapidas = ['Hola, necesito ayuda', 'Problema con el pago', 'Cancelar viaje'];
    } else {
      // Chat Chofer-Cliente
      if (this.miRol === 'chofer') {
        this.respuestasRapidas = ['¡Hola!', 'Llego enseguida', 'Estoy en tráfico', 'Ya llegué', '¿Dónde se encuentra?'];
      } else {
        this.respuestasRapidas = ['¡Hola!', 'Salgo enseguida', 'Salgo en 5 mn', 'Ya bajo', 'Estoy afuera'];
      }
    }
  }

  enviarRespuestaRapida(respuesta: string): void {
    this.nuevoMensaje = respuesta;
    this.enviarMensaje();
  }

  private cargarHistorial(): void {
    this.mensajes = []; // Clear existing messages immediately to avoid showing stale state
    
    if (this.tipoReceptor === 'chofer' && !this.viajeId) {
      // Do not load history if driver chat is requested but trip details aren't ready yet
      return;
    }
    
    let idParaBuscar = this.destinatarioId || this.miId;
    this.lastMessagesLength = 0; // Reset length on manual load
    
    this.chatService.getHistorial(idParaBuscar, this.tipoReceptor, this.viajeId).subscribe({
      next: (historial) => {
        this.mensajes = historial.map((m: any) => this.processMessage(m));
      },
      error: (err) => console.error('Error cargando historial', err)
    });
  }

  private scrollToBottom(): void {
    try {
      if (this.scrollContainer) {
        this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
      }
    } catch(err) { }
  }

  updateSocketChatState(): void {
    this.socketService.isChatActive = this.isOpen;
  }
}
