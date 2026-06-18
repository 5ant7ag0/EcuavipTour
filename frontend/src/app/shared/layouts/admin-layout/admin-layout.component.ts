import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
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
        <header class="bg-transparent flex items-center justify-between pt-4 pb-2 px-6 z-[100] shrink-0">
          <div class="flex items-center gap-4">
            <!-- Espacio para breadcrumbs o estado global si se desea, ahora limpio -->
          </div>

          <div class="flex items-center gap-4">
            <!-- Campana de Notificaciones -->
            <div class="relative">
              
              <!-- Contenedor de Toasts Push Flotantes (Lado Izquierdo) -->
              <div class="absolute right-full mr-3 top-0 z-[999] flex flex-col gap-3 w-80 pointer-events-none">
                <div 
                  *ngFor="let toast of toasts"
                  (click)="onToastClick(toast)"
                  class="pointer-events-auto flex gap-4 p-4 rounded-3xl bg-white/95 backdrop-blur-md border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-slate-300/50 transform translate-x-0 transition-all duration-300 relative overflow-hidden group select-none animate-slide-in cursor-pointer"
                  [ngClass]="{
                    'border-l-4 border-l-amber-500': toast.type === 'pago',
                    'border-l-4 border-l-blue-500': toast.type === 'mensaje',
                    'border-l-4 border-l-rose-500': toast.type === 'vehiculo'
                  }">
                  
                  <!-- Indicador de color de fondo sutil para toda la tarjeta -->
                  <div class="absolute inset-0 opacity-[0.02] pointer-events-none"
                    [ngClass]="{
                      'bg-amber-500': toast.type === 'pago',
                      'bg-blue-500': toast.type === 'mensaje',
                      'bg-rose-500': toast.type === 'vehiculo'
                    }"></div>

                  <!-- Icono decorativo -->
                  <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                    [ngClass]="{
                      'bg-amber-50 text-amber-600': toast.type === 'pago',
                      'bg-blue-50 text-blue-600': toast.type === 'mensaje',
                      'bg-rose-50 text-rose-600': toast.type === 'vehiculo'
                    }">
                    <svg *ngIf="toast.type === 'pago'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    <svg *ngIf="toast.type === 'mensaje'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    <svg *ngIf="toast.type === 'vehiculo'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C2.1 10.3 2 10.6 2 11v5c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                  </div>

                  <!-- Contenido textual -->
                  <div class="flex-1 min-w-0 pr-4">
                    <p class="text-xs font-black text-slate-800">{{ toast.title }}</p>
                    <p class="text-[11px] text-slate-500 font-bold leading-normal mt-0.5">{{ toast.description }}</p>
                  </div>

                  <!-- Botón de cierre -->
                  <button (click)="removeToast(toast.id); $event.stopPropagation()" class="text-slate-400 hover:text-slate-600 absolute top-3 right-3 transition-colors shrink-0">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                  </button>
                </div>
              </div>

              <button 
                (click)="toggleNotificationsDropdown($event)"
                class="relative w-10 h-10 flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-all">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
                <span 
                  *ngIf="hasNotifications()"
                  class="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse">
                </span>
              </button>

              <!-- Dropdown Menu para Notificaciones -->
              <div 
                *ngIf="showNotificationsDropdown" 
                class="absolute right-0 top-full mt-2 w-80 bg-white rounded-3xl shadow-xl border border-slate-100 p-4 z-[200] animate-in fade-in slide-in-from-top-2 duration-200">
                <div class="flex items-center justify-between border-b border-slate-50 pb-2 mb-3">
                  <h3 class="text-[11px] font-black text-slate-400 uppercase tracking-wider">Pendientes</h3>
                  <button (click)="clearAllToasts()" class="text-[10px] font-bold text-slate-400 hover:text-slate-600">Limpiar Alertas</button>
                </div>
                
                <div class="space-y-2 max-h-64 overflow-y-auto no-scrollbar">
                  <!-- Pagos -->
                  <a routerLink="/admin/pagos" (click)="showNotificationsDropdown = false" class="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-amber-50/50 border border-transparent hover:border-amber-100 transition-all">
                    <div class="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-black text-slate-800">Comprobantes de Pago</p>
                      <p class="text-[10px] text-slate-500 font-bold truncate">Tienes {{ (adminService.pendingCount$ | async) || 0 }} pagos por revisar</p>
                    </div>
                    <div *ngIf="((adminService.pendingCount$ | async) || 0) > 0" class="w-5 h-5 bg-amber-500 text-white rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0">
                      {{ (adminService.pendingCount$ | async) }}
                    </div>
                  </a>

                  <!-- Mensajería -->
                  <a routerLink="/admin/mensajeria" (click)="showNotificationsDropdown = false" class="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-blue-50/50 border border-transparent hover:border-blue-100 transition-all">
                    <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-black text-slate-800">Mensajes de Soporte</p>
                      <p class="text-[10px] text-slate-500 font-bold truncate">Tienes {{ (adminService.unreadCount$ | async) || 0 }} chats con mensajes nuevos</p>
                    </div>
                    <div *ngIf="((adminService.unreadCount$ | async) || 0) > 0" class="w-5 h-5 bg-blue-500 text-white rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0">
                      {{ (adminService.unreadCount$ | async) }}
                    </div>
                  </a>

                  <!-- Vehículos -->
                  <a routerLink="/admin/vehiculos" (click)="showNotificationsDropdown = false" class="flex items-center gap-3 p-2.5 rounded-2xl hover:bg-rose-50/50 border border-transparent hover:border-rose-100 transition-all">
                    <div class="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C2.1 10.3 2 10.6 2 11v5c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-xs font-black text-slate-800">Vehículos por Aprobar</p>
                      <p class="text-[10px] text-slate-500 font-bold truncate">Tienes {{ (adminService.pendingVehiclesCount$ | async) || 0 }} vehículos por aprobar</p>
                    </div>
                    <div *ngIf="((adminService.pendingVehiclesCount$ | async) || 0) > 0" class="w-5 h-5 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0">
                      {{ (adminService.pendingVehiclesCount$ | async) }}
                    </div>
                  </a>

                  <div *ngIf="!hasNotifications()" class="text-center py-6 text-slate-400 text-xs font-bold">
                    No tienes notificaciones pendientes
                  </div>
                </div>
              </div>
            </div>

            <!-- Separador sutil -->
            <div class="h-8 w-px bg-slate-100 mx-1"></div>

            <!-- Profile Dropdown -->
            <div class="relative group">
              <button class="flex items-center gap-3 p-1.5 pr-4 rounded-full hover:bg-slate-50 transition-all border border-transparent hover:border-slate-200">
                <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-600/20 overflow-hidden">
                  <span *ngIf="!(usuario?.foto_perfil_url || usuario?.fotoPerfilUrl)">{{ usuario?.nombre?.charAt(0) }}</span>
                  <img *ngIf="usuario?.foto_perfil_url || usuario?.fotoPerfilUrl" [src]="'http://localhost:5001/' + (usuario.foto_perfil_url || usuario.fotoPerfilUrl)" class="w-full h-full object-cover">
                </div>
                <div class="text-left hidden lg:block">
                  <p class="text-sm font-semibold text-slate-800 leading-tight">{{ usuario?.nombre }}</p>
                  <p class="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">Administrador</p>
                </div>
                <svg class="text-slate-600" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m6 9 6 6 6-6"/></svg>
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
  `,
  styles: [`
    @keyframes slideIn {
      from {
        transform: translateX(120%) translateY(-10px);
        opacity: 0;
      }
      to {
        transform: translateX(0) translateY(0);
        opacity: 1;
      }
    }
    .animate-slide-in {
      animation: slideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isSidebarOpen = true;
  notificacionesNuevas = 0;
  showNotificationsDropdown = false;
  usuario: any = null;
  toasts: Array<{
    id: string;
    type: 'pago' | 'mensaje' | 'vehiculo';
    title: string;
    description: string;
    icon: string;
    color: string;
  }> = [];

  private subscriptions = new Subscription();

  constructor(
    private authService: AuthService, 
    private router: Router,
    private socketService: SocketService,
    public adminService: AdminService
  ) {}

  get isAdmin(): boolean {
    return this.authService.getRol() === 'admin';
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    this.showNotificationsDropdown = false;
  }

  toggleNotificationsDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
  }

  ngOnInit() {
    // Doble verificación en el componente: si no es admin, redirigir
    if (!this.isAdmin) {
      this.router.navigate(['/cliente']);
      return;
    }

    this.socketService.connectAndJoin();
    
    // Suscribirse al usuario de forma reactiva
    this.subscriptions.add(this.authService.currentUser$.subscribe(user => {
      this.usuario = user;
    }));

    // Cargar el conteo inicial (total de pendientes de pago)
    this.subscriptions.add(this.adminService.getPagos('pendientes').subscribe());
    
    // Cargar el conteo inicial de vehículos
    this.subscriptions.add(this.adminService.getVehiculos('pendiente').subscribe());
    
    // Cargar el conteo inicial de MENSAJERÍA (para que no salga 0 al recargar)
    this.subscriptions.add(this.adminService.getInbox().subscribe(inbox => {
      const chatsConUnread = inbox.filter((c: any) => (c.unread || 0) > 0).length;
      this.adminService.updateUnreadCount(chatsConUnread);
    }));

    // Mantener el contador de MENSAJERÍA sincronizado
    this.subscriptions.add(this.adminService.unreadCount$.subscribe(count => {
      this.notificacionesNuevas = count;
    }));
    
    // Escuchar nuevos comprobantes (recargar los pagos automáticamente)
    this.subscriptions.add(this.socketService.listen('nuevo_comprobante').subscribe(() => {
      this.adminService.getPagos('pendientes').subscribe();
      this.showToast(
        'pago',
        'Comprobante de Pago',
        'Se ha subido un nuevo comprobante de pago para su verificación.'
      );
    }));

    // Escuchar nuevos mensajes para actualizar el contador global si no estamos en mensajeria
    this.subscriptions.add(this.socketService.listen('nuevo_mensaje').subscribe((data: any) => {
      if (!this.router.url.includes('/admin/mensajeria')) {
        this.adminService.getInbox().subscribe(); // Esto actualizará el unreadCount$
        this.showToast(
          'mensaje',
          'Nuevo Mensaje',
          `Nuevo mensaje en soporte: "${data?.contenido || 'Mensaje nuevo'}"`
        );
      }
    }));

    // Escuchar nuevos vehículos para su aprobación
    this.subscriptions.add(this.socketService.listen('nuevo_vehiculo').subscribe((data: any) => {
      this.adminService.getVehiculos('pendiente').subscribe();
      this.showToast(
        'vehiculo',
        'Vehículo por Aprobar',
        `El chofer ${data?.chofer_nombre || 'Chofer'} ha registrado un auto para su aprobación.`
      );
    }));
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  logout() {
    this.authService.logout();
    this.socketService.disconnect();
    this.router.navigate(['/']);
  }

  showToast(type: 'pago' | 'mensaje' | 'vehiculo', title: string, description: string) {
    const id = Math.random().toString(36).substring(2, 9);
    this.toasts.push({
      id,
      type,
      title,
      description,
      icon: '',
      color: ''
    });

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      this.removeToast(id);
    }, 5000);
  }

  removeToast(id: string) {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  onToastClick(toast: any) {
    this.removeToast(toast.id);
    if (toast.type === 'pago') {
      this.router.navigate(['/admin/pagos']);
    } else if (toast.type === 'mensaje') {
      this.router.navigate(['/admin/mensajeria']);
    } else if (toast.type === 'vehiculo') {
      this.router.navigate(['/admin/vehiculos']);
    }
  }

  clearAllToasts() {
    this.toasts = [];
  }

  hasNotifications(): boolean {
    return (
      this.adminService.pendingCountValue > 0 ||
      this.adminService.unreadCountValue > 0 ||
      this.adminService.pendingVehiclesCountValue > 0
    );
  }
}
