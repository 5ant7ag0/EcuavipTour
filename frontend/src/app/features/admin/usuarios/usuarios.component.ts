import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-6">
      <!-- Header y Buscador -->
      <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-slate-800">Gestión de Usuarios</h1>
          <p class="text-slate-500">Administra los accesos y roles de la plataforma</p>
        </div>

        <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <!-- Buscador Inteligente -->
          <div class="relative group min-w-[300px]">
            <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            <input 
              type="text" 
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
              placeholder="Nombre, correo o teléfono..." 
              class="w-full pl-12 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
            >
          </div>

          <!-- Filtro de Rol -->
          <select 
            [(ngModel)]="selectedRole"
            (change)="loadUsuarios()"
            class="px-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm text-slate-600 appearance-none min-w-[150px]"
          >
            <option value="">Todos los Roles</option>
            <option value="admin">Administradores</option>
            <option value="chofer">Choferes</option>
            <option value="cliente">Clientes</option>
          </select>
        </div>
      </div>

      <!-- Tabla de Usuarios -->
      <div class="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100">
                <th class="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Usuario</th>
                <th class="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Contacto</th>
                <th class="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Rol</th>
                <!-- Columnas condicionales para Choferes -->
                <th *ngIf="selectedRole === 'chofer'" class="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Viajes</th>
                <th *ngIf="selectedRole === 'chofer'" class="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Calif.</th>
                
                <th class="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Registro</th>
                <th class="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">Estado</th>
                <th class="px-8 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let user of filteredUsers" class="hover:bg-slate-50/30 transition-colors group">
                <!-- Identidad -->
                <td class="px-8 py-5">
                  <div class="flex items-center gap-4">
                    <div class="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm overflow-hidden text-sm">
                      <span>{{ user.nombre.charAt(0) }}</span>
                    </div>
                    <div>
                      <div class="font-bold text-slate-700 leading-none mb-1">{{ user.nombre }}</div>
                      <div class="text-xs text-slate-400">{{ user.correo }}</div>
                    </div>
                  </div>
                </td>

                <!-- Contacto -->
                <td class="px-6 py-5">
                  <div class="flex items-center gap-2 text-slate-600">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="text-slate-400"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 9.22a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.82 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17l.92-.08Z"/></svg>
                    <span class="text-sm font-medium">{{ user.telefono || 'Sin número' }}</span>
                  </div>
                </td>

                <!-- Rol -->
                <td class="px-6 py-5">
                  <span [ngClass]="{
                    'bg-purple-100 text-purple-700': user.rol === 'admin',
                    'bg-blue-100 text-blue-700': user.rol === 'chofer',
                    'bg-slate-100 text-slate-700': user.rol === 'cliente'
                  }" class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {{ user.rol }}
                  </span>
                </td>

                <!-- Estadísticas de Chofer (Condicional) -->
                <td *ngIf="selectedRole === 'chofer'" class="px-6 py-5">
                  <div class="flex items-center gap-2">
                    <span class="px-2 py-0.5 bg-slate-100 rounded text-xs font-bold text-slate-600">
                      {{ user.viajes_completados || 0 }}
                    </span>
                  </div>
                </td>
                <td *ngIf="selectedRole === 'chofer'" class="px-6 py-5">
                  <div class="flex items-center gap-1 text-amber-500">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span class="text-sm font-bold">{{ (user.promedio_calificacion || 0) | number:'1.1-1' }}</span>
                  </div>
                </td>

                <!-- Fecha -->
                <td class="px-6 py-5 text-sm text-slate-400">
                  {{ user.fecha_registro | date:'mediumDate' }}
                </td>

                <!-- Estado -->
                <td class="px-6 py-5">
                  <div class="flex items-center gap-2">
                    <div [class]="user.activo ? 'w-2 h-2 rounded-full bg-green-500' : 'w-2 h-2 rounded-full bg-slate-300'"></div>
                    <span [class]="user.activo ? 'text-green-600 text-sm font-bold' : 'text-slate-400 text-sm font-medium'">
                      {{ user.activo ? 'Activo' : 'Suspendido' }}
                    </span>
                  </div>
                </td>

                <!-- Acciones -->
                <td class="px-8 py-5 text-right">
                  <div class="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      (click)="toggleStatus(user)"
                      [title]="user.activo ? 'Desactivar' : 'Activar'"
                      class="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-red-500"
                    >
                      <svg *ngIf="user.activo" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><line x1="9" x2="15" y1="9" y2="15"/><line x1="15" x2="9" y1="9" y2="15"/></svg>
                      <svg *ngIf="!user.activo" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                    </button>
                    <button class="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-blue-500">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredUsers.length === 0" class="py-20 flex flex-col items-center justify-center text-slate-400">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" class="mb-4 text-slate-200"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" x2="19" y1="8" y2="14"/><line x1="22" x2="16" y1="11" y2="11"/></svg>
          <p class="text-lg font-medium">No se encontraron usuarios</p>
          <p class="text-sm">Prueba con otros términos de búsqueda o filtros</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class UsuariosComponent implements OnInit {
  usuarios: any[] = [];
  searchQuery: string = '';
  selectedRole: string = '';
  isLoading: boolean = false;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.isLoading = true;
    this.adminService.getUsuarios(this.selectedRole, this.searchQuery).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error cargando usuarios:', err);
        this.isLoading = false;
      }
    });
  }

  get filteredUsers() {
    return this.usuarios; // Los filtros ya se aplican en el backend
  }

  onSearchChange(): void {
    // Podríamos añadir un debounce aquí
    this.loadUsuarios();
  }

  toggleStatus(user: any): void {
    if (confirm(`¿Estás seguro de que deseas ${user.activo ? 'desactivar' : 'activar'} a ${user.nombre}?`)) {
      this.adminService.toggleUsuarioStatus(user.id).subscribe({
        next: (res) => {
          user.activo = res.activo;
        },
        error: (err) => console.error('Error al cambiar estado:', err)
      });
    }
  }
}
