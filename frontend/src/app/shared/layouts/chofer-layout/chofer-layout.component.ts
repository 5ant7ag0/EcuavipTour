import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';
import { ChoferNavbarComponent } from '../../components/chofer-navbar/chofer-navbar.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-chofer-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ChoferNavbarComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col font-sans relative">
      <!-- Navbar dedicado para chofer -->
      <app-chofer-navbar></app-chofer-navbar>

      <!-- Espaciador para Navbar Desktop -->
      <div class="hidden md:block h-20 w-full"></div>

      <!-- TOAST NOTIFICATION GLOBAL -->
      <div *ngIf="toast" class="fixed top-24 left-1/2 -translate-x-1/2 z-[10002] w-[92%] max-w-lg transition-all duration-500 ease-out transform">
        <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-blue-500/20 flex items-center gap-4 border border-blue-400/25 relative overflow-hidden backdrop-blur-md animate-in slide-in-from-top-12 duration-500">
          <!-- Glow effect -->
          <div class="absolute -right-10 -top-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C2.1 10.3 2 10.6 2 11v5c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
          </div>
          <div>
            <span class="text-[8px] font-black uppercase tracking-[0.2em] text-blue-100 block mb-0.5">Notificación Chofer en tiempo real</span>
            <p class="text-xs font-black leading-snug text-white">{{ toast }}</p>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <main [class]="isDashboardMode ? 'flex-1 overflow-hidden' : 'flex-1 pb-24 md:pb-8 overflow-y-auto'">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class ChoferLayoutComponent implements OnInit, OnDestroy {
  usuario: any = null;
  toast: string | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private socketService: SocketService
  ) {}

  get isDashboardMode(): boolean {
    return this.router.url.includes('/chofer/dashboard');
  }

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    if (this.usuario?.rol !== 'chofer') {
      this.router.navigate(['/cliente']);
      return;
    }
    
    this.socketService.connectAndJoin();
    this.setupSocketListeners();
  }

  setupSocketListeners() {
    // 1. Nuevo Viaje Disponible
    this.subscriptions.push(
      this.socketService.listen('nuevo_viaje_disponible').subscribe((data: any) => {
        if (!this.router.url.includes('/dashboard')) {
          this.showToast(`¡Nuevo viaje disponible! Origen: ${data.origen} → Destino: ${data.destino}. Tarifa: $${data.tarifa}`);
        }
      })
    );

    // 2. Viaje Confirmado (Asignado)
    this.subscriptions.push(
      this.socketService.listen('viaje_confirmado_chofer').subscribe((data: any) => {
        if (!this.router.url.includes('/en-curso')) {
          this.showToast(`¡Has sido asignado a un viaje! Cliente: ${data.cliente_nombre || 'VIP Client'}`);
        }
      })
    );

    // 3. Viaje Ya Tomado
    this.subscriptions.push(
      this.socketService.listen('viaje_ya_tomado').subscribe((data: any) => {
        if (!this.router.url.includes('/dashboard')) {
          this.showToast(`Un viaje disponible que estabas visualizando ya fue tomado por otro conductor.`);
        }
      })
    );

    // 4. Viaje Cancelado
    this.subscriptions.push(
      this.socketService.listen('viaje_cancelado').subscribe((data: any) => {
        if (!this.router.url.includes('/en-curso')) {
          this.showToast(data.mensaje || `Un viaje asignado ha sido cancelado.`);
        }
      })
    );
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = null, 6000);
  }

  logout() {
    this.authService.logout();
    this.socketService.disconnect();
    this.router.navigate(['/']);
  }

  ngOnDestroy() {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
}
