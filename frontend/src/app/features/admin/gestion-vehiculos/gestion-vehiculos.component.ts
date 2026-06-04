import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../core/services/admin.service';

@Component({
  selector: 'app-gestion-vehiculos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-8">
      <!-- Header / Toolbar Única Alineada con Bordes -->
      <div class="mb-10 flex flex-wrap lg:flex-nowrap items-center justify-between gap-4 w-full">
        <!-- Buscador (Ahora se ancla a la izquierda) -->
        <div class="relative group flex-grow lg:max-w-md">
          <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input 
            type="text" 
            [(ngModel)]="searchQuery"
            (input)="onSearch()"
            placeholder="Buscar por placa, marca, modelo o chofer..." 
            class="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm font-medium text-xs"
          >
        </div>

        <!-- Cápsula de Filtros Desplegables -->
        <div class="flex items-center gap-1.5 bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex-shrink-0">
          <input 
            type="text" 
            [(ngModel)]="selectedAnio"
            (input)="onSearch()"
            placeholder="Año" 
            class="w-16 px-3 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none"
          >
          <select [(ngModel)]="selectedTipo" (change)="cargarVehiculos()" class="px-3 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer min-w-[80px]">
            <option value="">Tipo</option>
            <option value="Sedán">Sedán</option>
            <option value="SUV">SUV</option>
            <option value="Furgoneta">Furgoneta</option>
          </select>
          <select [(ngModel)]="selectedAsientos" (change)="cargarVehiculos()" class="px-3 py-2 bg-slate-50 border-none rounded-xl text-[10px] font-bold text-slate-600 focus:ring-2 focus:ring-blue-500/20 outline-none cursor-pointer min-w-[80px]">
            <option value="">Cap.</option>
            <option value="4">4</option>
            <option value="7">7</option>
            <option value="+7">+7</option>
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

        <!-- Cápsula de Estados -->
        <div class="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex-shrink-0">
          <button (click)="filtrar('pendiente')" [class.bg-blue-600]="filtro === 'pendiente'" [class.text-white]="filtro === 'pendiente'" class="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Pendientes</button>
          <button (click)="filtrar('activo')" [class.bg-blue-600]="filtro === 'activo'" [class.text-white]="filtro === 'activo'" class="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Activos</button>
          <button (click)="filtrar('')" [class.bg-blue-600]="filtro === ''" [class.text-white]="filtro === ''" class="px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all">Todos</button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="flex flex-col items-center justify-center py-20">
        <div class="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p class="mt-4 text-slate-400 font-bold uppercase tracking-widest animate-pulse">Cargando unidades...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && vehiculos.length === 0" class="bg-white rounded-[2.5rem] p-20 text-center shadow-xl shadow-slate-200/50 border border-slate-100">
        <div class="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="text-slate-300"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C2.1 10.3 2 10.6 2 11v5c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
        </div>
        <h3 class="text-xl font-black text-slate-900">No hay vehículos por revisar</h3>
        <p class="text-slate-500 mt-2">Todas las solicitudes de transporte han sido procesadas.</p>
      </div>

      <!-- Grid de Vehículos -->
      <div *ngIf="!loading && vehiculos.length > 0" class="grid grid-cols-1 lg:grid-cols-2 2xl:grid-cols-3 gap-6">
        <div *ngFor="let v of vehiculos" class="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex flex-col gap-5 animate-in fade-in slide-in-from-bottom-4 duration-500">
          
          <!-- Header: Marca/Modelo & Estado -->
          <div class="flex items-start justify-between gap-4">
            <div class="min-w-0">
              <h3 class="text-xl font-black text-slate-900 truncate leading-tight uppercase">{{ (v.marca || '') + ' ' + (v.modelo || '') }}</h3>
              <div class="flex items-center gap-1.5 mt-1.5 flex-wrap">
                <span class="text-[10px] font-black text-blue-600 uppercase tracking-widest">{{ v.tipo_vehiculo }}</span>
                <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">{{ v.color || 'Sin Color' }}</span>
                <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                <span class="text-[10px] font-black text-slate-500 uppercase tracking-widest">{{ v.capacidad_max || '0' }} Asientos</span>
                <span class="w-1 h-1 rounded-full bg-slate-300"></span>
                <span class="text-[10px] font-black text-slate-400 uppercase tracking-widest">{{ v.anio || '----' }}</span>
              </div>
            </div>
            <div [ngClass]="{
              'bg-amber-50 text-amber-600 border-amber-200': v.estado === 'pendiente',
              'bg-emerald-50 text-emerald-600 border-emerald-200': v.estado === 'activo',
              'bg-red-50 text-red-600 border-red-200': v.estado === 'rechazado'
            }" class="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shrink-0 bg-white">
              {{ v.estado }}
            </div>
          </div>

          <!-- Body: Photo & Docs -->
          <div class="flex gap-4">
            <!-- Left: Photo -->
            <div class="flex-1">
              <div class="aspect-video rounded-2xl overflow-hidden bg-slate-50 border border-slate-100 relative group">
                <img *ngIf="v.foto_auto_url" [src]="'http://localhost:5001/' + v.foto_auto_url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500">
                <div class="absolute bottom-2 left-2">
                  <span class="text-white font-black text-[9px] uppercase tracking-widest bg-slate-900/80 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-white/20 shadow-lg">{{ v.placa }}</span>
                </div>
              </div>
            </div>

            <!-- Right: Small Docs -->
            <div class="flex flex-col gap-2 shrink-0">
              <button (click)="verDoc(v.foto_matricula_url)" class="group w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-1 hover:bg-blue-600 hover:border-blue-600 transition-all duration-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-blue-600 group-hover:text-white transition-colors"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <span class="text-[7px] font-black uppercase tracking-tight text-slate-500 group-hover:text-white transition-colors">MATRÍCULA</span>
              </button>
              
              <button (click)="verDoc(v.foto_licencia_url)" class="group w-16 h-16 rounded-xl bg-slate-50 border border-slate-100 flex flex-col items-center justify-center gap-1 hover:bg-blue-600 hover:border-blue-600 transition-all duration-300">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-blue-600 group-hover:text-white transition-colors"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                <span class="text-[7px] font-black uppercase tracking-tight text-slate-500 group-hover:text-white transition-colors">LICENCIA</span>
              </button>
            </div>
          </div>

          <!-- Driver Info -->
          <div class="bg-slate-50 rounded-2xl p-3 border border-slate-100/60">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-8 h-8 rounded-lg bg-white border border-slate-200 flex items-center justify-center font-black text-slate-400 text-xs shrink-0">
                {{ v.chofer.nombre.charAt(0) }}
              </div>
              <p class="text-xs font-black text-slate-800 truncate">{{ v.chofer.nombre }}</p>
            </div>
            <div class="flex flex-col gap-1 pl-11 -mt-1">
              <div class="flex items-center gap-2 text-[10px] font-bold text-slate-500">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-blue-500"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                {{ v.chofer.telefono }}
              </div>
              <div class="flex items-center gap-2 text-[10px] font-bold text-slate-400 truncate">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" class="text-blue-500"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
                {{ v.chofer.correo }}
              </div>
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="flex gap-3 pt-2">
            <button 
              *ngIf="v.estado !== 'activo'"
              (click)="cambiarEstado(v.id, 'activo')"
              class="flex-1 py-3 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-600/20">
              Aprobar
            </button>
            <button 
              *ngIf="v.estado === 'pendiente'"
              (click)="cambiarEstado(v.id, 'rechazado')"
              class="flex-1 py-3 bg-white text-red-500 border border-red-50 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95">
              Rechazar
            </button>
            <button 
              *ngIf="v.estado === 'activo'"
              (click)="cambiarEstado(v.id, 'pendiente')"
              class="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all active:scale-95">
              Suspender
            </button>
          </div>
        </div>
      </div>

      <!-- Modal Visor Imagen (Simple) -->
      <div *ngIf="showModal" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md" (click)="showModal = false">
        <img [src]="'http://localhost:5001/' + modalImg" class="max-w-full max-h-full rounded-2xl shadow-2xl animate-in zoom-in duration-300">
        <button class="absolute top-8 right-8 text-white hover:rotate-90 transition-transform">
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </button>
      </div>
    </div>
  `
})
export class GestionVehiculosComponent implements OnInit {
  vehiculos: any[] = [];
  filtro: string = 'pendiente';
  loading: boolean = false;
  showModal = false;
  modalImg = '';

  // Filtros Inteligentes
  searchQuery: string = '';
  selectedMarca: string = '';
  selectedModelo: string = '';
  selectedAnio: string = '';
  selectedTipo: string = '';
  selectedAsientos: string = '';

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.cargarVehiculos();
  }

  get hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.selectedTipo || this.selectedAsientos || this.selectedMarca || this.selectedModelo || this.selectedAnio);
  }

  onSearch() {
    // Podríamos añadir un debounce aquí si fuera necesario
    this.cargarVehiculos();
  }

  clearFilters() {
    this.searchQuery = '';
    this.selectedMarca = '';
    this.selectedModelo = '';
    this.selectedAnio = '';
    this.selectedTipo = '';
    this.selectedAsientos = '';
    this.cargarVehiculos();
  }

  cargarVehiculos() {
    this.loading = true;
    this.adminService.getVehiculos(
      this.filtro, 
      this.searchQuery,
      this.selectedMarca,
      this.selectedModelo,
      this.selectedAnio,
      this.selectedTipo,
      this.selectedAsientos
    ).subscribe({
      next: (data) => {
        // Filtrar localmente en el frontend para Año, Tipo y Capacidad
        let filtered = [...data];

        // 1. Filtrar por Año (selectedAnio)
        if (this.selectedAnio && this.selectedAnio.trim() !== '') {
          const searchAnio = this.selectedAnio.trim();
          filtered = filtered.filter(v => v.anio && v.anio.toString().includes(searchAnio));
        }

        // 2. Filtrar por Tipo (selectedTipo)
        if (this.selectedTipo && this.selectedTipo !== '') {
          const normalize = (str: string) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase() : '';
          const targetTipo = normalize(this.selectedTipo);
          filtered = filtered.filter(v => normalize(v.tipo_vehiculo) === targetTipo);
        }

        // 3. Filtrar por Capacidad / Asientos (selectedAsientos)
        if (this.selectedAsientos && this.selectedAsientos !== '') {
          if (this.selectedAsientos === '4') {
            filtered = filtered.filter(v => v.capacidad_max === 4);
          } else if (this.selectedAsientos === '7') {
            filtered = filtered.filter(v => v.capacidad_max === 7);
          } else if (this.selectedAsientos === '+7') {
            filtered = filtered.filter(v => v.capacidad_max > 7);
          }
        }

        this.vehiculos = filtered;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error:', err);
        this.loading = false;
      }
    });
  }

  filtrar(estado: string) {
    this.filtro = estado;
    this.cargarVehiculos();
  }

  cambiarEstado(id: number, estado: string) {
    if (confirm(`¿Estás seguro de cambiar el estado a ${estado}?`)) {
      this.adminService.cambiarEstadoVehiculo(id, estado).subscribe({
        next: () => {
          this.cargarVehiculos();
        },
        error: (err) => alert('Error al cambiar estado')
      });
    }
  }

  verDoc(url: string) {
    if (!url) {
      alert('No hay imagen cargada para este documento.');
      return;
    }
    this.modalImg = url;
    this.showModal = true;
  }
}
