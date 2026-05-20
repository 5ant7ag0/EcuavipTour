import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChoferService } from '../../../core/services/chofer.service';

@Component({
  selector: 'app-vehiculo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="relative overflow-x-hidden">
      
      <!-- Custom Notification -->
      <div *ngIf="showNotification" 
           [ngClass]="notificationType === 'success' ? 'bg-emerald-600' : 'bg-red-600'"
           class="fixed top-8 left-1/2 -translate-x-1/2 z-[100] px-8 py-4 rounded-2xl text-white font-black text-sm shadow-2xl shadow-slate-900/20 flex items-center gap-4 animate-in slide-in-from-top-12 duration-500">
        <svg *ngIf="notificationType === 'success'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"/></svg>
        <svg *ngIf="notificationType === 'error'" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
        {{ notificationMsg }}
      </div>

      <div class="max-w-5xl mx-auto">
        
        <!-- Profile-style Vehicle Photo Header -->
        <div class="flex flex-col items-center mb-12 animate-in fade-in slide-in-from-top duration-700">
          <div class="relative group w-full max-w-lg">
            <div class="aspect-[16/9] w-full rounded-3xl overflow-hidden bg-white shadow-sm border-4 border-white relative transition-all duration-500 group">
              <img *ngIf="vehiculo.foto_auto_url || vehiculo.foto_auto_url_temp" 
                   [src]="vehiculo.foto_auto_url_temp || ('http://localhost:5001/' + vehiculo.foto_auto_url)" 
                   class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110">
              
              <div *ngIf="!vehiculo.foto_auto_url && !vehiculo.foto_auto_url_temp" class="w-full h-full flex flex-col items-center justify-center text-slate-300 bg-slate-50">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C2.1 10.3 2 10.6 2 11v5c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
              </div>

              <!-- Only show photo change if editing and not active -->
              <div *ngIf="isEditing && vehiculo.estado !== 'activo'" class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm cursor-pointer">
                <label class="cursor-pointer text-white flex flex-col items-center gap-2">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
                  <span class="text-[10px] font-black uppercase tracking-widest">Cambiar Foto</span>
                  <input type="file" (change)="onFileSelected($event, 'foto_auto')" class="hidden" accept="image/*">
                </label>
              </div>
            </div>
            
            <!-- Floating Status -->
            <div [ngClass]="{
              'bg-amber-50 text-amber-600 border-amber-200': vehiculo.estado === 'pendiente',
              'bg-emerald-50 text-emerald-600 border-emerald-200': vehiculo.estado === 'activo',
              'bg-red-50 text-red-600 border-red-200': vehiculo.estado === 'rechazado'
            }" class="absolute -bottom-4 left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest border shadow-xl bg-white">
              {{ vehiculo.estado || 'pendiente' }}
            </div>
          </div>
          
          <div class="mt-8 text-center">
            <h2 class="text-2xl font-black text-slate-900">{{ (vehiculo.marca || '') + ' ' + (vehiculo.modelo || '') || 'Nueva Unidad' }}</h2>
            <p class="text-sm font-bold text-blue-600 mt-1 uppercase tracking-widest">{{ vehiculo.placa || 'Sin Placa' }}</p>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          
          <!-- Left Column: Vehicle Info & Documents -->
          <div class="lg:col-span-2 space-y-8">
            
            <!-- Datos Principales Card -->
            <div class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 transition-all hover:shadow-md relative group">
              
              <div class="flex items-center gap-4 mb-8">
                <div class="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-inner">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
                </div>
                <div>
                  <h3 class="text-xl font-black text-slate-900">Datos Principales</h3>
                  <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Información de la Unidad</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Placa -->
                <div class="space-y-2">
                  <div class="flex justify-between items-center ml-1">
                    <label class="text-xs font-black text-slate-500 uppercase tracking-widest">Placa</label>
                    <span *ngIf="vehiculo.placa && !validarPlaca(vehiculo.placa)" class="text-[9px] text-red-500 font-bold uppercase tracking-tighter">Formato: AAA-0000</span>
                  </div>
                  <input 
                    [(ngModel)]="vehiculo.placa" 
                    (ngModelChange)="vehiculo.placa = $event.toUpperCase()"
                    [disabled]="!isEditing || vehiculo.estado === 'activo'"
                    type="text" 
                    maxlength="8"
                    class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="ABC-1234">
                </div>

                <!-- Tipo -->
                <div class="space-y-2">
                  <label class="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Tipo de Vehículo</label>
                  <select 
                    [(ngModel)]="vehiculo.tipo_vehiculo" 
                    [disabled]="!isEditing || vehiculo.estado === 'activo'"
                    class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed appearance-none">
                    <option value="furgoneta">Furgoneta (VIP)</option>
                    <option value="sedan">Sedán</option>
                    <option value="suv">SUV / 4x4</option>
                  </select>
                </div>

                <!-- Marca -->
                <div class="space-y-2">
                  <label class="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Marca</label>
                  <input 
                    [(ngModel)]="vehiculo.marca" 
                    [disabled]="!isEditing"
                    type="text" 
                    class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Ej: Hyundai">
                </div>

                <!-- Modelo -->
                <div class="space-y-2">
                  <label class="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Modelo</label>
                  <input 
                    [(ngModel)]="vehiculo.modelo" 
                    [disabled]="!isEditing"
                    type="text" 
                    class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Ej: H1 / Staria">
                </div>

                <!-- Año -->
                <div class="space-y-2">
                  <label class="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Año</label>
                  <input 
                    [(ngModel)]="vehiculo.anio" 
                    [disabled]="!isEditing"
                    type="number" 
                    class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Ej: 2024">
                </div>

                <!-- Capacidad -->
                <div class="space-y-2">
                  <label class="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Capacidad Máx.</label>
                  <input 
                    [(ngModel)]="vehiculo.capacidad_max" 
                    [disabled]="!isEditing"
                    type="number" 
                    class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Número de asientos">
                </div>

                <!-- Color -->
                <div class="space-y-2">
                  <label class="text-xs font-black text-slate-500 uppercase tracking-widest ml-1">Color</label>
                  <input 
                    [(ngModel)]="vehiculo.color" 
                    [disabled]="!isEditing"
                    type="text" 
                    class="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-slate-900 font-bold focus:bg-white focus:border-blue-500 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
                    placeholder="Ej: Blanco / Negro">
                </div>
              </div>
            </div>

            <!-- Documents Card -->
            <div class="bg-white rounded-3xl p-8 shadow-sm border border-slate-100">
              <div class="flex items-center gap-4 mb-8">
                <div class="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shadow-inner">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div>
                  <h3 class="text-xl font-black text-slate-900">Documentación</h3>
                  <p class="text-xs font-bold text-slate-400 uppercase tracking-widest">Verificación Requerida</p>
                </div>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Matrícula -->
                <div [ngClass]="{'opacity-60 cursor-not-allowed': !isEditing || vehiculo.estado === 'activo', 'hover:border-blue-400 hover:bg-blue-50/30': isEditing && vehiculo.estado !== 'activo'}" class="group relative overflow-hidden bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6 transition-all">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <div class="text-center">
                      <p class="text-sm font-black text-slate-700">Matrícula del Vehículo</p>
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{{ (vehiculo.foto_matricula_url || vehiculo.foto_matricula_url_temp) ? 'Archivo cargado' : 'Subir Imagen (JPG/PNG)' }}</p>
                    </div>
                    <input *ngIf="isEditing && vehiculo.estado !== 'activo'" type="file" (change)="onFileSelected($event, 'foto_matricula')" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
                  </div>
                  <div *ngIf="vehiculo.foto_matricula_url || vehiculo.foto_matricula_url_temp" class="mt-4 rounded-xl overflow-hidden h-24 shadow-md">
                    <img [src]="vehiculo.foto_matricula_url_temp || ('http://localhost:5001/' + vehiculo.foto_matricula_url)" class="w-full h-full object-cover">
                  </div>
                </div>

                <!-- Licencia -->
                <div [ngClass]="{'opacity-60 cursor-not-allowed': !isEditing || vehiculo.estado === 'activo', 'hover:border-blue-400 hover:bg-blue-50/30': isEditing && vehiculo.estado !== 'activo'}" class="group relative overflow-hidden bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 p-6 transition-all">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-white flex items-center justify-center text-slate-400 group-hover:text-blue-500 shadow-sm transition-colors">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
                    </div>
                    <div class="text-center">
                      <p class="text-sm font-black text-slate-700">Licencia de Conducir</p>
                      <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{{ (vehiculo.foto_licencia_url || vehiculo.foto_licencia_url_temp) ? 'Archivo cargado' : 'Subir Imagen (JPG/PNG)' }}</p>
                    </div>
                    <input *ngIf="isEditing && vehiculo.estado !== 'activo'" type="file" (change)="onFileSelected($event, 'foto_licencia')" class="absolute inset-0 opacity-0 cursor-pointer" accept="image/*">
                  </div>
                  <div *ngIf="vehiculo.foto_licencia_url || vehiculo.foto_licencia_url_temp" class="mt-4 rounded-xl overflow-hidden h-24 shadow-md">
                    <img [src]="vehiculo.foto_licencia_url_temp || ('http://localhost:5001/' + vehiculo.foto_licencia_url)" class="w-full h-full object-cover">
                  </div>
                </div>
              </div>
            </div>

          </div>

          <!-- Right Column: Status & Save -->
          <div class="space-y-8">
            
            <!-- Help/Tips Card -->
            <div class="bg-slate-900 rounded-3xl p-8 shadow-sm text-white relative overflow-hidden">
              <div class="absolute top-0 right-0 p-4 opacity-10">
                <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <h4 class="text-lg font-black mb-4">¿Por qué verificar?</h4>
              <p class="text-slate-400 text-xs font-medium leading-relaxed">
                Para garantizar la seguridad de nuestros pasajeros VIP, todas las unidades deben pasar un proceso de verificación técnica y legal.
              </p>
              <div class="mt-6 flex items-center gap-3 text-blue-400">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                <span class="text-[10px] font-black uppercase tracking-widest">Garantía Ecuavip</span>
              </div>
            </div>

          </div>

        </div>

        <!-- Footer de Acciones (Unificado con Datos Personales) -->
        <div class="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
            {{ isEditing ? 'Ingresa los datos requeridos para tu unidad. Estarán sujetos a revisión.' : 'La placa y el tipo de vehículo solo pueden modificarse antes de la aprobación.' }}
          </p>
          
          <!-- Estado de visualización: Botón Editar Vehículo -->
          <button 
            *ngIf="!isEditing"
            (click)="toggleEdit()" 
            class="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            Editar Vehículo
          </button>

          <!-- Estado de edición: Cancelar y Guardar Cambios -->
          <div *ngIf="isEditing" class="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
            <button 
              (click)="toggleEdit()" 
              [disabled]="loading" 
              class="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-50">
              Cancelar
            </button>
            
            <button 
              (click)="guardar()" 
              [disabled]="loading || !hayCambios || !esValido" 
              class="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
              <svg *ngIf="loading" class="animate-spin text-white" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              {{ loading ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    input::-webkit-outer-spin-button,
    input::-webkit-inner-spin-button {
      -webkit-appearance: none;
      margin: 0;
    }
  `]
})
export class VehiculoComponent implements OnInit {
  vehiculo: any = {
    placa: '',
    marca: '',
    modelo: '',
    anio: null,
    tipo_vehiculo: 'furgoneta',
    capacidad_max: 0,
    color: '',
    estado: 'pendiente',
    foto_auto_url: '',
    foto_matricula_url: '',
    foto_licencia_url: ''
  };

  vehiculoOriginal: any = null;
  loading = false;
  isEditing = false;
  showNotification = false;
  notificationMsg = '';
  notificationType: 'success' | 'error' = 'success';
  files: { [key: string]: File } = {};

  constructor(private choferService: ChoferService) {}

  ngOnInit() {
    this.cargarVehiculo();
  }

  cargarVehiculo() {
    this.choferService.getVehiculo().subscribe({
      next: (data) => {
        if (data) {
          this.vehiculo = { ...data };
          this.vehiculoOriginal = JSON.stringify(data);
          this.isEditing = false;
        } else {
          // Si no tiene vehículo registrado aún, activamos edición de forma predeterminada
          this.isEditing = true;
          this.vehiculoOriginal = null;
        }
      },
      error: (err) => {
        console.error('Error al cargar vehículo:', err);
        // Si hay error (o no existe), asumimos modo creación
        this.isEditing = true;
        this.vehiculoOriginal = null;
      }
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Si cancela, restaurar datos
      this.cargarVehiculo();
      this.files = {};
    }
  }

  get hayCambios(): boolean {
    const originalObj = this.vehiculoOriginal ? JSON.parse(this.vehiculoOriginal) : {
      placa: '',
      marca: '',
      modelo: '',
      anio: null,
      tipo_vehiculo: 'furgoneta',
      capacidad_max: 0,
      color: ''
    };

    const dataActual = JSON.stringify({
      placa: this.vehiculo.placa || '',
      marca: this.vehiculo.marca || '',
      modelo: this.vehiculo.modelo || '',
      anio: this.vehiculo.anio,
      tipo_vehiculo: this.vehiculo.tipo_vehiculo || 'furgoneta',
      capacidad_max: this.vehiculo.capacidad_max || 0,
      color: this.vehiculo.color || ''
    });
    
    const dataOriginal = JSON.stringify({
      placa: originalObj.placa || '',
      marca: originalObj.marca || '',
      modelo: originalObj.modelo || '',
      anio: originalObj.anio,
      tipo_vehiculo: originalObj.tipo_vehiculo || 'furgoneta',
      capacidad_max: originalObj.capacidad_max || 0,
      color: originalObj.color || ''
    });

    return dataActual !== dataOriginal || Object.keys(this.files).length > 0;
  }

  get esValido(): boolean {
    // 1. Validar placa
    if (!this.vehiculo.placa || !this.validarPlaca(this.vehiculo.placa)) {
      return false;
    }
    // 2. Validar campos requeridos
    if (!this.vehiculo.marca || this.vehiculo.marca.trim() === '') return false;
    if (!this.vehiculo.modelo || this.vehiculo.modelo.trim() === '') return false;
    if (!this.vehiculo.color || this.vehiculo.color.trim() === '') return false;
    if (!this.vehiculo.tipo_vehiculo) return false;
    
    // 3. Validar Año (rango razonable)
    if (!this.vehiculo.anio || this.vehiculo.anio < 1990 || this.vehiculo.anio > 2027) {
      return false;
    }

    // 4. Validar Capacidad
    if (!this.vehiculo.capacidad_max || this.vehiculo.capacidad_max <= 0) {
      return false;
    }

    // 5. Validar Fotos/Documentos (Debe tener foto o archivo temporal local cargado)
    const tieneFotoAuto = !!(this.vehiculo.foto_auto_url || this.files['foto_auto']);
    const tieneFotoMatricula = !!(this.vehiculo.foto_matricula_url || this.files['foto_matricula']);
    const tieneFotoLicencia = !!(this.vehiculo.foto_licencia_url || this.files['foto_licencia']);

    if (!tieneFotoAuto || !tieneFotoMatricula || !tieneFotoLicencia) {
      return false;
    }

    return true;
  }

  validarPlaca(placa: string): boolean {
    const regex = /^[A-Z]{3}-\d{3,4}$/;
    return regex.test(placa);
  }

  onFileSelected(event: any, type: string) {
    if (!this.isEditing) return;
    const file = event.target.files[0];
    if (file) {
      this.files[type] = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.vehiculo[type + '_url_temp'] = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  triggerNotification(msg: string, type: 'success' | 'error' = 'success') {
    this.notificationMsg = msg;
    this.notificationType = type;
    this.showNotification = true;
    setTimeout(() => this.showNotification = false, 4000);
  }

  guardar() {
    if (!this.validarPlaca(this.vehiculo.placa)) {
      this.triggerNotification('Formato de placa inválido (AAA-0000)', 'error');
      return;
    }

    this.loading = true;
    const formData = new FormData();
    formData.append('placa', this.vehiculo.placa);
    formData.append('marca', this.vehiculo.marca || '');
    formData.append('modelo', this.vehiculo.modelo || '');
    formData.append('anio', this.vehiculo.anio ? this.vehiculo.anio.toString() : '');
    formData.append('tipo_vehiculo', this.vehiculo.tipo_vehiculo);
    formData.append('capacidad_max', this.vehiculo.capacidad_max.toString());
    formData.append('color', this.vehiculo.color || '');

    Object.keys(this.files).forEach(key => {
      formData.append(key, this.files[key]);
    });

    this.choferService.updateVehiculo(formData).subscribe({
      next: (res) => {
        this.triggerNotification('¡Vehículo actualizado con éxito!', 'success');
        this.cargarVehiculo();
        this.loading = false;
        this.files = {};
        this.isEditing = false;
      },
      error: (err) => {
        const msg = err.error?.error || 'Error al guardar cambios.';
        this.triggerNotification(msg, 'error');
        this.loading = false;
      }
    });
  }
}
