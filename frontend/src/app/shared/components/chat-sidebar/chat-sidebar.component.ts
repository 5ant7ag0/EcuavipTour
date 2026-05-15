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
  @Input() tituloCabecera: string = 'Soporte Ecuavip';
  
  @Output() closed = new EventEmitter<void>();
  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  nuevoMensaje = '';
  mensajes: Mensaje[] = [];
  miId: number = 0;
  miRol: string = '';
  respuestasRapidas: string[] = [];
  private socketSub?: Subscription;

  constructor(
    private socketService: SocketService,
    private authService: AuthService,
    private chatService: ChatService
  ) {}

  ngOnInit(): void {
    const usuario = this.authService.getUsuario();
    if (usuario) {
      this.miId = usuario.id;
      this.miRol = usuario.rol;
      this.configurarRespuestasRapidas();
    }
    this.socketService.connectAndJoin();
    
    this.socketSub = this.socketService.listen('nuevo_mensaje').subscribe((msj: Mensaje) => {
      const esParaEsteChat = 
        (this.tipoReceptor === 'chofer' && msj.viaje_id === this.viajeId) || 
        (this.tipoReceptor === 'admin' && msj.tipo_receptor === 'admin') ||
        (msj.tipo_receptor === this.tipoReceptor);
        
      if (esParaEsteChat) {
        // De-duplicación: comparar contenido y remitente si el timestamp es muy cercano
        const yaExiste = this.mensajes.find(m => 
          m.contenido === msj.contenido && 
          m.remitente_id === msj.remitente_id &&
          (m.id === msj.id || m.id === 0) // Si el ID es 0 es el optimista
        );
        
        if (!yaExiste) {
          this.mensajes.push(msj);
        } else if (msj.id) {
          // Si ya existe pero el nuevo tiene ID real (el del socket), actualizamos el optimista
          const index = this.mensajes.indexOf(yaExiste);
          this.mensajes[index] = msj;
        }
      }
    });

    this.cargarHistorial();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['viajeId'] && !changes['viajeId'].firstChange) || 
        (changes['destinatarioId'] && !changes['destinatarioId'].firstChange)) {
      this.cargarHistorial();
    }
  }

  ngOnDestroy(): void {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
  }

  ngAfterViewChecked(): void {
    this.scrollToBottom();
  }

  close(): void {
    this.isOpen = false;
    this.closed.emit();
  }

  enviarMensaje(): void {
    if (!this.nuevoMensaje.trim()) return;

    const mensaje: Mensaje = {
      viaje_id: this.viajeId,
      remitente_id: this.miId,
      destinatario_id: this.destinatarioId,
      tipo_receptor: this.tipoReceptor,
      contenido: this.nuevoMensaje.trim()
    };

    const msjOptimista: Mensaje = {
      ...mensaje,
      id: 0, // ID temporal para de-duplicación
      timestamp: new Date().toISOString().replace('T', ' ').split('.')[0] 
    };
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
    let idParaBuscar = this.destinatarioId || this.miId;
    
    this.chatService.getHistorial(idParaBuscar, this.tipoReceptor, this.viajeId).subscribe({
      next: (historial) => {
        this.mensajes = historial;
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
}
