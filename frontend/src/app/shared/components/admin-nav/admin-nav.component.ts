import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <!-- ===== SIDEBAR DESKTOP ===== -->
  <aside 
    class="hidden md:flex bg-[#1e293b] text-white flex-col transition-all duration-300 ease-in-out z-20 shadow-2xl relative shrink-0 my-4 ml-4 h-[calc(100vh-2rem)] rounded-[2.5rem] overflow-hidden border border-white/5"
    [class.w-64]="isSidebarOpen"
    [class.w-20]="!isSidebarOpen">
    
    <!-- Logo area -->
    <div class="h-20 flex items-center px-6 border-b border-white/5 overflow-hidden shrink-0">
      <div class="flex items-center gap-3 min-w-[200px]">
        <img src="assets/logo.png" alt="Logo" class="h-10 w-auto shrink-0">
        <span class="text-xl font-black tracking-tight whitespace-nowrap transition-opacity duration-300" [class.opacity-0]="!isSidebarOpen">
          Admin<span class="text-blue-500">Panel</span>
        </span>
      </div>
    </div>

    <!-- Navigation Links -->
    <nav class="flex-1 overflow-y-auto py-6 px-3 space-y-2 no-scrollbar">
      <a routerLink="/admin/monitor" routerLinkActive="bg-blue-600 text-white" 
         class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <span class="font-bold text-sm whitespace-nowrap transition-all duration-300" [class.opacity-0]="!isSidebarOpen" [class.translate-x-4]="!isSidebarOpen">Dashboard</span>
        <div *ngIf="!isSidebarOpen" class="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
          Dashboard
        </div>
      </a>

      <a routerLink="/admin/pagos" routerLinkActive="bg-blue-600 text-white" 
         class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
        <span class="font-bold text-sm whitespace-nowrap transition-all duration-300" [class.opacity-0]="!isSidebarOpen" [class.translate-x-4]="!isSidebarOpen">Validación Pagos</span>
        <div *ngIf="!isSidebarOpen" class="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
          Pagos
        </div>
      </a>

      <a routerLink="/admin/mensajeria" routerLinkActive="bg-blue-600 text-white" 
         class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group relative">
        <div class="relative shrink-0">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
          <span *ngIf="notificacionesNuevas > 0" class="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-[#1e293b]">
            {{ notificacionesNuevas }}
          </span>
        </div>
        <span class="font-bold text-sm whitespace-nowrap transition-all duration-300" [class.opacity-0]="!isSidebarOpen" [class.translate-x-4]="!isSidebarOpen">Mensajería</span>
        <div *ngIf="!isSidebarOpen" class="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
          Mensajería
        </div>
      </a>

      <!-- Usuarios -->
      <a routerLink="/admin/usuarios" routerLinkActive="bg-blue-600 text-white" 
         class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
        <span class="font-bold text-sm whitespace-nowrap transition-all duration-300" [class.opacity-0]="!isSidebarOpen" [class.translate-x-4]="!isSidebarOpen">Usuarios</span>
        <div *ngIf="!isSidebarOpen" class="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
          Usuarios
        </div>
      </a>

      <!-- Vehículos -->
      <a routerLink="/admin/vehiculos" routerLinkActive="bg-blue-600 text-white" 
         class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C2.1 10.3 2 10.6 2 11v5c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
        <span class="font-bold text-sm whitespace-nowrap transition-all duration-300" [class.opacity-0]="!isSidebarOpen" [class.translate-x-4]="!isSidebarOpen">Vehículos</span>
        <div *ngIf="!isSidebarOpen" class="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
          Vehículos
        </div>
      </a>

      <!-- Configuración -->
      <a routerLink="/admin/config" routerLinkActive="bg-blue-600 text-white" 
         class="flex items-center gap-4 px-4 py-3.5 rounded-2xl text-slate-400 hover:text-white hover:bg-white/5 transition-all group relative">
        <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="shrink-0"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>
        <span class="font-bold text-sm whitespace-nowrap transition-all duration-300" [class.opacity-0]="!isSidebarOpen" [class.translate-x-4]="!isSidebarOpen">Configuración</span>
        <div *ngIf="!isSidebarOpen" class="absolute left-full ml-4 px-3 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50 shadow-xl border border-white/10">
          Configuración
        </div>
      </a>
    </nav>

    <!-- Sidebar Footer Toggle -->
    <div class="p-4 border-t border-white/5 shrink-0">
      <button (click)="toggleSidebar.emit()" class="w-full flex items-center justify-center p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
        <svg [class.rotate-180]="!isSidebarOpen" class="transition-transform duration-500 text-slate-400" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m15 18-6-6 6-6"/></svg>
      </button>
    </div>
  </aside>

  <!-- ===== MOBILE TAB BAR ===== -->
  <nav class="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-gray-100 flex md:hidden justify-around items-center z-[100] h-20 shadow-[0_-8px_30px_rgba(0,0,0,0.08)] px-2 rounded-t-[2rem]">
    <a routerLink="/admin/monitor" routerLinkActive="text-blue-600 bg-blue-50" class="flex flex-col items-center gap-1 p-2 rounded-2xl transition-all text-slate-500">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
      <span class="text-[9px] font-bold uppercase tracking-tighter">Panel</span>
    </a>
    <a routerLink="/admin/pagos" routerLinkActive="text-blue-600 bg-blue-50" class="flex flex-col items-center gap-1 p-2 rounded-2xl transition-all text-slate-500">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/></svg>
      <span class="text-[9px] font-bold uppercase tracking-tighter">Pagos</span>
    </a>
    <a routerLink="/admin/mensajeria" routerLinkActive="text-blue-600 bg-blue-50" class="flex flex-col items-center gap-1 p-2 rounded-2xl transition-all relative text-slate-500">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
      <span *ngIf="notificacionesNuevas > 0" class="absolute top-2 right-2 bg-red-500 text-white text-[8px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-white">{{ notificacionesNuevas }}</span>
      <span class="text-[9px] font-bold uppercase tracking-tighter">Chat</span>
    </a>
    <a routerLink="/admin/usuarios" routerLinkActive="text-blue-600 bg-blue-50" class="flex flex-col items-center gap-1 p-2 rounded-2xl transition-all text-slate-500">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
      <span class="text-[9px] font-bold uppercase tracking-tighter">Users</span>
    </a>
    <a routerLink="/admin/vehiculos" routerLinkActive="text-blue-600 bg-blue-50" class="flex flex-col items-center gap-1 p-2 rounded-2xl transition-all text-slate-500">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C2.1 10.3 2 10.6 2 11v5c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
      <span class="text-[9px] font-bold uppercase tracking-tighter">Vehículos</span>
    </a>
  </nav>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class AdminNavComponent {
  @Input() isSidebarOpen = true;
  @Input() notificacionesNuevas = 0;
  @Output() toggleSidebar = new EventEmitter<void>();

  constructor() {}
}
