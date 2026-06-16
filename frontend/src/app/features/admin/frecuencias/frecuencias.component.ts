import { Component, OnInit, ViewChild, ElementRef, NgZone, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { SoapService } from '../../../core/services/soap.service';
import { AdminService } from '../../../core/services/admin.service';
import { AuthService } from '../../../core/services/auth.service';

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
            Crear Frecuencia
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
                  name="hora"
                  required
                  class="w-full px-4 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold text-slate-700 transition-all"
                >
              </div>
            </div>

            <!-- Chofer Select -->
            <div class="space-y-1.5">
              <label class="text-[10px] font-black uppercase text-slate-400 tracking-wider">Chofer Asignado</label>
              <select 
                [(ngModel)]="nuevaFrecuencia.choferId" 
                (change)="onChoferChange()"
                name="choferId"
                required
                class="w-full pl-4 pr-3 py-3 bg-slate-50 border border-slate-200/80 rounded-2xl focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 text-sm font-semibold text-slate-700 transition-all cursor-pointer"
              >
                <option value="">Seleccione un chofer...</option>
                <option *ngFor="let c of choferes" [value]="c.id">
                  {{ c.nombre }} ({{ c.placa }})
                </option>
              </select>

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
            <div *ngIf="formError" class="p-3 bg-red-50 text-red-700 border border-red-100 rounded-2xl text-xs font-semibold">
              {{ formError }}
            </div>
            <div *ngIf="formSuccess" class="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-2xl text-xs font-semibold">
              {{ formSuccess }}
            </div>

            <!-- Submit Button -->
            <button 
              type="submit" 
              [disabled]="saving || !nuevaFrecuencia.choferId"
              class="w-full bg-blue-600 hover:bg-blue-700 text-white font-black uppercase tracking-wider py-4 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-[1.01] active:scale-95 transition-all text-xs flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <span *ngIf="saving" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
              {{ saving ? 'Guardando...' : 'Crear Frecuencia' }}
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

          <!-- Frequencies List Grid -->
          <div *ngIf="!loading && filteredViajes.length > 0" class="flex-1 overflow-y-auto space-y-4 max-h-[550px] pr-2 no-scrollbar">
            <div 
              *ngFor="let viaje of filteredViajes"
              class="border border-gray-100 hover:border-blue-100 rounded-3xl p-5 bg-white shadow-sm hover:shadow-md transition-all duration-300 relative group flex flex-col gap-3.5"
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
                  <span class="block text-[9px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">Capacidad / Ocupación</span>
                  <span class="text-slate-700 font-bold block">
                    {{ viaje.capacidadTotal }} Asientos 
                    <span class="text-blue-500 font-black">({{ (viaje.capacidadTotal || 15) - (viaje.asientosDisponibles || 0) }} Ocupados)</span>
                  </span>
                </div>
              </div>

              <!-- Bottom Row: Price and Info -->
              <div class="flex items-center justify-between border-t border-gray-50 pt-3.5 mt-1">
                <div>
                  <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest block leading-none mb-1">Tarifa Individual</span>
                  <span class="text-lg font-black text-slate-900">\${{ viaje.precioAsiento | number:'1.2-2' }}</span>
                </div>
                
                <div>
                  <span class="text-[9px] text-slate-400 font-black uppercase tracking-widest block leading-none mb-1">Capacidad Máxima</span>
                  <span class="text-xs font-bold text-slate-700">{{ viaje.capacidadTotal }} Pax</span>
                </div>
              </div>

            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    .no-scrollbar::-webkit-scrollbar { display: none; }
    .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
  `]
})
export class FrecuenciasComponent implements OnInit, AfterViewInit {
  @ViewChild('origenInput') origenInput!: ElementRef<HTMLInputElement>;
  @ViewChild('destinoInput') destinoInput!: ElementRef<HTMLInputElement>;

  viajesList: any[] = [];
  filteredViajes: any[] = [];
  vehiculos: any[] = [];
  choferes: any[] = [];
  
  loading = false;
  saving = false;
  formError = '';
  formSuccess = '';

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
        this.viajesList = res.viajes_programados || [];
        this.filtrarLista();
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

  guardarFrecuencia() {
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
    
    const payload = {
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
}
