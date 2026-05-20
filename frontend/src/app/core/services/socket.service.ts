import { Injectable, NgZone } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket;
  private serverUrl = 'http://localhost:5001';

  constructor(
    private authService: AuthService,
    private ngZone: NgZone
  ) {
    this.socket = io(this.serverUrl, {
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    // Re-unirse a la sala automáticamente en cada reconexión
    this.socket.on('connect', () => {
      console.log('[Socket] Conectado:', this.socket.id);
      this.joinRoom();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Desconectado:', reason);
    });
  }

  private joinRoom() {
    const usuario = this.authService.getUsuario();
    if (!usuario) return;

    console.log('[Socket] Uniéndose a sala → rol:', usuario.rol, '| id:', usuario.id);
    this.socket.emit('join', {
      role: usuario.rol,
      user_id: usuario.id
    });
  }

  connectAndJoin() {
    if (!this.socket.connected) {
      this.socket.connect(); // El evento 'connect' disparará joinRoom automáticamente
    } else {
      this.joinRoom(); // Ya conectado, unirse directamente
    }
  }

  disconnect() {
    if (this.socket.connected) {
      this.socket.disconnect();
    }
  }

  listen(eventName: string): Observable<any> {
    return new Observable((subscriber) => {
      const handler = (data: any) => {
        this.ngZone.run(() => {
          subscriber.next(data);
        });
      };
      this.socket.on(eventName, handler);

      // Cleanup al desuscribirse
      return () => {
        this.socket.off(eventName, handler);
      };
    });
  }

  emit(eventName: string, data: any) {
    if (this.socket.connected) {
      this.socket.emit(eventName, data);
    } else {
      console.warn('[Socket] Intento de emit sin conexión. Evento:', eventName);
    }
  }
}
