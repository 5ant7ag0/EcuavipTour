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
      <!-- Header / Toolbar Única Alineada con Bordes -->
      <div class="mb-10 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 w-full">
        <!-- Buscador -->
        <div class="relative group flex-grow lg:max-w-md">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (input)="onSearchChange()"
            placeholder="Buscar por nombre, correo o cédula..." 
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm font-medium text-xs"
          >
        </div>

        <!-- Cápsula de Filtros Desplegables -->
        <div class="flex items-center gap-1.5 bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex-shrink-0">
          <select 
            [(ngModel)]="selectedRole"
            (change)="loadUsuarios()"
            class="px-3 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer min-w-[130px]"
          >
            <option value="">Cualquier Rol</option>
            <option value="admin">Admin</option>
            <option value="chofer">Choferes</option>
            <option value="cliente">Clientes</option>
          </select>

          <select 
            [(ngModel)]="selectedStatus"
            (change)="loadUsuarios()"
            class="px-3 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer min-w-[130px]"
          >
            <option value="">Cualquier Estado</option>
            <option value="true">Activos</option>
            <option value="false">Suspendidos</option>
          </select>

          <select 
            [(ngModel)]="datePreset"
            (change)="onDatePresetChange()"
            class="px-3 py-2 bg-slate-50 border-none rounded-xl text-xs font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer min-w-[130px]"
          >
            <option value="all">Todas las fechas</option>
            <option value="today">Hoy</option>
            <option value="week">Esta Semana</option>
            <option value="month">Este Mes</option>
            <option value="year">Este Año</option>
            <option value="custom">Personalizado...</option>
          </select>

          <button 
            *ngIf="hasActiveFilters"
            (click)="clearFilters()"
            class="w-8 h-8 flex items-center justify-center text-red-500 hover:bg-red-50 rounded-xl transition-all"
            title="Limpiar filtros"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>
      </div>

      <!-- Controles de Fecha Personalizada -->
      <div *ngIf="datePreset === 'custom'" class="flex items-center gap-4 bg-slate-50 p-4 rounded-[2rem] border border-slate-100 animate-in fade-in slide-in-from-top-2">
        <div class="flex items-center gap-2">
          <label class="text-[10px] font-black uppercase text-slate-400">Desde</label>
          <input 
            type="date" 
            [(ngModel)]="customStartDate"
            (change)="loadUsuarios()"
            class="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
        </div>
        <div class="flex items-center gap-2">
          <label class="text-[10px] font-black uppercase text-slate-400">Hasta</label>
          <input 
            type="date" 
            [(ngModel)]="customEndDate"
            (change)="loadUsuarios()"
            class="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
        </div>
      </div>

      <!-- Tabla de Usuarios -->
      <div class="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50/50 border-b border-slate-100">
                <th class="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <div class="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    USUARIO
                  </div>
                </th>
                <th class="px-4 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <div class="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><line x1="7" y1="8" x2="17" y2="8"/><line x1="7" y1="12" x2="13" y2="12"/><line x1="7" y1="16" x2="11" y2="16"/></svg>
                    CÉDULA
                  </div>
                </th>
                <th class="px-4 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <div class="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 9.22a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.82 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17l.92-.08Z"/></svg>
                    CONTACTO
                  </div>
                </th>
                <th class="px-4 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <div class="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    ROL
                  </div>
                </th>
                <th *ngIf="selectedRole === 'chofer'" class="px-4 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">VIAJES</th>
                <th *ngIf="selectedRole === 'chofer'" class="px-4 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">CALIF.</th>
                
                <th class="px-4 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <div class="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                    REGISTRO
                  </div>
                </th>
                <th class="px-4 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400">
                  <div class="flex items-center gap-2">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    ESTADO
                  </div>
                </th>
                <th class="px-6 py-5 text-[11px] font-bold uppercase tracking-widest text-slate-400 text-right">EDITAR</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-50">
              <tr *ngFor="let user of filteredUsers" class="hover:bg-slate-50/30 transition-colors group cursor-pointer" [class.bg-blue-50]="editingUserId === user.id" (click)="onRowClick(user)">
                
                <!-- Identidad (Foto, Nombre y Correo) -->
                <td class="px-6 py-4" [class.min-w-[320px]]="editingUserId === user.id">
                  <div class="flex items-center gap-3">
                    <!-- Contenedor de Foto con Trigger de Edición -->
                    <div 
                      (click)="editingUserId === user.id ? photoInput.click() : null"
                      [class.cursor-pointer]="editingUserId === user.id"
                      [class.ring-2]="editingUserId === user.id"
                      class="relative w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold border-2 border-white shadow-sm overflow-hidden text-xs flex-shrink-0 group/photo transition-all aspect-square ring-blue-500/30"
                    >
                      <img *ngIf="user.foto_perfil_url" [src]="'http://localhost:5001/' + user.foto_perfil_url" class="w-full h-full object-cover rounded-full">
                      <span *ngIf="!user.foto_perfil_url">{{ user.nombre.charAt(0) }}</span>
                      
                      <!-- Overlay de Edición (Solo visible en modo edición) -->
                      <div *ngIf="editingUserId === user.id" class="absolute inset-0 bg-blue-600/60 flex items-center justify-center text-white opacity-0 group-hover/photo:opacity-100 transition-opacity">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
                      </div>
                      
                      <input #photoInput type="file" class="hidden" (change)="onPhotoSelected($event, user)" accept="image/*">
                    </div>

                    <div class="flex-grow min-w-0">
                      <div *ngIf="editingUserId === user.id" class="space-y-1.5 animate-in fade-in slide-in-from-left-2">
                        <input 
                          [(ngModel)]="editBuffer.nombre" 
                          (click)="$event.stopPropagation()" 
                          placeholder="Nombre completo"
                          class="w-full text-sm font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                        >
                        <input 
                          [(ngModel)]="editBuffer.correo" 
                          (click)="$event.stopPropagation()" 
                          placeholder="Correo electrónico"
                          class="w-full text-[11px] font-medium text-slate-500 bg-white border border-slate-200 rounded-lg px-3 py-1 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                        >
                      </div>
                      <div *ngIf="editingUserId !== user.id" class="min-w-0">
                        <div class="font-bold text-slate-700 leading-none mb-1 truncate">{{ user.nombre }}</div>
                        <div class="text-[10px] text-slate-400 font-medium truncate">{{ user.correo }}</div>
                      </div>
                    </div>
                  </div>
                </td>

                <td class="px-4 py-4">
                  <input *ngIf="editingUserId === user.id" [(ngModel)]="editBuffer.cedula" (click)="$event.stopPropagation()" class="w-full text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500/20">
                  <span *ngIf="editingUserId !== user.id" class="text-sm font-medium text-slate-600">{{ user.cedula || '---' }}</span>
                </td>

                <td class="px-4 py-4">
                  <input *ngIf="editingUserId === user.id" [(ngModel)]="editBuffer.telefono" (click)="$event.stopPropagation()" class="w-full text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500/20">
                  <span *ngIf="editingUserId !== user.id" class="text-sm font-medium text-slate-600">{{ user.telefono || 'Sin número' }}</span>
                </td>

                <td class="px-4 py-4">
                  <select *ngIf="editingUserId === user.id" [(ngModel)]="editBuffer.rol" (click)="$event.stopPropagation()" class="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500/20">
                    <option value="admin">ADMIN</option>
                    <option value="chofer">CHOFER</option>
                    <option value="cliente">CLIENTE</option>
                  </select>
                  <span *ngIf="editingUserId !== user.id" [ngClass]="user.rol === 'admin' ? 'bg-purple-100 text-purple-700' : (user.rol === 'chofer' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-700')" class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider">
                    {{ user.rol }}
                  </span>
                </td>

                <td *ngIf="selectedRole === 'chofer'" class="px-4 py-4 text-xs font-bold text-slate-600">
                  {{ user.viajes_completados || 0 }}
                </td>
                <td *ngIf="selectedRole === 'chofer'" class="px-4 py-4 text-xs font-bold text-amber-500">
                  {{ (user.promedio_calificacion || 0) | number:'1.1-1' }}★
                </td>

                <td class="px-4 py-4 text-[11px] text-slate-400 font-medium">
                  {{ user.fecha_registro | date:'dd/MM/yy' }}
                </td>

                <td class="px-4 py-4">
                  <select *ngIf="editingUserId === user.id" [(ngModel)]="editBuffer.activo" (click)="$event.stopPropagation()" class="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded px-2 py-1 focus:ring-2 focus:ring-blue-500/20">
                    <option [ngValue]="true">ACTIVO</option>
                    <option [ngValue]="false">SUSPENDIDO</option>
                  </select>
                  <div *ngIf="editingUserId !== user.id" class="flex items-center gap-1.5">
                    <div [class]="user.activo ? 'w-1.5 h-1.5 rounded-full bg-green-500' : 'w-1.5 h-1.5 rounded-full bg-slate-300'"></div>
                    <span [class]="user.activo ? 'text-green-600 text-[11px] font-bold' : 'text-slate-400 text-[11px] font-medium'">
                      {{ user.activo ? 'Activo' : 'Suspendido' }}
                    </span>
                  </div>
                </td>

                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button *ngIf="editingUserId === user.id && hasChanges()" (click)="saveChanges(); $event.stopPropagation()" class="px-3 py-1.5 bg-green-500 text-white text-[10px] font-black rounded-lg shadow-sm hover:bg-green-600 transition-all flex items-center gap-1">
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                      GUARDAR
                    </button>
                    <button *ngIf="editingUserId === user.id" (click)="cancelEdit(); $event.stopPropagation()" class="px-3 py-1.5 bg-slate-100 text-slate-500 text-[10px] font-black rounded-lg hover:bg-slate-200 transition-all">
                      CANCELAR
                    </button>
                    <button *ngIf="editingUserId !== user.id" class="px-3 py-1.5 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-blue-600 hover:text-white">
                      EDITAR
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
  selectedStatus: string = '';
  selectedOrder: string = 'desc';
  datePreset: string = 'all';
  customStartDate: string = '';
  customEndDate: string = '';
  isLoading: boolean = false;
  editingUserId: number | null = null;
  editBuffer: any = null;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadUsuarios();
  }

  get hasActiveFilters(): boolean {
    return !!this.searchQuery || !!this.selectedRole || !!this.selectedStatus || this.datePreset !== 'all';
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.datePreset = 'all';
    this.customStartDate = '';
    this.customEndDate = '';
    this.selectedOrder = 'desc';
    this.loadUsuarios();
  }

  onDatePresetChange(): void {
    if (this.datePreset === 'custom') {
      return; // El usuario elegirá manualmente
    }
    this.loadUsuarios();
  }

  loadUsuarios(): void {
    this.isLoading = true;
    let start: string | undefined;
    let end: string | undefined;

    const now = new Date();
    
    if (this.datePreset === 'today') {
      start = new Date(now.setHours(0,0,0,0)).toISOString();
    } else if (this.datePreset === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      start = weekAgo.toISOString();
    } else if (this.datePreset === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(now.getMonth() - 1);
      start = monthAgo.toISOString();
    } else if (this.datePreset === 'year') {
      const yearAgo = new Date();
      yearAgo.setFullYear(now.getFullYear() - 1);
      start = yearAgo.toISOString();
    } else if (this.datePreset === 'custom') {
      if (this.customStartDate) start = new Date(this.customStartDate).toISOString();
      if (this.customEndDate) end = new Date(this.customEndDate).toISOString();
    }

    this.adminService.getUsuarios(
      this.selectedRole, 
      this.searchQuery, 
      this.selectedStatus, 
      this.selectedOrder,
      start,
      end
    ).subscribe({
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

  onRowClick(user: any): void {
    if (this.editingUserId !== user.id) {
      this.startEdit(user);
    }
  }

  onPhotoSelected(event: any, user: any): void {
    const file = event.target.files[0];
    if (file) {
      this.adminService.updateUsuarioPhotoAdmin(user.id, file).subscribe({
        next: (res) => {
          // Actualizar la URL de la foto en la lista local para reflejo inmediato
          user.foto_perfil_url = res.foto_perfil_url;
          if (this.editingUserId === user.id) {
            this.editBuffer.foto_perfil_url = res.foto_perfil_url;
          }
        },
        error: (err) => console.error('Error actualizando foto:', err)
      });
    }
  }

  startEdit(user: any): void {
    this.editingUserId = user.id;
    this.editBuffer = { ...user };
  }

  cancelEdit(): void {
    this.editingUserId = null;
    this.editBuffer = null;
  }

  hasChanges(): boolean {
    if (!this.editBuffer) return false;
    const original = this.usuarios.find(u => u.id === this.editingUserId);
    if (!original) return false;
    
    return JSON.stringify(original) !== JSON.stringify(this.editBuffer);
  }

  saveChanges(): void {
    if (!this.editBuffer) return;

    if (confirm('¿Deseas guardar los cambios realizados en este usuario?')) {
      this.isLoading = true;
      this.adminService.updateUsuarioAdmin(this.editBuffer.id, {
        rol: this.editBuffer.rol,
        activo: this.editBuffer.activo,
        nombre: this.editBuffer.nombre,
        correo: this.editBuffer.correo,
        cedula: this.editBuffer.cedula,
        telefono: this.editBuffer.telefono
      }).subscribe({
        next: (res) => {
          const index = this.usuarios.findIndex(u => u.id === this.editingUserId);
          if (index !== -1) {
            this.usuarios[index] = { ...this.editBuffer };
          }
          this.cancelEdit();
          this.isLoading = false;
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          alert('Error al guardar los cambios');
        }
      });
    }
  }

  get filteredUsers() {
    return this.usuarios;
  }

  onSearchChange(): void {
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
