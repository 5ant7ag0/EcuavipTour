import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';
import { AdminService } from '../../../core/services/admin.service';
import { Output, EventEmitter } from '@angular/core';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-client-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <ng-container *ngIf="shouldShowNavbar">
      <!-- ===== MOBILE BOTTOM NAV ===== -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100/80 px-2 py-2 flex justify-around items-center z-[100] md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.08)] rounded-t-[1.75rem]">
      <a routerLink="/" routerLinkActive="active-mobile" [routerLinkActiveOptions]="{exact:true}" class="nav-mobile-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span>Inicio</span>
      </a>
      <a *ngIf="isLoggedIn" routerLink="/cliente/mis-viajes" routerLinkActive="active-mobile" class="nav-mobile-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.617a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0l4.212 2.106Z"/><path d="M9 3.5v13"/><path d="M15 7.5v13"/></svg>
        <span>Mis Viajes</span>
      </a>
      <a *ngIf="!isLoggedIn" routerLink="/servicios" routerLinkActive="active-mobile" class="nav-mobile-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></svg>
        <span>Servicios</span>
      </a>
      <a routerLink="/rastreo" routerLinkActive="active-mobile" class="nav-mobile-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span>Rastreo</span>
      </a>
      <a routerLink="/contacto" routerLinkActive="active-mobile" class="nav-mobile-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 9.22a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.82 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17l.92-.08Z"/></svg>
        <span>Contacto</span>
      </a>
      <a *ngIf="isLoggedIn" routerLink="/cliente/perfil" routerLinkActive="active-mobile" class="nav-mobile-item">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
        <span>Perfil</span>
      </a>
      <a *ngIf="!isLoggedIn" (click)="requestLogin()" class="nav-mobile-item cursor-pointer">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/><polyline points="10 17 15 12 10 7"/><line x1="15" y1="12" x2="3" y2="12"/></svg>
        <span>Entrar</span>
      </a>
    </nav>

    <!-- ===== DESKTOP TOP NAV ===== -->
    <header class="hidden md:block fixed top-0 left-0 right-0 z-[100] transition-all duration-300" [class.scrolled]="isScrolled">
      <div class="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        <a routerLink="/" class="flex items-center group flex-shrink-0 no-underline">
          <img src="assets/logo.png" alt="EcuavipTour Logo" class="h-[96px] w-auto object-contain transition-transform group-hover:scale-110">
        </a>

        <nav class="flex items-center gap-1">
          <a routerLink="/" [routerLinkActiveOptions]="{exact:true}" routerLinkActive="nav-active" class="nav-link">Inicio</a>
          <a routerLink="/servicios" routerLinkActive="nav-active" class="nav-link">Servicios</a>
          <a routerLink="/cliente/cotizar" routerLinkActive="nav-active" class="nav-link">Cotizar</a>
          <a *ngIf="isLoggedIn" routerLink="/cliente/mis-viajes" routerLinkActive="nav-active" class="nav-link">Mis Viajes</a>
          <a routerLink="/rastreo" routerLinkActive="nav-active" class="nav-link">Rastreo</a>
          <a routerLink="/contacto" routerLinkActive="nav-active" class="nav-link">Contacto</a>
        </nav>

        <div class="flex items-center gap-3 flex-shrink-0">
          <ng-container *ngIf="isLoggedIn; else loginBtnTpl">
            <div class="group relative">
              <button class="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                <div class="w-8 h-8 rounded-xl bg-ecuavip-blue/10 flex items-center justify-center text-ecuavip-blue font-black text-sm group-hover:bg-ecuavip-blue group-hover:text-white transition-all">
                  {{ usuario?.nombre?.charAt(0)?.toUpperCase() || 'U' }}
                </div>
                <div class="text-left hidden lg:block">
                  <p class="text-sm font-bold text-gray-900 leading-none">{{ usuario?.nombre?.split(' ')[0] || 'Mi cuenta' }}</p>
                  <p class="text-[10px] text-gray-400 font-semibold capitalize mt-0.5">{{ usuario?.rol || 'usuario' }}</p>
                </div>
                <svg class="text-gray-400 ml-1" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m6 9 6 6 6-6"/></svg>
              </button>
              <div class="absolute right-0 top-full mt-2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[110]">
                <div class="bg-white rounded-3xl shadow-sm border border-gray-100 p-2 overflow-hidden">
                  <div class="px-4 py-3 border-b border-gray-50 mb-1">
                    <p class="text-sm font-extrabold text-gray-900 truncate">{{ usuario?.nombre }}</p>
                    <p class="text-xs text-gray-400 truncate mt-0.5">{{ usuario?.correo }}</p>
                  </div>
                  <a routerLink="/cliente/perfil" class="flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50 rounded-xl transition-colors cursor-pointer">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    Mi Perfil
                  </a>
                  <div class="border-t border-gray-50 mt-1 pt-1">
                    <button (click)="logout()" class="w-full flex items-center gap-3 px-4 py-2.5 text-sm font-semibold text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </ng-container>
          <ng-template #loginBtnTpl>
            <button (click)="requestLogin()" class="bg-ecuavip-blue text-white px-5 py-2.5 rounded-xl font-bold text-sm shadow-lg shadow-ecuavip-blue/25 hover:scale-105 hover:shadow-xl hover:shadow-ecuavip-blue/30 active:scale-95 transition-all">
              Iniciar Sesión
            </button>
          </ng-template>
        </div>
      </div>
    </header>
    </ng-container>
  `,
  styles: [`
    :host { display: block; }
    header {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-bottom: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 4px 24px rgba(0,0,0,0.04);
    }
    header.scrolled {
      background: rgba(255,255,255,0.97);
      box-shadow: 0 4px 32px rgba(0,0,0,0.08);
    }
    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border-radius: 12px;
      font-size: 13.5px;
      font-weight: 700;
      color: #6b7280;
      text-decoration: none;
      transition: all 0.18s ease;
      white-space: nowrap;
    }
    .nav-link:hover {
      color: #0056b3;
      background: rgba(0, 86, 179, 0.07);
    }
    .nav-link.nav-active {
      color: #0056b3;
      background: rgba(0, 86, 179, 0.1);
    }
    .nav-mobile-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      padding: 6px 10px;
      border-radius: 14px;
      color: #9ca3af;
      text-decoration: none;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      transition: all 0.18s;
    }
    .nav-mobile-item:hover, .nav-mobile-item.active-mobile {
      color: #0056b3;
      background: rgba(0, 86, 179, 0.08);
    }
    .active-fab .div {
      transform: scale(1.05);
    }
  `]
})
export class ClientNavbarComponent implements OnInit {
  @Output() onLoginRequest = new EventEmitter<void>();

  usuario: any = null;
  unreadCount = 0;
  isLoggedIn = false;
  isAdmin = false;
  isChofer = false;
  isScrolled = false;
  shouldShowNavbar = true;

  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    private adminService: AdminService,
    private router: Router
  ) {}

  socketInitialized = false;

  @HostListener('window:scroll')
  onScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  ngOnInit() {
    this.checkAuth();
    this.setupSocket();
    this.router.events.pipe(filter(e => e instanceof NavigationEnd)).subscribe(() => {
      this.checkAuth();
      this.setupSocket();
    });
  }

  checkAuth() {
    this.isLoggedIn = this.authService.isLoggedIn();
    this.usuario = this.authService.getUsuario();
    this.isAdmin = this.usuario?.rol === 'admin';
    this.isChofer = this.usuario?.rol === 'chofer';
    this.shouldShowNavbar = !this.isLoggedIn || this.usuario?.rol === 'cliente';
  }

  setupSocket() {
    if (this.socketInitialized || !this.isLoggedIn) return;
    this.socketInitialized = true;
    
    this.socketService.connectAndJoin();
    
    if (this.usuario?.rol === 'cliente') {
      this.socketService.listen('viaje_despachado_cliente').subscribe((data: any) => {
        console.log('[Global Client Socket] Viaje despachado recibido:', data);
        this.router.navigate(['/cliente/en-curso']).then(() => {
          sessionStorage.setItem('despachado_toast', JSON.stringify(data));
        });
      });
    }

    if (this.isAdmin) {
      this.adminService.getInbox().subscribe(inbox => {
        this.unreadCount = inbox.filter((c: any) => (c.unread || 0) > 0).length;
      });
      this.socketService.listen('nuevo_mensaje').subscribe(() => {
        this.adminService.getInbox().subscribe(inbox => {
          this.unreadCount = inbox.filter((c: any) => (c.unread || 0) > 0).length;
        });
      });
    }
  }

  requestLogin() {
    this.onLoginRequest.emit();
  }

  logout() {
    this.authService.logout();
    this.socketService.disconnect();
    this.socketInitialized = false;
    this.router.navigate(['/']);
  }
}
