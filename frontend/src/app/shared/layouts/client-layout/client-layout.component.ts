import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ClientNavbarComponent } from '../../components/client-navbar/client-navbar.component';
import { AuthModalComponent } from '../../../features/auth/auth-modal/auth-modal.component';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ClientNavbarComponent, AuthModalComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col relative">
      <!-- Navbar global para cliente -->
      <app-client-navbar (onLoginRequest)="showAuthModal = true"></app-client-navbar>

      <!-- Espaciador para el navbar desktop (header fijo de 80px) -->
      <div class="hidden md:block h-20 w-full"></div>

      <!-- TOAST NOTIFICATION GLOBAL -->
      <div *ngIf="toast" class="fixed top-24 left-1/2 -translate-x-1/2 z-[10002] w-[92%] max-w-lg transition-all duration-500 ease-out transform">
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-blue-500/20 flex items-center gap-4 border border-blue-400/25 relative overflow-hidden backdrop-blur-md animate-in slide-in-from-top-12 duration-500">
          <!-- Glow effect -->
          <div class="absolute -right-10 -top-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
          </div>
          <div>
            <span class="text-[8px] font-black uppercase tracking-[0.2em] text-blue-100 block mb-0.5">Notificación en tiempo real</span>
            <p class="text-xs font-black leading-snug text-white">{{ toast }}</p>
          </div>
        </div>
      </div>

      <!-- Contenido principal -->
      <main class="flex-1" [ngClass]="isCotizarPage() ? '' : 'pb-24 md:pb-8'">
        <router-outlet></router-outlet>
      </main>

      <!-- Modal de Autenticación Global -->
      <app-auth-modal 
        *ngIf="showAuthModal" 
        (onClose)="showAuthModal = false" 
        (onSuccess)="handleAuthSuccess()">
      </app-auth-modal>
    </div>
  `
})
export class ClientLayoutComponent implements OnInit, OnDestroy {
  showAuthModal = false;
  toast: string | null = null;
  usuario: any = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    if (this.usuario) {
      this.socketService.connectAndJoin();
      this.setupSocketListeners();
    }
  }

  isCotizarPage(): boolean {
    return this.router.url.includes('/cliente/cotizar');
  }

  setupSocketListeners() {
    // 1. Viaje Despachado
    this.subscriptions.push(
      this.socketService.listen('viaje_despachado_cliente').subscribe((data: any) => {
        if (!this.router.url.includes('/en-curso')) {
          this.showToast(`¡Tu viaje ha sido despachado! Conductor: ${data.chofer_nombre}. Vehículo: ${data.vehiculo_marca} ${data.vehiculo_modelo} (${data.vehiculo_placa})`);
        }
      })
    );

    // 2. Chofer Asignado
    this.subscriptions.push(
      this.socketService.listen('chofer_asignado').subscribe((data: any) => {
        if (!this.router.url.includes('/en-curso')) {
          this.showToast(`¡Un chofer ha aceptado tu viaje! ${data.nombre_chofer} está en camino.`);
        }
      })
    );

    // 3. Chofer en Punto
    this.subscriptions.push(
      this.socketService.listen('chofer_en_punto').subscribe((data: any) => {
        if (!this.router.url.includes('/en-curso')) {
          this.showToast('¡Tu chofer ha llegado al punto de inicio!');
        }
      })
    );

    // 4. Viaje Finalizado
    this.subscriptions.push(
      this.socketService.listen('viaje_finalizado').subscribe((data: any) => {
        if (!this.router.url.includes('/en-curso')) {
          this.showToast('Tu viaje ha finalizado. ¡Gracias por usar Ecuavip Tour!');
        }
      })
    );

    // 5. Viaje Cancelado
    this.subscriptions.push(
      this.socketService.listen('viaje_cancelado').subscribe((data: any) => {
        if (!this.router.url.includes('/en-curso')) {
          this.showToast(data.mensaje || 'Tu viaje ha sido cancelado.');
        }
      })
    );

    // 6. Buscando Nuevo Chofer
    this.subscriptions.push(
      this.socketService.listen('buscando_nuevo_chofer').subscribe((data: any) => {
        if (!this.router.url.includes('/en-curso')) {
          this.showToast(data.mensaje || 'El chofer asignado canceló el viaje. Buscando otro conductor...');
        }
      })
    );
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = null, 6000);
  }

  handleAuthSuccess() {
    this.showAuthModal = false;
    window.location.reload();
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
