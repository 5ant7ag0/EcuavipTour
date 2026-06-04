import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { environment } from '../environments/environment';
import { SocketService } from './core/services/socket.service';
import { AuthService } from './core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Ecuavip Tour';
  toast: string | null = null;
  private socketSub?: Subscription;

  constructor(
    private socketService: SocketService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadGoogleMapsScript();
    this.socketService.connectAndJoin(); // Connect immediately if user is already authenticated
    this.setupGlobalNotifications();
  }

  ngOnDestroy() {
    if (this.socketSub) {
      this.socketSub.unsubscribe();
    }
  }

  private setupGlobalNotifications() {
    this.socketSub = this.socketService.listen('nuevo_mensaje').subscribe((data: any) => {
      const usuario = this.authService.getUsuario();
      if (!usuario) return;

      const isMyMessage = Number(data.remitente_id) === Number(usuario.id);

      // Trigger global notification ONLY if it's not sent by current user AND chat window is closed
      if (!isMyMessage && !this.socketService.isChatActive) {
        this.socketService.unreadMessages++; // PERSIST IN SINGLETON SERVICE!
        
        let remitente = 'Soporte Ecuavip';
        if (data.tipo_receptor === 'chofer') {
          // If receiver is a driver, the sender is a client/passenger
          remitente = 'Pasajero';
        } else if (data.tipo_receptor === 'admin') {
          // Support admin writing to client
          remitente = 'Soporte Admin';
        }
        
        this.showToast(`Nuevo mensaje de ${remitente}: "${data.contenido}"`);
      }
    });
  }

  onToastClick() {
    this.toast = null; // hide toast
    const usuario = this.authService.getUsuario();
    if (!usuario) return;

    this.socketService.openChatOnLoad = true;
    this.socketService.unreadMessages = 0; // Clear unread messages

    if (usuario.rol === 'chofer') {
      this.router.navigate(['/chofer/dashboard']).then(() => {
        this.socketService.triggerChatOpen.next(); // Trigger instant open
      });
    } else {
      this.router.navigate(['/cliente/en-curso']).then(() => {
        this.socketService.triggerChatOpen.next(); // Trigger instant open
      });
    }
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = null, 5000);
  }

  private loadGoogleMapsScript() {
    if (typeof google !== 'undefined') return;

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${environment.googleMapsApiKey}&libraries=places,geometry`;
    script.async = true;
    script.defer = true;
    document.head.appendChild(script);
  }
}
