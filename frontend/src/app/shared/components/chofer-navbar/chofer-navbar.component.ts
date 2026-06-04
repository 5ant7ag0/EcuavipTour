import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';

@Component({
  selector: 'app-chofer-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <!-- ===== DESKTOP NAVBAR ===== -->
    <header class="hidden md:block fixed top-0 left-0 right-0 h-20 bg-white border-b border-gray-100 z-[100] shadow-sm">
      <div class="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        
        <div class="flex items-center gap-8">
          <a routerLink="/chofer/dashboard" class="flex items-center gap-2">
            <img src="assets/logo.png" alt="Logo" class="h-10 w-auto">
            <span class="text-xl font-black text-gray-900">Ecuavip<span class="text-blue-600">Chofer</span></span>
          </a>

          <nav class="flex items-center gap-1">
            <a routerLink="/chofer/dashboard" routerLinkActive="bg-blue-50 text-blue-600" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
              Modo Viaje
            </a>
            <a routerLink="/chofer/ruta" routerLinkActive="bg-blue-50 text-blue-600" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              Historial de Viajes
            </a>
            <a routerLink="/chofer/perfil" routerLinkActive="bg-blue-50 text-blue-600" class="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-gray-500 hover:text-blue-600 hover:bg-blue-50 transition-all">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
              Mi Cuenta
            </a>
          </nav>
        </div>

        <div class="flex items-center gap-4">
          <!-- User Dropdown -->
          <div class="relative group">
            <button class="flex items-center gap-3 p-1.5 pr-4 rounded-2xl hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
              <div class="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-black shadow-lg shadow-blue-600/20 overflow-hidden shrink-0">
                <img *ngIf="usuario?.foto_perfil_url" [src]="'http://localhost:5001/' + usuario.foto_perfil_url" class="w-full h-full object-cover">
                <span *ngIf="!usuario?.foto_perfil_url">{{ usuario?.nombre?.charAt(0) }}</span>
              </div>
              <div class="text-left hidden lg:block">
                <p class="text-sm font-black text-gray-900 leading-tight">{{ usuario?.nombre?.split(' ')[0] }}</p>
                <p class="text-[10px] font-bold text-blue-600 uppercase tracking-widest">Chofer VIP</p>
              </div>
              <svg class="text-gray-400" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="m6 9 6 6 6-6"/></svg>
            </button>

            <!-- Dropdown Content -->
            <div class="absolute right-0 top-full mt-2 w-56 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-[110]">
              <div class="bg-white rounded-2xl shadow-2xl border border-gray-100 p-2">
                <div class="px-4 py-3 border-b border-gray-50 mb-1">
                  <p class="text-sm font-black text-gray-900 truncate">{{ usuario?.nombre }}</p>
                  <p class="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{{ usuario?.correo }}</p>
                </div>
                <a routerLink="/chofer/perfil" class="flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-gray-50 rounded-xl transition-all">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                  Mi Cuenta
                </a>
                <div class="border-t border-gray-50 mt-1 pt-1">
                  <button (click)="logout()" class="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-50 rounded-xl transition-all">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </header>

    <!-- ===== MOBILE TAB BAR ===== -->
    <nav class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 px-2 py-3 flex justify-around items-center z-[100] md:hidden shadow-[0_-8px_30px_rgba(0,0,0,0.08)] rounded-t-[2rem]">
      <a routerLink="/chofer/dashboard" routerLinkActive="text-blue-600 bg-blue-50" class="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl transition-all text-slate-500">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3"/></svg>
        <span class="text-[9px] font-bold uppercase tracking-widest">Viaje</span>
      </a>
      <a routerLink="/chofer/ruta" routerLinkActive="text-blue-600 bg-blue-50" class="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl transition-all text-slate-500">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        <span class="text-[9px] font-bold uppercase tracking-widest">Historial</span>
      </a>
      <a routerLink="/chofer/perfil" routerLinkActive="text-blue-600 bg-blue-50" class="flex flex-col items-center gap-1 px-2 py-2 rounded-2xl transition-all text-slate-500">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span class="text-[9px] font-bold uppercase tracking-widest">Mi Cuenta</span>
      </a>
    </nav>
  `
})
export class ChoferNavbarComponent implements OnInit {
  usuario: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
  }

  logout() {
    this.authService.logout();
    this.socketService.disconnect();
    this.router.navigate(['/']);
    window.location.reload();
  }
}
