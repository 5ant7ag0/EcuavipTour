import { Component, OnInit, ViewChild, ElementRef, NgZone, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SoapService } from '../../../core/services/soap.service';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';

declare var google: any;

@Component({
  selector: 'app-frecuencias',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="p-6 md:p-8 space-y-8 font-sans max-w-7xl mx-auto pb-32">

      <div class="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        <!-- ========================================== -->
        <!-- FORM CARD: CREAR NUEVA FRECUENCIA (5 cols) -->
        <!-- ========================================== -->
        <div class="lg:col-span-5 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30 p-6 md:p-8 relative overflow-hidden">
          <!-- Background Glow decoration -->
          <div class="absolute -right-16 -top-16 w-36 h-36 bg-blue-500/5 rounded-full blur-2xl"></div>

          <h2 class="text-lg font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2">
            <svg class="text-blue-500" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
            {{ modoEdicion ? 'Editar Frecuencia' : 'Crear Frecuencia' }}
          </h2>

          <form (ngSubmit)="guardarFrecuencia()" class="space-y-5">
            
            <!-- Origen -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Dirección de Origen</label>
              <div class="relative">
                <input 
                  #origenInput
                  type="text" 
                  [(ngModel)]="nuevaFrecuencia.dirOrigen" 
                  (change)="onFormChange()"
                  name="dirOrigen"
                  placeholder="Ej: Ambato, Terminal Terrestre"
                  required
                  class="w-full pl-4 pr-3 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all"
                >
              </div>
            </div>

            <!-- Destino -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Dirección de Destino</label>
              <input 
                #destinoInput
                type="text" 
                [(ngModel)]="nuevaFrecuencia.dirDestino" 
                (change)="onFormChange()"
                name="dirDestino"
                placeholder="Ej: Quito, Terminal Quitumbe"
                required
                class="w-full pl-4 pr-3 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all"
              >
            </div>

            <!-- Fecha & Hora de Salida -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Fecha Salida</label>
                <input 
                  type="date" 
                  [(ngModel)]="nuevaFrecuencia.fecha" 
                  (change)="onFormChange()"
                  name="fecha"
                  required
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold text-slate-700 transition-all"
                >
              </div>
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Hora Salida</label>
                <input 
                  type="time" 
                  [(ngModel)]="nuevaFrecuencia.hora" 
                  (change)="onFormChange()"
                  name="hora"
                  required
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold text-slate-700 transition-all"
                >
              </div>
            </div>

            <!-- Chofer Select -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chofer Asignado</label>
              <div class="relative">
                <select 
                  [(ngModel)]="nuevaFrecuencia.choferId" 
                  (change)="onChoferChange(); onFormChange()"
                  name="choferId"
                  required
                  class="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold text-slate-700 transition-all appearance-none cursor-pointer"
                >
                  <option value="">Seleccione un chofer...</option>
                  <option *ngFor="let c of choferesFiltrados" [value]="c.id">
                    {{ c.nombre }} ({{ c.placa }})
                  </option>
                </select>
                <div class="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="6 9 12 15 18 9"></polyline>
                  </svg>
                </div>
              </div>

              <!-- Vehicle Preview Info (Auto-assigned according to Chofer choice) -->
              <div *ngIf="vehiculoAsociado" class="mt-2 p-3 bg-blue-50/50 border border-blue-100 rounded-2xl text-[11px] text-blue-800 font-semibold flex flex-col gap-1">
                <div class="flex items-center justify-between">
                  <span>Placa: <strong class="uppercase text-slate-900">{{ vehiculoAsociado.placa }}</strong></span>
                  <span class="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">{{ vehiculoAsociado.marca }} {{ vehiculoAsociado.modelo }}</span>
                </div>
                <div>Asientos Máximos: <strong>{{ vehiculoAsociado.capacidad_max }}</strong> pasajeros.</div>
              </div>
            </div>

            <!-- Price & Capacity row -->
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Precio Asiento ($)</label>
                <input 
                  type="number" 
                  step="0.01"
                  min="0.01"
                  [(ngModel)]="nuevaFrecuencia.precioAsiento" 
                  name="precioAsiento"
                  placeholder="Ej: 12.50"
                  required
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold text-slate-700 transition-all"
                >
              </div>

              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Capacidad Total</label>
                <input 
                  type="number" 
                  [(ngModel)]="nuevaFrecuencia.capacidadTotal" 
                  name="capacidadTotal"
                  readonly
                  class="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-bold text-slate-500 focus:outline-none"
                  title="Se calcula automáticamente según el vehículo del chofer"
                >
              </div>
            </div>

            <!-- Errors and Success Messages -->
            <div *ngIf="formError" class="p-4 bg-rose-50 text-rose-700 border border-rose-100 rounded-2xl text-xs font-semibold flex items-start gap-2">
              <svg class="shrink-0 text-rose-500 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              <span>{{ formError }}</span>
            </div>

            <div *ngIf="formWarning" class="p-4 bg-amber-50 text-amber-800 border border-amber-200/80 rounded-2xl text-xs font-semibold flex flex-col gap-3">
              <div class="flex items-start gap-2">
                <svg class="shrink-0 text-amber-500 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                <span>{{ formWarning }}</span>
              </div>
              <button type="button" (click)="confirmarAdvertencia()" class="w-full bg-amber-600 hover:bg-amber-700 text-white font-black uppercase tracking-wider py-2 rounded-xl text-[10px] transition-all active:scale-95">
                Confirmar y Guardar
              </button>
            </div>

            <div *ngIf="formSuccess" class="p-4 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-xs font-semibold flex items-start gap-2">
              <svg class="shrink-0 text-emerald-500 mt-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
              <span>{{ formSuccess }}</span>
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              [disabled]="saving || !nuevaFrecuencia.choferId"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider py-4 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-95 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <span *ngIf="saving" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              {{ saving ? 'Guardando...' : (modoEdicion ? 'Guardar Cambios' : 'Crear Frecuencia') }}
            </button>

            <button 
              *ngIf="modoEdicion"
              type="button" 
              (click)="cancelarEdicion()"
              class="w-full mt-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase tracking-wider py-3.5 rounded-2xl transition-all text-xs flex items-center justify-center"
            >
              Cancelar Edición
            </button>

          </form>
        </div>

        <!-- ========================================== -->
        <!-- LIST CARD: RUTAS ACTIVAS CON FILTROS (7 cols) -->
        <!-- ========================================== -->
        <div class="lg:col-span-7 bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-100/30 p-6 md:p-8 flex flex-col min-h-[500px]">
          
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-lg font-black text-slate-900 tracking-tight">Frecuencias Activas</h2>
            <div class="flex items-center gap-3">
              <!-- Sutil Clear Filters (Conditional) -->
              <button 
                *ngIf="hasActiveFilters()"
                (click)="restablecerFiltros()"
                class="px-3 py-1.5 bg-red-50 text-red-600 border border-red-100 text-[10px] font-black rounded-xl hover:bg-red-100 hover:text-red-700 transition-all uppercase tracking-widest flex items-center gap-1"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                Limpiar
              </button>
              <span class="bg-gray-100 text-gray-600 px-3.5 py-1 rounded-full text-xs font-black uppercase tracking-wider">
                {{ filteredViajes.length }} Rutas
              </span>
            </div>
          </div>

          <!-- Advanced Filter Header (Apple-Style Glass) -->
          <div class="bg-slate-50/80 border border-slate-100/60 p-5 rounded-3xl space-y-4 mb-6">
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- Search by driver -->
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Buscar Chofer</label>
                <input 
                  type="text" 
                  [(ngModel)]="filtros.busquedaChofer"
                  (input)="filtrarLista()"
                  placeholder="Ej: Stalyn"
                  class="w-full pl-4 pr-3 py-3 bg-white border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all"
                >
              </div>

              <!-- Search by Vehicle (Brand/Model/Plate) -->
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Buscar Vehículo / Placa</label>
                <input 
                  type="text" 
                  [(ngModel)]="filtros.busquedaVehiculo"
                  (input)="filtrarLista()"
                  placeholder="Ej: Chevrolet, HBA-123"
                  class="w-full pl-4 pr-3 py-3 bg-white border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold text-slate-700 placeholder-slate-400 transition-all"
                >
              </div>
            </div>

            <!-- Capsule Buttons Row -->
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Filter by status (Capsule style) -->
              <div class="space-y-1.5">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Estado</label>
                <div class="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/80">
                  <button type="button" (click)="filtros.estado = ''; filtrarLista()" 
                          [class.bg-blue-600]="filtros.estado === ''" 
                          [class.text-white]="filtros.estado === ''" 
                          [class.bg-transparent]="filtros.estado !== ''"
                          [class.text-slate-500]="filtros.estado !== ''"
                          class="flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all">
                    Todos
                  </button>
                  <button type="button" (click)="filtros.estado = 'PROGRAMADO'; filtrarLista()" 
                          [class.bg-blue-600]="filtros.estado === 'PROGRAMADO'" 
                          [class.text-white]="filtros.estado === 'PROGRAMADO'" 
                          [class.bg-transparent]="filtros.estado !== 'PROGRAMADO'"
                          [class.text-slate-500]="filtros.estado !== 'PROGRAMADO'"
                          class="flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all text-ellipsis overflow-hidden whitespace-nowrap">
                    Prog
                  </button>
                  <button type="button" (click)="filtros.estado = 'EN_RUTA'; filtrarLista()" 
                          [class.bg-blue-600]="filtros.estado === 'EN_RUTA'" 
                          [class.text-white]="filtros.estado === 'EN_RUTA'" 
                          [class.bg-transparent]="filtros.estado !== 'EN_RUTA'"
                          [class.text-slate-500]="filtros.estado !== 'EN_RUTA'"
                          class="flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all text-ellipsis overflow-hidden whitespace-nowrap">
                    Ruta
                  </button>
                </div>
              </div>

              <!-- Filter by Seat Capacity (Capsule style) -->
              <div class="space-y-1.5 md:col-span-2">
                <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Capacidad Asientos</label>
                <div class="flex items-center gap-1 bg-white p-1 rounded-2xl border border-slate-200/80">
                  <button type="button" (click)="filtros.asientos = ''; filtrarLista()" 
                          [class.bg-blue-600]="filtros.asientos === ''" 
                          [class.text-white]="filtros.asientos === ''" 
                          [class.bg-transparent]="filtros.asientos !== ''"
                          [class.text-slate-500]="filtros.asientos !== ''"
                          class="flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all">
                    Todas
                  </button>
                  <button type="button" (click)="filtros.asientos = '4'; filtrarLista()" 
                          [class.bg-blue-600]="filtros.asientos === '4'" 
                          [class.text-white]="filtros.asientos === '4'" 
                          [class.bg-transparent]="filtros.asientos !== '4'"
                          [class.text-slate-500]="filtros.asientos !== '4'"
                          class="flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all">
                    4 Pax
                  </button>
                  <button type="button" (click)="filtros.asientos = '7'; filtrarLista()" 
                          [class.bg-blue-600]="filtros.asientos === '7'" 
                          [class.text-white]="filtros.asientos === '7'" 
                          [class.bg-transparent]="filtros.asientos !== '7'"
                          [class.text-slate-500]="filtros.asientos !== '7'"
                          class="flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all">
                    7 Pax
                  </button>
                  <button type="button" (click)="filtros.asientos = '15'; filtrarLista()" 
                          [class.bg-blue-600]="filtros.asientos === '15'" 
                          [class.text-white]="filtros.asientos === '15'" 
                          [class.bg-transparent]="filtros.asientos !== '15'"
                          [class.text-slate-500]="filtros.asientos !== '15'"
                          class="flex-1 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all">
                    15 Pax
                  </button>
                </div>
              </div>
            </div>

          </div>

          <!-- Loading View -->
          <div *ngIf="loading" class="flex-1 flex flex-col items-center justify-center py-20">
            <div class="animate-spin h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full mb-4"></div>
            <p class="text-xs font-black uppercase tracking-widest text-slate-400 animate-pulse">Cargando frecuencias...</p>
          </div>

          <!-- Empty View -->
          <div *ngIf="!loading && filteredViajes.length === 0" class="flex-1 flex flex-col items-center justify-center py-16 text-center border-2 border-dashed border-gray-100 rounded-3xl">
            <div class="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
            </div>
            <h3 class="text-sm font-bold text-slate-800">No se encontraron frecuencias</h3>
            <p class="text-xs text-slate-400 font-semibold mt-1">Ajuste los filtros o registre una nueva ruta programada.</p>
          </div>

          <div *ngIf="!loading && filteredViajes.length > 0" class="flex-1 overflow-y-auto space-y-4 max-h-[550px] pr-2 no-scrollbar">
            <div 
              *ngFor="let viaje of filteredViajes"
              (click)="abrirDetalleViaje(viaje)"
              class="border border-gray-100 hover:border-blue-200 rounded-3xl p-5 bg-white shadow-sm hover:shadow-md transition-all duration-300 relative group flex flex-col gap-3.5 cursor-pointer"
            >
              <!-- Top Row: Origin to Destino + Status -->
              <div class="flex items-start justify-between flex-wrap gap-2">
                <div class="flex items-center gap-2 font-black text-sm text-slate-900 tracking-tight flex-1 min-w-0">
                  <span class="truncate block max-w-[140px] md:max-w-[180px]" [title]="viaje.dirOrigen">{{ getCiudad(viaje.dirOrigen) }}</span>
                  <svg class="text-blue-500 shrink-0" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                  <span class="truncate block max-w-[140px] md:max-w-[180px]" [title]="viaje.dirDestino">{{ getCiudad(viaje.dirDestino) }}</span>
                </div>
                <span [class]="getStatusClass(viaje.estado) + ' px-3 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider border shrink-0'">
                  {{ viaje.estado }}
                </span>
              </div>

              <!-- Route full details -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-500 border-t border-gray-50 pt-3.5">
                <div>
                  <span class="block text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Fecha y Hora</span>
                  <span class="text-slate-700 font-bold block">{{ formatFecha(viaje.fechaHoraSalida) }}</span>
                </div>
                <div>
                  <span class="block text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Chofer</span>
                  <span class="text-slate-700 font-bold block truncate" [title]="viaje.chofer?.nombre">{{ viaje.chofer?.nombre || 'No asignado' }}</span>
                </div>
                <div>
                  <span class="block text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Vehículo</span>
                  <span class="text-slate-700 font-bold block truncate" [title]="(viaje.vehiculo?.marca || '') + ' ' + (viaje.vehiculo?.modelo || '')">{{ viaje.vehiculo?.marca }} {{ viaje.vehiculo?.modelo }} ({{ viaje.vehiculo?.placa || 'S/P' }})</span>
                </div>
                <div>
                  <span class="block text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Capacidad</span>
                  <span class="text-slate-700 font-bold block text-sm">
                    {{ (viaje.capacidadTotal || 15) - (viaje.asientosDisponibles || 0) }}/{{ viaje.capacidadTotal || 15 }}
                  </span>
                </div>
              </div>

              <!-- Bottom Row: Price and Info -->
              <div class="flex items-center justify-between border-t border-gray-50 pt-3.5 mt-1">
                <div>
                  <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest block leading-none mb-1">Tarifa Individual</span>
                  <span class="text-lg font-black text-slate-900">\${{ viaje.precioAsiento | number:'1.2-2' }}</span>
                </div>
                <div class="flex items-center gap-1 text-[11px] font-black uppercase text-blue-500 tracking-wider group-hover:translate-x-1 transition-transform">
                  Ver Detalles
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </div>

              <!-- Dynamic Progress Bar Row -->
              <div class="border-t border-slate-50 pt-3.5 mt-1 space-y-2.5">
                <div class="flex items-center justify-between text-[10px] font-bold">
                  <span class="text-slate-400 uppercase tracking-wider">Estado Logístico</span>
                  <span [class]="getProgressTextClass(viaje.estado) + ' font-black tracking-wide uppercase'">
                    {{ getViajeProgressText(viaje) }}
                  </span>
                </div>
                
                <!-- Progress Line Bar -->
                <div class="relative w-full h-2 bg-slate-100/80 rounded-full overflow-hidden">
                  <div 
                    [class]="getProgressFillClass(viaje.estado) + ' h-full transition-all duration-700 rounded-full'"
                    [style.width.%]="getViajeProgressPercent(viaje)"
                  ></div>
                </div>

                <!-- Labels representing route extremes and status dots -->
                <div class="flex items-center justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                  <div class="flex items-center gap-1.5">
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                    <span class="truncate max-w-[120px]" [title]="viaje.dirOrigen">{{ getCiudad(viaje.dirOrigen) }}</span>
                  </div>
                  
                  <span *ngIf="viaje.estado === 'EN_RUTA'" class="text-[8px] px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-md font-black tracking-widest animate-pulse border border-blue-100">
                    EN RUTA
                  </span>
                  
                  <div class="flex items-center gap-1.5 justify-end">
                    <span class="truncate max-w-[120px] text-right" [title]="viaje.dirDestino">{{ getCiudad(viaje.dirDestino) }}</span>
                    <span class="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>

      <!-- ========================================== -->
      <!-- PREMIUM DETAIL MODAL (APPLE STYLE) -->
      <!-- ========================================== -->
      <div *ngIf="mostrarModalDetalle && viajeSeleccionado" class="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-slate-900/60 backdrop-blur-md animate-fade-in">
        <div class="bg-white/90 backdrop-blur-xl w-full max-w-2xl rounded-[2.5rem] border border-white/40 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-[80vh] animate-scale-up">
          
          <!-- Header (Glassmorphic) -->
          <div class="p-6 md:p-8 pb-4 border-b border-slate-100 flex items-center justify-between">
            <div>
              <span class="text-[9px] font-black uppercase text-blue-600 tracking-widest block mb-1">Detalle de Frecuencia</span>
              <h3 class="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                {{ getCiudad(viajeSeleccionado.dirOrigen) }} 
                <svg class="text-blue-500 shrink-0" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg> 
                {{ getCiudad(viajeSeleccionado.dirDestino) }}
              </h3>
            </div>
            <button 
              (click)="cerrarDetalleViaje()"
              class="p-2 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-all active:scale-95"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <!-- Tabs (Apple Segmented Control) -->
          <div class="px-6 md:px-8 py-3 bg-slate-50/50 border-b border-slate-100 flex justify-center">
            <div class="bg-slate-100 p-1 rounded-2xl flex w-full max-w-xs border border-slate-200/50">
              <button 
                type="button" 
                (click)="tabActiva = 'detalles'"
                [class.bg-white]="tabActiva === 'detalles'"
                [class.text-slate-900]="tabActiva === 'detalles'"
                [class.shadow-sm]="tabActiva === 'detalles'"
                [class.text-slate-500]="tabActiva !== 'detalles'"
                class="flex-1 py-2 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all"
              >
                Información
              </button>
              <button 
                type="button" 
                (click)="tabActiva = 'usuarios'"
                [class.bg-white]="tabActiva === 'usuarios'"
                [class.text-slate-900]="tabActiva === 'usuarios'"
                [class.shadow-sm]="tabActiva === 'usuarios'"
                [class.text-slate-500]="tabActiva !== 'usuarios'"
                class="flex-1 py-2 text-center text-xs font-black uppercase tracking-wider rounded-xl transition-all"
              >
                Pasajeros ({{ reservasAgrupadas.length }})
              </button>
            </div>
          </div>

          <!-- Scrollable Content Area -->
          <div class="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 no-scrollbar">
            
            <!-- TAB: DETALLES -->
            <div *ngIf="tabActiva === 'detalles'" class="space-y-6">
              
              <!-- Route & Status block -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="bg-slate-50/60 p-4 border border-slate-100 rounded-3xl">
                  <span class="block text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Origen completo</span>
                  <p class="text-xs font-semibold text-slate-700 leading-relaxed">{{ viajeSeleccionado.dirOrigen }}</p>
                </div>
                <div class="bg-slate-50/60 p-4 border border-slate-100 rounded-3xl">
                  <span class="block text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1.5">Destino completo</span>
                  <p class="text-xs font-semibold text-slate-700 leading-relaxed">{{ viajeSeleccionado.dirDestino }}</p>
                </div>
              </div>

              <!-- Driver details (Premium Apple Driver Avatar) -->
              <div class="p-5 border border-slate-100 rounded-3xl bg-slate-50/40 flex items-center gap-4">
                <div class="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-lg overflow-hidden relative shadow-sm">
                  <img *ngIf="getAvatarUrl(viajeSeleccionado.chofer?.foto_perfil_url)" [src]="getAvatarUrl(viajeSeleccionado.chofer?.foto_perfil_url)" class="w-full h-full object-cover">
                  <span *ngIf="!getAvatarUrl(viajeSeleccionado.chofer?.foto_perfil_url)">{{ viajeSeleccionado.chofer?.nombre?.charAt(0) || 'C' }}</span>
                </div>
                <div class="flex-1 min-w-0">
                  <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest block leading-none mb-1">Chofer Asignado</span>
                  <h4 class="text-sm font-black text-slate-900 truncate leading-snug">{{ viajeSeleccionado.chofer?.nombre || 'No asignado' }}</h4>
                  <span class="text-[10px] text-slate-500 font-bold block mt-0.5">{{ viajeSeleccionado.chofer?.correo }}</span>
                </div>
                <div class="shrink-0 text-right">
                  <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest block leading-none mb-1">Teléfono</span>
                  <span class="text-xs font-bold text-slate-700 block">{{ viajeSeleccionado.chofer?.telefono || 'N/A' }}</span>
                </div>
              </div>

              <!-- Vehicle info -->
              <div class="p-5 border border-slate-100 rounded-3xl bg-slate-50/40 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold">
                <div>
                  <span class="block text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Vehículo</span>
                  <span class="text-slate-800 font-bold">{{ viajeSeleccionado.vehiculo?.marca }} {{ viajeSeleccionado.vehiculo?.modelo }}</span>
                </div>
                <div>
                  <span class="block text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Placa</span>
                  <span class="text-slate-800 font-black uppercase">{{ viajeSeleccionado.vehiculo?.placa || 'S/P' }}</span>
                </div>
                <div>
                  <span class="block text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Color</span>
                  <span class="text-slate-800 font-bold capitalize">{{ viajeSeleccionado.vehiculo?.color || 'N/A' }}</span>
                </div>
                <div>
                  <span class="block text-[9px] text-slate-400 font-black uppercase tracking-widest mb-1">Capacidad Max</span>
                  <span class="text-slate-800 font-bold">{{ viajeSeleccionado.vehiculo?.capacidad_max || 15 }} Pasajeros</span>
                </div>
              </div>

              <!-- General Logistics & Seat statistics -->
              <div class="p-5 border border-slate-100 rounded-3xl bg-white shadow-sm space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <span class="block text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Fecha y Hora de Salida</span>
                    <span class="text-sm font-bold text-slate-900">{{ formatFecha(viajeSeleccionado.fechaHoraSalida) }}</span>
                  </div>
                  <div class="text-right">
                    <span class="block text-[9px] text-slate-400 font-black uppercase tracking-widest mb-0.5">Precio Asiento</span>
                    <span class="text-base font-black text-slate-900">\${{ viajeSeleccionado.precioAsiento | number:'1.2-2' }}</span>
                  </div>
                </div>

                <!-- Seat occupancy status -->
                <div class="space-y-2 pt-2 border-t border-slate-100">
                  <div class="flex items-center justify-between text-[11px] font-bold">
                    <span class="text-slate-400 uppercase tracking-wider">Ocupación de Asientos</span>
                    <span class="text-slate-900 font-black">
                      {{ (viajeSeleccionado.capacidadTotal || 15) - (viajeSeleccionado.asientosDisponibles || 0) }} / {{ viajeSeleccionado.capacidadTotal || 15 }} Reservados
                    </span>
                  </div>
                  <!-- Progress Bar -->
                  <div class="w-full h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div 
                      class="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                      [style.width.%]="(((viajeSeleccionado.capacidadTotal || 15) - (viajeSeleccionado.asientosDisponibles || 0)) / (viajeSeleccionado.capacidadTotal || 15)) * 100"
                    ></div>
                  </div>
                  <div class="flex items-center justify-between text-[9px] text-slate-400 font-semibold uppercase tracking-wider">
                    <span>Libres: {{ viajeSeleccionado.asientosDisponibles }}</span>
                    <span>Ocupados: {{ (viajeSeleccionado.capacidadTotal || 15) - (viajeSeleccionado.asientosDisponibles || 0) }}</span>
                  </div>
                </div>
              </div>

              <!-- Logistic state progress bar -->
              <div class="p-5 border border-slate-100 rounded-3xl bg-slate-50/40 space-y-3">
                <div class="flex items-center justify-between text-[10px] font-bold">
                  <span class="text-slate-400 uppercase tracking-wider">Progreso del Viaje</span>
                  <span [class]="getProgressTextClass(viajeSeleccionado.estado) + ' font-black uppercase tracking-wide'">
                    {{ getViajeProgressText(viajeSeleccionado) }}
                  </span>
                </div>
                <div class="relative w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    [class]="getProgressFillClass(viajeSeleccionado.estado) + ' h-full transition-all duration-700 rounded-full'"
                    [style.width.%]="getViajeProgressPercent(viajeSeleccionado)"
                  ></div>
                </div>
              </div>
            </div>

            <!-- TAB: USUARIOS / PASAJEROS -->
            <div *ngIf="tabActiva === 'usuarios'" class="space-y-4">
              
              <!-- Loading spinner for passengers -->
              <div *ngIf="cargandoReservas" class="flex flex-col items-center justify-center py-10">
                <div class="animate-spin h-8 w-8 border-3 border-blue-600 border-t-transparent rounded-full mb-3"></div>
                <p class="text-[10px] font-black uppercase tracking-wider text-slate-400">Cargando manifiesto...</p>
              </div>

              <!-- Empty passengers view -->
              <div *ngIf="!cargandoReservas && reservasFrecuencia.length === 0" class="text-center py-12 border-2 border-dashed border-slate-100 rounded-3xl">
                <div class="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 mx-auto mb-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                </div>
                <h4 class="text-xs font-bold text-slate-700">Sin pasajeros confirmados</h4>
                <p class="text-[10px] text-slate-400 font-semibold mt-1">Nadie ha reservado asientos en este viaje aún.</p>
              </div>

              <!-- Passengers list -->
              <div *ngIf="!cargandoReservas && reservasAgrupadas.length > 0" class="space-y-3">
                <div 
                  *ngFor="let reserva of reservasAgrupadas"
                  class="border border-slate-100 rounded-2xl p-4 bg-white hover:border-blue-100 transition-all flex flex-col gap-2.5"
                >
                  <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-black text-sm overflow-hidden shrink-0 shadow-sm">
                      <img *ngIf="getAvatarUrl(reserva.foto_usuario_url)" [src]="getAvatarUrl(reserva.foto_usuario_url)" class="w-full h-full object-cover">
                      <span *ngIf="!getAvatarUrl(reserva.foto_usuario_url)">{{ reserva.nombre_usuario?.charAt(0) || 'U' }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <h5 class="text-xs font-black text-slate-900 truncate leading-snug">{{ reserva.nombre_usuario }}</h5>
                      <div class="flex items-center gap-1.5 mt-0.5 flex-wrap">
                        <span class="bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md text-[9px] font-bold border border-blue-100">
                          Asientos: {{ reserva.asientos.join(', ') }}
                        </span>
                        
                        <!-- Cancelado -->
                        <span *ngIf="reserva.estado_pago === 'CANCELADO'" class="bg-rose-50 text-rose-600 border border-rose-100 px-2 py-0.5 rounded-md text-[9px] font-bold">
                          Cancelado
                        </span>
                        
                        <!-- A bordo -->
                        <span *ngIf="reserva.estado_pago !== 'CANCELADO' && haAbordado(reserva.estado_pago)" class="bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-md text-[9px] font-bold">
                          A bordo
                        </span>
                        
                        <!-- No abordado -->
                        <span *ngIf="reserva.estado_pago !== 'CANCELADO' && !haAbordado(reserva.estado_pago)" class="bg-amber-50 text-amber-700 border border-amber-100 px-2 py-0.5 rounded-md text-[9px] font-bold">
                          No abordado
                        </span>
                      </div>
                    </div>
                    
                    <!-- Passenger actions -->
                    <div *ngIf="reserva.estado_pago !== 'CANCELADO' && viajeSeleccionado.estado !== 'FINALIZADO'" class="flex items-center gap-1.5 shrink-0">
                      <!-- Reprogram button -->
                      <button 
                        (click)="reprogramandoReservaId = (reprogramandoReservaId === reserva.usuario_id ? null : reserva.usuario_id)"
                        class="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1"
                        title="Reprogramar reserva a otro viaje"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
                        Reprog
                      </button>
                      
                      <!-- Refund/Cancel button -->
                      <button 
                        (click)="cancelarGrupoReservas(reserva.reservas)"
                        class="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 text-[10px] font-black rounded-lg uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1"
                        title="Reembolsar y cancelar reserva"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                        Reembolsar
                      </button>
                    </div>
                  </div>

                  <!-- Point of boarding reference -->
                  <div class="text-[10px] text-slate-500 font-semibold border-t border-slate-50 pt-2 flex justify-between items-center flex-wrap gap-2">
                    <span>Abordaje: <strong class="text-slate-700">{{ reserva.punto_abordaje || 'Por definir' }}</strong></span>
                    <span *ngIf="reserva.reservas[0]?.pin_abordaje" class="font-mono bg-slate-50 text-slate-600 px-1.5 py-0.5 rounded border border-slate-100 text-[9px]">
                      PINs: {{ getPinsString(reserva.reservas) }}
                    </span>
                  </div>

                  <!-- Inline rescheduling form -->
                  <div *ngIf="reprogramandoReservaId === reserva.usuario_id" class="mt-3 p-3 bg-blue-50/70 rounded-2xl border border-blue-100 flex flex-col gap-2 animate-scale-up">
                    <span class="text-[9px] font-black uppercase text-blue-800 tracking-wider">Seleccionar Nuevo Viaje (Asientos disponibles)</span>
                    <div class="flex items-center gap-2">
                      <select 
                        [(ngModel)]="destinoReprogramacionId" 
                        class="flex-1 bg-white border border-blue-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
                      >
                        <option [value]="null">Seleccione un viaje disponible...</option>
                        <option *ngFor="let v of otrasFrecuenciasDisponibles" [value]="v.id">
                          {{ getCiudad(v.dirOrigen) }} → {{ getCiudad(v.dirDestino) }} ({{ formatFecha(v.fechaHoraSalida) }}) - {{ v.chofer?.nombre || 'Chofer' }}
                        </option>
                      </select>
                      <button 
                        [disabled]="!destinoReprogramacionId"
                        (click)="confirmarReprogramacionGrupo(reserva.reservas)"
                        class="p-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl active:scale-95 transition-all disabled:opacity-50"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                      <button 
                        (click)="reprogramandoReservaId = null"
                        class="p-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl active:scale-95 transition-all"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                      </button>
                    </div>
                    <div *ngIf="otrasFrecuenciasDisponibles.length === 0" class="text-[9px] text-rose-600 font-semibold mt-1">
                      No hay otros viajes programados con asientos disponibles en este momento.
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Footer Actions (Premium Apple-Style Glass) -->
          <div class="p-6 md:p-8 border-t border-slate-100 bg-slate-50/50 flex flex-col md:flex-row items-center gap-3">
            <div class="flex items-center gap-2 w-full justify-end">
              <!-- Edit button -->
              <button 
                *ngIf="viajeSeleccionado.estado !== 'FINALIZADO'"
                (click)="editarDesdeModal()"
                class="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-black rounded-2xl uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 shadow-md shadow-blue-500/10"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                Editar Frecuencia
              </button>

              <!-- Delete button -->
              <div class="relative group">
                <button 
                  [disabled]="viajeSeleccionado.estado !== 'PROGRAMADO' || tieneUsuariosActivos()"
                  (click)="eliminarDesdeModal()"
                  class="px-5 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 disabled:opacity-40 disabled:hover:bg-rose-50 disabled:cursor-not-allowed text-xs font-black rounded-2xl uppercase tracking-wider transition-all active:scale-95 flex items-center gap-1.5 border border-rose-100"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                  Eliminar Viaje
                </button>
                
                <!-- Tooltip when Delete is disabled -->
                <div 
                  *ngIf="viajeSeleccionado.estado !== 'PROGRAMADO' || tieneUsuariosActivos()" 
                  class="absolute bottom-full right-0 mb-2 w-48 bg-slate-950 text-white text-[9px] font-bold p-2.5 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none text-center"
                >
                  No se puede eliminar porque el viaje ya inició/finalizó o contiene pasajeros activos.
                </div>
              </div>

              <!-- Close button -->
              <button 
                (click)="cerrarDetalleViaje()"
                class="px-5 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black rounded-2xl uppercase tracking-wider transition-all active:scale-95"
              >
                Cerrar
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes scaleUp {
      from { transform: scale(0.95); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }
    .animate-fade-in {
      animation: fadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .animate-scale-up {
      animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
  `]
})
export class FrecuenciasComponent implements OnInit, AfterViewInit {
  @ViewChild('origenInput') origenInput!: ElementRef<HTMLInputElement>;
  @ViewChild('destinoInput') destinoInput!: ElementRef<HTMLInputElement>;

  mostrarModalDetalle = false;
  viajeSeleccionado: any = null;
  tabActiva: 'detalles' | 'usuarios' = 'detalles';
  reservasFrecuencia: any[] = [];
  cargandoReservas = false;
  reprogramandoReservaId: number | null = null;
  destinoReprogramacionId: number | null = null;
  otrasFrecuenciasDisponibles: any[] = [];
  reservasAgrupadas: any[] = [];

  viajesList: any[] = [];
  filteredViajes: any[] = [];
  vehiculos: any[] = [];
  choferes: any[] = [];
  choferesFiltrados: any[] = [];
  
  loading = false;
  saving = false;
  formError = '';
  formWarning = '';
  formSuccess = '';
  warningConfirmado = false;

  modoEdicion = false;
  editandoFrecuenciaId: number | null = null;

  // Form Fields
  nuevaFrecuencia = {
    dirOrigen: '',
    dirDestino: '',
    fecha: '',
    hora: '',
    precioAsiento: null as number | null,
    capacidadTotal: 15,
    choferId: ''
  };

  vehiculoAsociado: any = null;

  // Filter Fields
  filtros = {
    busquedaChofer: '',
    busquedaVehiculo: '',
    estado: '',
    asientos: ''
  };

  constructor(
    private soapService: SoapService,
    private adminService: AdminService,
    private authService: AuthService,
    private ngZone: NgZone
  ) {}

  ngOnInit() {
    this.cargarFrecuencias();
    this.cargarDatosFormulario();
  }

  ngAfterViewInit() {
    this.initAutocomplete();
  }

  initAutocomplete() {
    if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
      setTimeout(() => this.initAutocomplete(), 500);
      return;
    }
    if (!this.origenInput || !this.destinoInput) return;

    const autocompleteOrigen = new google.maps.places.Autocomplete(this.origenInput.nativeElement, {
      componentRestrictions: { country: 'ec' }
    });
    const autocompleteDestino = new google.maps.places.Autocomplete(this.destinoInput.nativeElement, {
      componentRestrictions: { country: 'ec' }
    });

    autocompleteOrigen.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = autocompleteOrigen.getPlace();
        if (place.formatted_address) {
          this.nuevaFrecuencia.dirOrigen = place.formatted_address;
        } else if (place.name) {
          this.nuevaFrecuencia.dirOrigen = place.name;
        }
      });
    });

    autocompleteDestino.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = autocompleteDestino.getPlace();
        if (place.formatted_address) {
          this.nuevaFrecuencia.dirDestino = place.formatted_address;
        } else if (place.name) {
          this.nuevaFrecuencia.dirDestino = place.name;
        }
      });
    });
  }

  cargarFrecuencias() {
    this.loading = true;
    this.soapService.post(
      'http://ecuaviptour.com/soap/viajes',
      'getViajesProgramadosRequest',
      {}
    ).subscribe({
      next: (res) => {
        this.loading = false;
        const raw = res.viajes_programados || [];
        this.viajesList = raw.map((v: any) => ({
          ...v,
          dirOrigen: v.dir_origen,
          dirDestino: v.dir_destino,
          fechaHoraSalida: v.fecha_hora_salida,
          precioAsiento: v.precio_asiento,
          capacidadTotal: v.capacidad_total,
          asientosDisponibles: v.asientos_disponibles
        }));
        this.filtrarLista();
        this.calcularDisponibilidadChoferes();
        if (this.mostrarModalDetalle && this.viajeSeleccionado) {
          const updated = this.viajesList.find(v => v.id === this.viajeSeleccionado.id);
          if (updated) {
            this.viajeSeleccionado = updated;
          }
          this.calcularOtrasFrecuenciasDisponibles();
        }
      },
      error: (err) => {
        this.loading = false;
        console.error('Error cargando frecuencias:', err);
      }
    });
  }

  cargarDatosFormulario() {
    this.adminService.getVehiculos().subscribe({
      next: (vehiculos) => {
        // Filter out vehicles that don't have an assigned driver or are not active
        this.vehiculos = (vehiculos || []).filter(v => v.estado === 'activo' && v.chofer && v.chofer.id);
        
        // Map to get distinct choferes list
        this.choferes = this.vehiculos.map(v => ({
          id: v.chofer.id,
          nombre: v.chofer.nombre,
          placa: v.placa,
          capacidadMax: v.capacidad_max,
          vehiculoId: v.id,
          marca: v.marca,
          modelo: v.modelo
        }));
        this.choferesFiltrados = [...this.choferes];
        this.calcularDisponibilidadChoferes();
      },
      error: (err) => {
        console.error('Error cargando choferes y vehículos:', err);
      }
    });
  }

  onChoferChange() {
    const choferId = Number(this.nuevaFrecuencia.choferId);
    if (!choferId) {
      this.vehiculoAsociado = null;
      this.nuevaFrecuencia.capacidadTotal = 15;
      return;
    }

    const match = this.choferes.find(c => c.id === choferId);
    if (match) {
      this.vehiculoAsociado = {
        id: match.vehiculoId,
        placa: match.placa,
        marca: match.marca,
        modelo: match.modelo,
        capacidad_max: match.capacidadMax
      };
      this.nuevaFrecuencia.capacidadTotal = match.capacidadMax;
    }
  }

  iniciarEdicion(viaje: any) {
    this.modoEdicion = true;
    this.editandoFrecuenciaId = viaje.id;
    this.formError = '';
    this.formSuccess = '';

    let fecha = '';
    let hora = '';
    if (viaje.fechaHoraSalida) {
      const parts = viaje.fechaHoraSalida.split(' ');
      if (parts.length >= 2) {
        fecha = parts[0];
        hora = parts[1];
      }
    }

    this.nuevaFrecuencia = {
      dirOrigen: viaje.dirOrigen || '',
      dirDestino: viaje.dirDestino || '',
      fecha: fecha,
      hora: hora,
      precioAsiento: viaje.precioAsiento || null,
      capacidadTotal: viaje.capacidadTotal || 15,
      choferId: viaje.chofer?.id ? viaje.chofer.id.toString() : ''
    };

    this.onChoferChange();
    this.resetWarning();
    this.calcularDisponibilidadChoferes();
  }

  cancelarEdicion() {
    this.modoEdicion = false;
    this.editandoFrecuenciaId = null;
    this.limpiarFormulario();
  }

  async guardarFrecuencia() {
    this.formError = '';
    this.formSuccess = '';

    if (!this.nuevaFrecuencia.dirOrigen || !this.nuevaFrecuencia.dirDestino) {
      this.formError = 'El origen y destino son obligatorios.';
      return;
    }
    if (!this.nuevaFrecuencia.fecha || !this.nuevaFrecuencia.hora) {
      this.formError = 'La fecha y hora de salida son obligatorias.';
      return;
    }
    if (!this.nuevaFrecuencia.precioAsiento || this.nuevaFrecuencia.precioAsiento <= 0) {
      this.formError = 'El precio por asiento debe ser mayor que 0.';
      return;
    }
    if (!this.nuevaFrecuencia.choferId || !this.vehiculoAsociado) {
      this.formError = 'Se debe seleccionar un chofer con vehículo asignado.';
      return;
    }

    // Combine date and time to: "yyyy-MM-dd HH:mm"
    const fechaHoraSalidaStr = `${this.nuevaFrecuencia.fecha} ${this.nuevaFrecuencia.hora}`;
    
    // Check if date is in the future
    const departureDate = new Date(`${this.nuevaFrecuencia.fecha}T${this.nuevaFrecuencia.hora}`);
    if (departureDate <= new Date()) {
      this.formError = 'La fecha y hora de salida deben ser en el futuro.';
      return;
    }

    this.saving = true;

    // Cushion check for selected driver
    const selectedDriverId = Number(this.nuevaFrecuencia.choferId);
    const tripsOnDay = this.viajesList.filter(v => 
      v.chofer?.id === selectedDriverId && 
      v.id !== this.editandoFrecuenciaId &&
      v.fechaHoraSalida && 
      v.fechaHoraSalida.startsWith(this.nuevaFrecuencia.fecha) &&
      v.estado !== 'FINALIZADO' &&
      v.estado !== 'CANCELADO'
    );

    let hasCushionWarning = false;
    const proposedOrigen = this.nuevaFrecuencia.dirOrigen;
    const proposedDestino = this.nuevaFrecuencia.dirDestino;

    try {
      const duracionB = await this.getRouteDuration(proposedOrigen, proposedDestino);

      for (const viajeA of tripsOnDay) {
        const viajeASalidaParts = viajeA.fechaHoraSalida.split(' ');
        const viajeADate = viajeASalidaParts[0];
        const viajeATime = viajeASalidaParts[1];
        const horaSalidaA = new Date(`${viajeADate}T${viajeATime}`);
        const duracionA = await this.getRouteDuration(viajeA.dirOrigen, viajeA.dirDestino);

        if (horaSalidaA.getTime() <= departureDate.getTime()) {
          const traslado = await this.getRouteDuration(viajeA.dirDestino, proposedOrigen);
          const arrivalTimeA = new Date(horaSalidaA.getTime() + duracionA * 60000);
          const availabilityTime = new Date(arrivalTimeA.getTime() + traslado * 60000);
          
          const diffMins = (departureDate.getTime() - availabilityTime.getTime()) / 60000;
          if (diffMins >= 0 && diffMins < 30) {
            hasCushionWarning = true;
            break;
          }
        } else {
          const traslado = await this.getRouteDuration(proposedDestino, viajeA.dirOrigen);
          const arrivalTimeB = new Date(departureDate.getTime() + duracionB * 60000);
          const availabilityTime = new Date(arrivalTimeB.getTime() + traslado * 60000);

          const diffMins = (horaSalidaA.getTime() - availabilityTime.getTime()) / 60000;
          if (diffMins >= 0 && diffMins < 30) {
            hasCushionWarning = true;
            break;
          }
        }
      }
    } catch (err) {
      console.error('Error during cushion check:', err);
    }

    if (hasCushionWarning && !this.warningConfirmado) {
      this.formWarning = `Advertencia: El chofer llegará justo a tiempo al nuevo punto de origen. Existe riesgo de retraso debido al tráfico estimado por traslado en la ruta.`;
      this.saving = false;
      return;
    }

    const payload = {
      chofer_id: Number(this.nuevaFrecuencia.choferId),
      vehiculo_id: this.vehiculoAsociado.id,
      dir_origen: this.nuevaFrecuencia.dirOrigen,
      dir_destino: this.nuevaFrecuencia.dirDestino,
      fecha_hora_salida: fechaHoraSalidaStr,
      precio_asiento: Number(this.nuevaFrecuencia.precioAsiento),
      capacidad_total: Number(this.nuevaFrecuencia.capacidadTotal)
    };

    if (this.modoEdicion) {
      const editPayload = {
        id: this.editandoFrecuenciaId,
        chofer_id: Number(this.nuevaFrecuencia.choferId),
        vehiculo_id: this.vehiculoAsociado.id,
        dir_origen: this.nuevaFrecuencia.dirOrigen,
        dir_destino: this.nuevaFrecuencia.dirDestino,
        fecha_hora_salida: fechaHoraSalidaStr,
        precio_asiento: Number(this.nuevaFrecuencia.precioAsiento),
        capacidad_total: Number(this.nuevaFrecuencia.capacidadTotal)
      };

      this.soapService.post(
        'http://ecuaviptour.com/soap/viajes',
        'updateViajeProgramadoRequest',
        editPayload,
        this.authService.getToken() || undefined
      ).subscribe({
        next: (res) => {
          this.saving = false;
          this.formSuccess = 'Frecuencia de viaje actualizada exitosamente.';
          this.cancelarEdicion();
          this.cargarFrecuencias();
        },
        error: (err) => {
          this.saving = false;
          this.formError = 'Error al actualizar la frecuencia: ' + (err.error?.error || 'Conexión rechazada o permisos insuficientes');
        }
      });
    } else {
      this.soapService.post(
        'http://ecuaviptour.com/soap/viajes',
        'createViajeProgramadoRequest',
        payload,
        this.authService.getToken() || undefined
      ).subscribe({
        next: (res) => {
          this.saving = false;
          this.formSuccess = 'Frecuencia de viaje creada exitosamente.';
          this.limpiarFormulario();
          this.cargarFrecuencias();
        },
        error: (err) => {
          this.saving = false;
          this.formError = 'Error al crear la frecuencia: ' + (err.error?.error || 'Conexión rechazada o permisos insuficientes');
        }
      });
    }
  }

  limpiarFormulario() {
    this.nuevaFrecuencia = {
      dirOrigen: '',
      dirDestino: '',
      fecha: '',
      hora: '',
      precioAsiento: null,
      capacidadTotal: 15,
      choferId: ''
    };
    this.vehiculoAsociado = null;
    this.resetWarning();
    this.choferesFiltrados = [...this.choferes];
  }

  resetWarning() {
    this.formWarning = '';
    this.warningConfirmado = false;
  }

  confirmarAdvertencia() {
    this.warningConfirmado = true;
    this.formWarning = '';
    this.guardarFrecuencia();
  }

  onFormChange() {
    this.resetWarning();
    this.calcularDisponibilidadChoferes();
  }

  getRouteDuration(origin: string, destination: string): Promise<number> {
    return new Promise((resolve) => {
      if (!origin || !destination) {
        resolve(0);
        return;
      }
      if (origin.toLowerCase().trim() === destination.toLowerCase().trim()) {
        resolve(0);
        return;
      }
      if (typeof google === 'undefined' || !google.maps || !google.maps.DistanceMatrixService) {
        resolve(this.estimarDuracionLocal(origin, destination));
        return;
      }

      const service = new google.maps.DistanceMatrixService();
      service.getDistanceMatrix({
        origins: [origin],
        destinations: [destination],
        travelMode: google.maps.TravelMode.DRIVING
      }, (response: any, status: any) => {
        if (status === google.maps.DistanceMatrixStatus.OK && response && response.rows[0] && response.rows[0].elements[0]) {
          const element = response.rows[0].elements[0];
          if (element.status === 'OK' && element.duration) {
            resolve(Math.ceil(element.duration.value / 60));
            return;
          }
        }
        resolve(this.estimarDuracionLocal(origin, destination));
      });
    });
  }

  estimarDuracionLocal(origen: string, destino: string): number {
    const o = origen.toLowerCase();
    const d = destino.toLowerCase();
    if (o.trim() === d.trim()) return 0;
    
    if (o.includes('ambato') && d.includes('ambato')) return 15;
    if (o.includes('quito') && d.includes('quito')) return 20;
    if (o.includes('riobamba') && d.includes('riobamba')) return 15;
    if (o.includes('baños') && d.includes('baños')) return 15;

    const oQuito = o.includes('quito');
    const oAmbato = o.includes('ambato');
    const oRiobamba = o.includes('riobamba');
    const oBanos = o.includes('baños') || o.includes('banos');
    
    const dQuito = d.includes('quito');
    const dAmbato = d.includes('ambato');
    const dRiobamba = d.includes('riobamba');
    const dBanos = d.includes('baños') || d.includes('banos');

    if ((oQuito && dAmbato) || (oAmbato && dQuito)) return 120;
    if ((oQuito && dRiobamba) || (oRiobamba && dQuito)) return 180;
    if ((oQuito && dBanos) || (oBanos && dQuito)) return 180;
    if ((oAmbato && dRiobamba) || (oRiobamba && oAmbato)) return 60;
    if ((oAmbato && dBanos) || (oBanos && dAmbato)) return 45;
    if ((oRiobamba && dBanos) || (dBanos && oRiobamba)) return 90;

    return 90;
  }

  async calcularDisponibilidadChoferes() {
    if (!this.nuevaFrecuencia.dirOrigen || !this.nuevaFrecuencia.dirDestino || !this.nuevaFrecuencia.fecha || !this.nuevaFrecuencia.hora) {
      this.choferesFiltrados = [...this.choferes];
      return;
    }

    const proposedOrigen = this.nuevaFrecuencia.dirOrigen;
    const proposedDestino = this.nuevaFrecuencia.dirDestino;
    const proposedDateStr = this.nuevaFrecuencia.fecha;
    const proposedTimeStr = this.nuevaFrecuencia.hora;
    const proposedDateTime = new Date(`${proposedDateStr}T${proposedTimeStr}`);

    const result: any[] = [];
    const duracionB = await this.getRouteDuration(proposedOrigen, proposedDestino);

    for (const c of this.choferes) {
      const tripsOnDay = this.viajesList.filter(v => 
        v.chofer?.id === c.id && 
        v.id !== this.editandoFrecuenciaId &&
        v.fechaHoraSalida && 
        v.fechaHoraSalida.startsWith(proposedDateStr) &&
        v.estado !== 'FINALIZADO' &&
        v.estado !== 'CANCELADO'
      );

      let isDriverAvailable = true;

      for (const viajeA of tripsOnDay) {
        const viajeASalidaParts = viajeA.fechaHoraSalida.split(' ');
        const viajeADate = viajeASalidaParts[0];
        const viajeATime = viajeASalidaParts[1];
        const horaSalidaA = new Date(`${viajeADate}T${viajeATime}`);

        const duracionA = await this.getRouteDuration(viajeA.dirOrigen, viajeA.dirDestino);

        if (horaSalidaA.getTime() <= proposedDateTime.getTime()) {
          // A is before B
          const traslado = await this.getRouteDuration(viajeA.dirDestino, proposedOrigen);
          const arrivalTimeA = new Date(horaSalidaA.getTime() + duracionA * 60000);
          const availabilityTime = new Date(arrivalTimeA.getTime() + traslado * 60000);

          const isTransferClose = traslado < 15 || viajeA.dirDestino.toLowerCase().trim() === proposedOrigen.toLowerCase().trim();

          if (isTransferClose) {
            if (proposedDateTime.getTime() < arrivalTimeA.getTime()) {
              isDriverAvailable = false;
              break;
            }
          } else {
            if (proposedDateTime.getTime() < availabilityTime.getTime()) {
              isDriverAvailable = false;
              break;
            }
          }
        } else {
          // B is before A
          const traslado = await this.getRouteDuration(proposedDestino, viajeA.dirOrigen);
          const arrivalTimeB = new Date(proposedDateTime.getTime() + duracionB * 60000);
          const availabilityTime = new Date(arrivalTimeB.getTime() + traslado * 60000);

          const isTransferClose = traslado < 15 || proposedDestino.toLowerCase().trim() === viajeA.dirOrigen.toLowerCase().trim();

          if (isTransferClose) {
            if (horaSalidaA.getTime() < arrivalTimeB.getTime()) {
              isDriverAvailable = false;
              break;
            }
          } else {
            if (horaSalidaA.getTime() < availabilityTime.getTime()) {
              isDriverAvailable = false;
              break;
            }
          }
        }
      }

      if (isDriverAvailable) {
        result.push(c);
      }
    }

    this.choferesFiltrados = result;

    if (this.nuevaFrecuencia.choferId) {
      const stillAvailable = this.choferesFiltrados.some(c => c.id === Number(this.nuevaFrecuencia.choferId));
      if (!stillAvailable) {
        this.nuevaFrecuencia.choferId = '';
        this.vehiculoAsociado = null;
        this.nuevaFrecuencia.capacidadTotal = 15;
      }
    }
  }

  filtrarLista() {
    this.filteredViajes = this.viajesList.filter(viaje => {
      // Driver search
      if (this.filtros.busquedaChofer) {
        const choferName = viaje.chofer?.nombre || '';
        if (!choferName.toLowerCase().includes(this.filtros.busquedaChofer.toLowerCase())) {
          return false;
        }
      }
      // Vehicle search
      if (this.filtros.busquedaVehiculo) {
        const marca = viaje.vehiculo?.marca || '';
        const modelo = viaje.vehiculo?.modelo || '';
        const placa = viaje.vehiculo?.placa || '';
        const query = this.filtros.busquedaVehiculo.toLowerCase();
        if (!marca.toLowerCase().includes(query) && 
            !modelo.toLowerCase().includes(query) && 
            !placa.toLowerCase().includes(query)) {
          return false;
        }
      }
      // Status filter
      if (this.filtros.estado) {
        if (viaje.estado !== this.filtros.estado) {
          return false;
        }
      }
      // Capacity filter
      if (this.filtros.asientos) {
        const cap = Number(this.filtros.asientos);
        if (viaje.capacidadTotal !== cap) {
          return false;
        }
      }
      return true;
    });
  }

  hasActiveFilters(): boolean {
    return this.filtros.busquedaChofer !== '' ||
           this.filtros.busquedaVehiculo !== '' ||
           this.filtros.estado !== '' ||
           this.filtros.asientos !== '';
  }

  restablecerFiltros() {
    this.filtros = {
      busquedaChofer: '',
      busquedaVehiculo: '',
      estado: '',
      asientos: ''
    };
    this.filtrarLista();
  }

  getCiudad(direccion: string): string {
    if (!direccion) return '';
    return direccion.split(',')[0].trim();
  }

  formatFecha(fechaStr: string): string {
    if (!fechaStr) return '';
    try {
      const parts = fechaStr.split(' ');
      const dateParts = parts[0].split('-');
      const timeStr = parts[1];
      
      const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
      const dia = dateParts[2];
      const mes = meses[Number(dateParts[1]) - 1];
      
      return `${dia} ${mes}, ${timeStr}`;
    } catch (e) {
      return fechaStr;
    }
  }

  getStatusClass(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PROGRAMADO': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'EN_RUTA': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'FINALIZADO': return 'bg-gray-50 text-gray-500 border-gray-100';
      default: return 'bg-gray-50 text-gray-400 border-gray-100';
    }
  }

  getViajeProgressPercent(viaje: any): number {
    const estado = viaje.estado?.toUpperCase();
    if (estado === 'FINALIZADO') return 100;
    if (estado === 'CANCELADO') return 0;
    if (estado === 'PROGRAMADO') {
      if (!viaje.fechaHoraSalida) return 15;
      try {
        const departure = new Date(viaje.fechaHoraSalida.replace(' ', 'T'));
        const now = new Date();
        const diffMs = departure.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins <= 10) {
          return 25; // Salida inminente / Preparando salida
        }
      } catch (e) {}
      return 15;
    }
    if (estado === 'EN_RUTA') {
      if (!viaje.fechaHoraSalida) return 50;
      try {
        const departure = new Date(viaje.fechaHoraSalida.replace(' ', 'T'));
        const now = new Date();
        let elapsed = Math.floor((now.getTime() - departure.getTime()) / 60000);
        if (elapsed < 0) elapsed = 0;
        if (elapsed >= 65) return 90; // A punto de llegar
        return 30 + Math.floor((elapsed / 65) * 55); // Scales between 30% and 85%
      } catch (e) {
        return 50;
      }
    }
    return 0;
  }

  getViajeProgressText(viaje: any): string {
    const estado = viaje.estado?.toUpperCase();
    if (estado === 'FINALIZADO') return 'Llegó al destino';
    if (estado === 'CANCELADO') return 'Cancelado';
    if (estado === 'PROGRAMADO') {
      if (!viaje.fechaHoraSalida) return 'En origen (Programado)';
      try {
        const departure = new Date(viaje.fechaHoraSalida.replace(' ', 'T'));
        const now = new Date();
        const diffMs = departure.getTime() - now.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins <= 0) {
          return 'Salida inminente';
        }
        if (diffMins <= 10) {
          return 'Preparando salida';
        }
        if (diffMins < 60) {
          return `En origen (Sale en ${diffMins} min)`;
        }
      } catch (e) {}
      return 'En origen (Programado)';
    }
    if (estado === 'EN_RUTA') {
      if (!viaje.fechaHoraSalida) return 'En ruta';
      try {
        const departure = new Date(viaje.fechaHoraSalida.replace(' ', 'T'));
        const now = new Date();
        let elapsed = Math.floor((now.getTime() - departure.getTime()) / 60000);
        if (elapsed < 0) elapsed = 0;
        if (elapsed >= 65) return 'A punto de llegar';
        return `En ruta (${elapsed} min de viaje)`;
      } catch (e) {
        return 'En ruta';
      }
    }
    return estado || 'Desconocido';
  }

  getProgressTextClass(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PROGRAMADO': return 'text-amber-600';
      case 'EN_RUTA': return 'text-blue-600';
      case 'FINALIZADO': return 'text-emerald-600';
      case 'CANCELADO': return 'text-rose-600';
      default: return 'text-slate-500';
    }
  }

  getProgressFillClass(estado: string): string {
    switch (estado?.toUpperCase()) {
      case 'PROGRAMADO': return 'bg-amber-500';
      case 'EN_RUTA': return 'bg-gradient-to-r from-blue-500 to-indigo-600';
      case 'FINALIZADO': return 'bg-emerald-500';
      case 'CANCELADO': return 'bg-rose-500';
      default: return 'bg-slate-400';
    }
  }

  eliminarFrecuencia(id: number) {
    if (!confirm('¿Está seguro de que desea eliminar esta frecuencia de viaje? Esta acción es irreversible y también eliminará las reservas asociadas.')) {
      return;
    }

    this.loading = true;
    this.soapService.post(
      'http://ecuaviptour.com/soap/viajes',
      'deleteViajeProgramadoRequest',
      { id: id },
      this.authService.getToken() || undefined
    ).subscribe({
      next: (res) => {
        this.loading = false;
        this.formSuccess = 'Frecuencia de viaje eliminada exitosamente.';
        this.cargarFrecuencias();
      },
      error: (err) => {
        this.loading = false;
        this.formError = 'Error al eliminar la frecuencia: ' + (err.error?.error || 'Conexión rechazada o permisos insuficientes');
      }
    });
  }

  abrirDetalleViaje(viaje: any) {
    this.viajeSeleccionado = viaje;
    this.mostrarModalDetalle = true;
    this.tabActiva = 'detalles';
    this.reservasFrecuencia = [];
    this.reservasAgrupadas = [];
    this.reprogramandoReservaId = null;
    this.destinoReprogramacionId = null;
    this.calcularOtrasFrecuenciasDisponibles();
    this.cargarReservasFrecuencia(viaje.id);
  }

  cerrarDetalleViaje() {
    this.mostrarModalDetalle = false;
    this.viajeSeleccionado = null;
    this.tabActiva = 'detalles';
    this.reservasFrecuencia = [];
    this.reservasAgrupadas = [];
    this.reprogramandoReservaId = null;
    this.destinoReprogramacionId = null;
    this.otrasFrecuenciasDisponibles = [];
  }

  editarDesdeModal() {
    if (!this.viajeSeleccionado) return;
    const viaje = this.viajeSeleccionado;
    this.cerrarDetalleViaje();
    this.iniciarEdicion(viaje);
  }

  eliminarDesdeModal() {
    if (!this.viajeSeleccionado) return;
    const id = this.viajeSeleccionado.id;
    if (this.viajeSeleccionado.estado !== 'PROGRAMADO') {
      alert('No se puede eliminar una frecuencia que ya inició o finalizó.');
      return;
    }
    if (this.tieneUsuariosActivos()) {
      alert('No se puede eliminar una frecuencia que contiene pasajeros activos.');
      return;
    }

    this.cerrarDetalleViaje();
    this.eliminarFrecuencia(id);
  }

  tieneUsuariosActivos(): boolean {
    return this.reservasFrecuencia.some(r => r.estado_pago !== 'CANCELADO');
  }

  cargarReservasFrecuencia(viajeProgramadoId: number) {
    this.cargandoReservas = true;
    this.soapService.post(
      'http://ecuaviptour.com/soap/viajes',
      'getReservasFrecuenciaRequest',
      { viaje_programado_id: viajeProgramadoId }
    ).subscribe({
      next: (res) => {
        this.cargandoReservas = false;
        const raw = res.reservas || [];
        this.reservasFrecuencia = raw.map((r: any) => ({
          ...r,
          id: r.id,
          viaje_programado_id: r.viaje_programado_id,
          dir_origen: r.dir_origen,
          dir_destino: r.dir_destino,
          fecha_hora_salida: r.fecha_hora_salida,
          usuario_id: r.usuario_id,
          nombre_usuario: r.nombre_usuario,
          numero_asiento: r.numero_asiento,
          punto_abordaje: r.punto_abordaje,
          estado_pago: r.estado_pago,
          pin_abordaje: r.pin_abordaje,
          fecha_reserva: r.fecha_reserva,
          fecha_limite_pago: r.fecha_limite_pago,
          comprobante_url: r.comprobante_url,
          foto_usuario_url: r.foto_usuario_url,
          precio_asiento: r.precio_asiento
        }));
        this.agruparReservas();
      },
      error: (err) => {
        this.cargandoReservas = false;
        console.error('Error cargando reservas de frecuencia:', err);
      }
    });
  }

  cancelarReservaAdmin(reservaId: number) {
    if (!confirm('¿Está seguro de que desea reembolsar y cancelar esta reserva? El asiento quedará libre y se restará del total de ingresos.')) {
      return;
    }

    this.soapService.post(
      'http://ecuaviptour.com/soap/viajes',
      'cancelarReservaRequest',
      { reserva_id: reservaId },
      this.authService.getToken() || undefined
    ).subscribe({
      next: (res) => {
        if (res.exito) {
          this.formSuccess = 'Reserva cancelada y reembolsada exitosamente.';
          if (this.viajeSeleccionado) {
            this.cargarReservasFrecuencia(this.viajeSeleccionado.id);
            this.cargarFrecuencias();
          }
        } else {
          alert('Error: ' + res.mensaje);
        }
      },
      error: (err) => {
        console.error('Error al cancelar reserva:', err);
        alert('Error al cancelar reserva: ' + (err.error?.error || 'Permisos insuficientes'));
      }
    });
  }

  getOtrasFrecuenciasDisponibles(): any[] {
    if (!this.viajeSeleccionado) return [];
    return this.viajesList.filter(v => 
      v.id !== this.viajeSeleccionado.id &&
      v.estado === 'PROGRAMADO' &&
      v.asientosDisponibles > 0
    );
  }

  confirmarReprogramacion(reservaId: number) {
    if (!this.destinoReprogramacionId) return;

    this.soapService.post(
      'http://ecuaviptour.com/soap/viajes',
      'reprogramarReservaRequest',
      {
        reserva_id: reservaId,
        nuevo_viaje_programado_id: Number(this.destinoReprogramacionId)
      },
      this.authService.getToken() || undefined
    ).subscribe({
      next: (res) => {
        if (res.exito) {
          this.formSuccess = 'Reserva reprogramada exitosamente al nuevo viaje.';
          this.reprogramandoReservaId = null;
          this.destinoReprogramacionId = null;
          if (this.viajeSeleccionado) {
            this.cargarReservasFrecuencia(this.viajeSeleccionado.id);
            this.cargarFrecuencias();
          }
        } else {
          alert('Error: ' + res.mensaje);
        }
      },
      error: (err) => {
        console.error('Error al reprogramar reserva:', err);
        alert('Error al reprogramar reserva: ' + (err.error?.error || 'Permisos insuficientes'));
      }
    });
  }

  getAvatarUrl(url: string | null | undefined): string | null {
    if (!url) return null;
    if (url.startsWith('http://') || url.startsWith('https://')) {
      return url;
    }
    return 'http://localhost:5001/' + url;
  }

  getReservasAgrupadas(): any[] {
    const groups: { [key: string]: any } = {};
    for (const r of this.reservasFrecuencia) {
      const key = `${r.usuario_id}_${r.estado_pago}`;
      if (!groups[key]) {
        groups[key] = {
          usuario_id: r.usuario_id,
          nombre_usuario: r.nombre_usuario,
          foto_usuario_url: r.foto_usuario_url,
          punto_abordaje: r.punto_abordaje,
          estado_pago: r.estado_pago,
          pin_abordaje: r.pin_abordaje,
          asientos: [r.numero_asiento],
          reservas: [r]
        };
      } else {
        groups[key].asientos.push(r.numero_asiento);
        groups[key].reservas.push(r);
        groups[key].asientos.sort((a: number, b: number) => a - b);
      }
    }
    return Object.values(groups);
  }

  getPinsString(reservas: any[]): string {
    return (reservas || [])
      .map(r => r.pin_abordaje)
      .filter(pin => !!pin)
      .join(', ');
  }

  async cancelarGrupoReservas(reservas: any[]) {
    const activeReservas = reservas.filter(r => r.estado_pago !== 'CANCELADO');
    if (activeReservas.length === 0) return;

    if (!confirm(`¿Está seguro de que desea reembolsar y cancelar las ${activeReservas.length} reservas de este usuario? Los asientos quedarán libres.`)) {
      return;
    }

    this.loading = true;
    let successCount = 0;
    let errorMsg = '';

    for (const r of activeReservas) {
      try {
        const res: any = await this.soapService.post(
          'http://ecuaviptour.com/soap/viajes',
          'cancelarReservaRequest',
          { reserva_id: r.id },
          this.authService.getToken() || undefined
        ).toPromise();
        
        if (res && res.exito) {
          successCount++;
        } else {
          errorMsg = res?.mensaje || 'Error desconocido';
        }
      } catch (err: any) {
        console.error('Error al cancelar reserva:', err);
        errorMsg = err.error?.error || 'Permisos insuficientes';
      }
    }

    this.loading = false;
    if (successCount > 0) {
      this.formSuccess = `Se cancelaron y reembolsaron ${successCount} reservas exitosamente.`;
      if (this.viajeSeleccionado) {
        this.cargarReservasFrecuencia(this.viajeSeleccionado.id);
        this.cargarFrecuencias();
      }
    } else {
      alert('Error al cancelar reservas: ' + errorMsg);
    }
  }

  async confirmarReprogramacionGrupo(reservas: any[]) {
    if (!this.destinoReprogramacionId) return;
    const activeReservas = reservas.filter(r => r.estado_pago !== 'CANCELADO');
    if (activeReservas.length === 0) return;

    this.loading = true;
    let successCount = 0;
    let errorMsg = '';

    for (const r of activeReservas) {
      try {
        const res: any = await this.soapService.post(
          'http://ecuaviptour.com/soap/viajes',
          'reprogramarReservaRequest',
          {
            reserva_id: r.id,
            nuevo_viaje_programado_id: Number(this.destinoReprogramacionId)
          },
          this.authService.getToken() || undefined
        ).toPromise();

        if (res && res.exito) {
          successCount++;
        } else {
          errorMsg = res?.mensaje || 'Error desconocido';
        }
      } catch (err: any) {
        console.error('Error al reprogramar reserva:', err);
        errorMsg = err.error?.error || 'Permisos insuficientes';
      }
    }

    this.loading = false;
    this.reprogramandoReservaId = null;
    this.destinoReprogramacionId = null;

    if (successCount > 0) {
      this.formSuccess = `Se reprogramaron ${successCount} reservas exitosamente al nuevo viaje.`;
      if (this.viajeSeleccionado) {
        this.cargarReservasFrecuencia(this.viajeSeleccionado.id);
        this.cargarFrecuencias();
      }
    } else {
      alert('Error al reprogramar reservas: ' + errorMsg);
    }
  }

  calcularOtrasFrecuenciasDisponibles() {
    if (!this.viajeSeleccionado) {
      this.otrasFrecuenciasDisponibles = [];
      return;
    }
    this.otrasFrecuenciasDisponibles = this.viajesList.filter(v => 
      v.id !== this.viajeSeleccionado.id &&
      v.estado === 'PROGRAMADO' &&
      v.asientosDisponibles > 0
    );
  }

  agruparReservas() {
    const groups: { [key: string]: any } = {};
    for (const r of this.reservasFrecuencia) {
      const key = `${r.usuario_id}_${r.estado_pago}`;
      if (!groups[key]) {
        groups[key] = {
          usuario_id: r.usuario_id,
          nombre_usuario: r.nombre_usuario,
          foto_usuario_url: r.foto_usuario_url,
          punto_abordaje: r.punto_abordaje,
          estado_pago: r.estado_pago,
          pin_abordaje: r.pin_abordaje,
          asientos: [r.numero_asiento],
          reservas: [r]
        };
      } else {
        groups[key].asientos.push(r.numero_asiento);
        groups[key].reservas.push(r);
        groups[key].asientos.sort((a: number, b: number) => a - b);
      }
    }
    this.reservasAgrupadas = Object.values(groups);
  }

  haAbordado(estadoPago: string): boolean {
    if (!estadoPago) return false;
    const est = estadoPago.toUpperCase();
    return est === 'ABORDO' || est === 'CONFIRMADO_ABORDO';
  }
}
