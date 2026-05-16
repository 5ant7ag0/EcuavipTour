import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';
import { AdminService } from '../../../core/services/admin.service';
import { Subscription } from 'rxjs';

import { AdminNavComponent } from '../../components/admin-nav/admin-nav.component';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, AdminNavComponent],
  template: `
    <div class="flex h-screen bg-slate-50 font-sans overflow-hidden">
      
      <!-- Navegación Lateral y Mobile para Admin -->
      <app-admin-nav 
        [isSidebarOpen]="true" 
        [notificacionesNuevas]="notificacionesNuevas">
      </app-admin-nav>

      <!-- ===== CONTENT AREA ===== -->
      <div class="flex-1 flex flex-col min-w-0 my-4 mr-4 h-[calc(100vh-2rem)] rounded-3xl bg-slate-50 shadow-sm border border-gray-100 overflow-hidden">
        
        <!-- Top Header -->
        <header class="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 flex items-center justify-between px-8 z-[100] shrink-0 shadow-sm">
          <div class="flex items-center gap-4">
            <!-- Espacio para breadcrumbs o estado global si se desea, ahora limpio -->
          </div>

          <div class="flex items-center gap-4">
            <!-- Campana de Notificaciones -->
            <button class="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all group">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
              <span class="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
            </button>

            <!-- Separador sutil -->
            <div class="h-8 w-px bg-slate-100 mx-1"></div>

            <!-- Profile Dropdown -->
            <div class="relative group">
              <button class="flex items-center gap-3 p-1.5 pr-4 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200">
                <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-600/20 overflow-hidden">
                  <span *ngIf="!usuario?.foto_perfil_url">{{ usuario?.nombre?.charAt(0) }}</span>
                  <img *ngIf="usuario?.foto_perfil_url" [src]="'http://localhost:5001/' + usuario.foto_perfil_url" class="w-full h-full object-cover">
                </div>
                <div class="text-left hidden lg:block">
                  <p class="text-xs font-black text-slate-900 leading-tight">{{ usuario?.nombre }}</p>
                  <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Administrador</p>
                </div>
                <svg class="text-slate-400" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m6 9 6 6 6-6"/></svg>
              </button>

              <!-- Dropdown menu -->
              <div class="absolute right-0 top-full mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div class="bg-white rounded-3xl shadow-sm border border-slate-100 p-2">
                  <div class="px-4 py-3 border-b border-slate-50 mb-1">
                    <p class="text-sm font-black text-slate-900">{{ usuario?.nombre }}</p>
                    <p class="text-[10px] text-slate-400 font-bold truncate">{{ usuario?.correo }}</p>
                  </div>
                  <a routerLink="/admin/perfil" class="flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Mi Perfil
                  </a>
                  <div class="border-t border-slate-50 mt-1 pt-1">
                    <button (click)="logout()" class="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        <!-- Main Content -->
        <main class="flex-1 overflow-y-auto p-4 md:p-8 pb-28 md:pb-8 no-scrollbar">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isSidebarOpen = true;
  notificacionesNuevas = 0;
  usuario: any = null;
  private socketSub: Subscription | null = null;
  private countSub: Subscription | null = null;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private socketService: SocketService,
    private adminService: AdminService
  ) {}

  get isAdmin(): boolean {
    return this.authService.getRol() === 'admin';
  }

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    // Doble verificación en el componente: si no es admin, redirigir
    if (!this.isAdmin) {
      this.router.navigate(['/cliente']);
      return;
    }

    this.socketService.connectAndJoin();
    
    // Cargar el conteo inicial (total de pendientes de pago)
    this.adminService.getPagos('pendientes').subscribe();
    
    // Cargar el conteo inicial de MENSAJERÍA (para que no salga 0 al recargar)
    this.adminService.getInbox().subscribe(inbox => {
      const chatsConUnread = inbox.filter((c: any) => (c.unread || 0) > 0).length;
      this.adminService.updateUnreadCount(chatsConUnread);
    });

    // Mantener el contador de pagos sincronizado
    this.countSub = this.adminService.pendingCount$.subscribe(count => {
      // (Si tienes un contador específico para pagos en el layout, úsalo aquí)
    });

    // Mantener el contador de MENSAJERÍA sincronizado
    this.adminService.unreadCount$.subscribe(count => {
      this.notificacionesNuevas = count;
    });
    
    // Escuchar nuevos comprobantes (recargar los pagos automáticamente)
    this.socketSub = this.socketService.listen('nuevo_comprobante').subscribe(() => {
      this.adminService.getPagos('pendientes').subscribe();
    });

    // Escuchar nuevos mensajes para actualizar el contador global si no estamos en mensajeria
    this.socketService.listen('nuevo_mensaje').subscribe(() => {
      if (!this.router.url.includes('/admin/mensajeria')) {
        this.adminService.getInbox().subscribe(); // Esto actualizará el unreadCount$
      }
    });
  }

  ngOnDestroy() {
    if (this.socketSub) this.socketSub.unsubscribe();
    if (this.countSub) this.countSub.unsubscribe();
  }

  logout() {
    this.authService.logout();
    this.socketService.disconnect();
    this.router.navigate(['/']);
  }
}
