import { Component, OnInit, ViewChild, ElementRef, NgZone, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { GoogleMapsModule, MapDirectionsService } from '@angular/google-maps';
import { AdminService } from '../../../core/services/admin.service';
import { ViajeService } from '../../../core/services/viaje.service';
import { ReservaService } from '../../../core/services/reserva.service';

@Component({
  selector: 'app-reservas',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule],
  template: `
    <div class="animate-in fade-in duration-500 pb-16">

      <!-- GRID DE DOS COLUMNAS -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
        
        <!-- COLUMNA PRINCIPAL (IZQUIERDA) - FORMULARIO DE DESPACHO -->
        <div class="lg:col-span-2 bg-white rounded-3xl shadow-sm p-6 flex flex-col gap-6">
          <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-blue-600"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            Reservaciones
          </h2>

          <!-- BUSCADOR DE CLIENTES -->
          <div class="space-y-2 relative">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Seleccionar Cliente</label>
            <div class="flex gap-2">
              <div class="relative flex-1 group">
                <span class="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </span>
                <input 
                  type="text" 
                  [(ngModel)]="searchQuery" 
                  (input)="buscarClientes()"
                  (focus)="mostrarResultados = true"
                  placeholder="Buscar cliente por nombre, cédula o teléfono..." 
                  class="w-full pl-11 pr-4 py-3 bg-slate-50/50 border border-slate-200 rounded-2xl text-xs font-semibold focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
                >
              </div>
              <!-- BOTÓN MÁS PARA REGISTRO RÁPIDO -->
              <button 
                (click)="abrirModalCliente()"
                type="button" 
                class="w-12 h-12 flex items-center justify-center bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white active:scale-95 transition-all shadow-sm"
                title="Nuevo Cliente Rápido"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </button>
            </div>

            <!-- DROPDOWN DE RESULTADOS DE BÚSQUEDA -->
            <div 
              *ngIf="mostrarResultados && resultadosClientes.length > 0" 
              class="absolute top-full left-0 right-0 z-50 mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 max-h-60 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-200"
            >
              <div 
                *ngFor="let cliente of resultadosClientes"
                (click)="seleccionarCliente(cliente)"
                class="flex items-center justify-between px-4 py-3 hover:bg-slate-50 cursor-pointer transition-colors border-b border-slate-50 last:border-0"
              >
                <div>
                  <p class="text-xs font-bold text-slate-800">{{ cliente.nombre }}</p>
                  <p class="text-[10px] text-slate-400 font-medium mt-0.5">CI: {{ cliente.cedula }} | Telf: {{ cliente.telefono }}</p>
                </div>
                <span class="text-[9px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-1 rounded-lg">Seleccionar</span>
              </div>
            </div>

            <!-- SELECTED CUSTOMER TAG -->
            <div *ngIf="clienteSeleccionado" class="flex items-center justify-between bg-blue-50/50 border border-blue-100 rounded-2xl px-4 py-3 mt-3 animate-in slide-in-from-top-1 duration-200">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-xl bg-blue-600 text-white font-black flex items-center justify-center text-xs">
                  {{ clienteSeleccionado.nombre.charAt(0) }}
                </div>
                <div>
                  <p class="text-xs font-bold text-slate-800">{{ clienteSeleccionado.nombre }}</p>
                  <p class="text-[10px] font-bold text-blue-600 mt-0.5">Cédula: {{ clienteSeleccionado.cedula }} | Correo: {{ clienteSeleccionado.correo }}</p>
                </div>
              </div>
              <button (click)="deseleccionarCliente()" class="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-lg hover:bg-red-50">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
              </button>
            </div>
          </div>

          <!-- DETALLES DEL VIAJE (ORIGEN Y DESTINO AUTOCORREGIDOS) -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dirección de Origen</label>
              <input 
                #origenInput
                type="text" 
                [(ngModel)]="viaje.origen"
                placeholder="Ej: Aeropuerto Tababela o Sector..." 
                class="w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
              >
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Dirección de Destino</label>
              <input 
                #destinoInput
                type="text" 
                [(ngModel)]="viaje.destino"
                placeholder="Ej: Hotel Hilton Colón o Sector..." 
                class="w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
              >
            </div>
          </div>

          <!-- CAPSULAS DE METRICAS DE RUTA (GOOGLE MAPS) -->
          <div class="flex flex-wrap items-center gap-3">
            <!-- Cápsula de Distancia -->
            <div 
              [ngClass]="viaje.distancia_km ? 'bg-blue-50 border border-blue-100 text-blue-700' : 'bg-slate-100/70 border border-slate-200/60 text-slate-400'"
              class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="shrink-0">
                <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/>
                <line x1="9" x2="9" y1="3" y2="18"/>
                <line x1="15" x2="15" y1="6" y2="21"/>
              </svg>
              <span *ngIf="viaje.distancia_km">{{ (viaje.distancia_km | number:'1.1-2') + ' KM' }}</span>
              <span *ngIf="!viaje.distancia_km" class="italic text-[10px] tracking-wide">Ruta por calcular</span>
            </div>

            <!-- Cápsula de Tiempo -->
            <div 
              [ngClass]="viaje.distancia_km ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-slate-100/70 border border-slate-200/60 text-slate-400'"
              class="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold transition-all duration-300 shadow-sm"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="shrink-0">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <span *ngIf="viaje.tiempo_estimado">{{ viaje.tiempo_estimado }}</span>
              <span *ngIf="!viaje.tiempo_estimado" class="italic text-[10px] tracking-wide">Tiempo pendiente</span>
            </div>
          </div>

          <!-- TIPO DE SERVICIO Y PASAJEROS -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Tipo de Servicio</label>
              <select 
                [(ngModel)]="viaje.tipo_servicio"
                (change)="recalcularCotizacion()"
                class="w-full h-12 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold transition-all cursor-pointer shadow-sm"
              >
                <option value="pasajero">Pasajeros</option>
                <option value="encomienda">Encomienda</option>
                <option value="express">Express</option>
              </select>
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Nº de Pasajeros</label>
              <input 
                type="number" 
                [(ngModel)]="viaje.num_pasajeros"
                (input)="recalcularCotizacion()"
                [disabled]="viaje.tipo_servicio !== 'pasajero'"
                min="1"
                max="15"
                class="w-full h-12 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 text-xs font-semibold transition-all shadow-sm"
              >
            </div>
          </div>

          <!-- FECHA Y HORA -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Fecha del Viaje</label>
              <input 
                type="date" 
                [(ngModel)]="viaje.fecha"
                (change)="cargarChoferes()"
                class="w-full h-12 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold transition-all shadow-sm"
              >
            </div>
            <div class="space-y-2">
              <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Hora del Viaje</label>
              <input 
                type="time" 
                [(ngModel)]="viaje.hora"
                (change)="cargarChoferes()"
                class="w-full h-12 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold transition-all shadow-sm"
              >
            </div>
          </div>

          <!-- ASIGNACIÓN DE CHOFER -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Asignar Conductor (Opcional)</label>
            <select 
              [(ngModel)]="viaje.chofer_id"
              class="w-full h-12 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <option [value]="null">Buscar chofer para despacho inmediato o dejar pendiente...</option>
              <option *ngFor="let chofer of choferesDisponibles" [value]="chofer.id">
                {{ chofer.nombre }} (Telf: {{ chofer.telefono }})
              </option>
            </select>
          </div>

          <!-- ESTADO DE PAGO -->
          <div class="space-y-2">
            <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">Estado de Pago</label>
            <select 
              [(ngModel)]="viaje.estado_pago"
              class="w-full h-12 px-4 py-2 bg-gray-50 border border-gray-200 rounded-2xl text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-semibold transition-all cursor-pointer shadow-sm"
            >
              <option value="pendiente">Pendiente (El cliente debe subir el comprobante de pago)</option>
              <option value="aprobado">Pagado (El viaje ya queda verificado listo para iniciar)</option>
            </select>
          </div>

        </div>

        <!-- COLUMNA DE RESUMEN (DERECHA) - VIAJE CONSOLIDADO -->
        <div class="lg:col-span-1 bg-white rounded-3xl shadow-sm p-6 border border-slate-100 flex flex-col justify-between min-h-[500px]">
          
          <div class="space-y-6">
            <h2 class="text-lg font-black text-slate-800 flex items-center gap-2">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-blue-600"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              Resumen del Viaje
            </h2>

              <!-- DETAILS CONTAINER -->
              <div class="divide-y divide-slate-100 text-xs">
                
                <!-- CLIENTE -->
                <div class="py-3 flex flex-col gap-1">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Cliente</span>
                  <p class="font-bold text-slate-800 truncate" *ngIf="clienteSeleccionado">
                    {{ clienteSeleccionado.nombre }}
                  </p>
                  <p class="text-slate-400 font-semibold italic" *ngIf="!clienteSeleccionado">
                    Ningún cliente seleccionado
                  </p>
                </div>

                <!-- ITINERARIO -->
                <div class="py-3 flex flex-col gap-2">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Itinerario</span>
                  <div>
                    <p class="font-bold text-slate-800 truncate flex items-center gap-1.5" title="{{ viaje.origen }}">
                      <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {{ viaje.origen || 'Origen pendiente' }}
                    </p>
                    <p class="font-bold text-slate-800 truncate flex items-center gap-1.5 mt-1" title="{{ viaje.destino }}">
                      <span class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                      {{ viaje.destino || 'Destino pendiente' }}
                    </p>
                  </div>
                </div>

                <!-- SERVICIO Y TARIFA -->
                <div class="py-3 grid grid-cols-2 gap-4">
                  <div class="flex flex-col gap-1">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Servicio</span>
                    <p class="font-black text-blue-600 uppercase tracking-wider">
                      {{ viaje.tipo_servicio }}
                    </p>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Distancia/tiempo</span>
                    <p class="font-bold text-slate-800" *ngIf="viaje.distancia_km">
                      {{ (viaje.distancia_km | number:'1.1-2') + ' KM' }} <span class="text-[10px] text-slate-400 font-medium" *ngIf="viaje.tiempo_estimado">({{ viaje.tiempo_estimado }})</span>
                    </p>
                    <p class="text-slate-400 font-semibold italic" *ngIf="!viaje.distancia_km">
                      ---
                    </p>
                  </div>
                </div>

                <!-- FECHA Y HORA RESUMEN -->
                <div class="py-3 grid grid-cols-2 gap-4">
                  <div class="flex flex-col gap-1">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Fecha</span>
                    <p class="font-bold text-slate-800">
                      {{ viaje.fecha ? (viaje.fecha | date:'mediumDate') : '---' }}
                    </p>
                  </div>
                  <div class="flex flex-col gap-1">
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Hora</span>
                    <p class="font-bold text-slate-800">
                      {{ viaje.hora || '---' }}
                    </p>
                  </div>
                </div>

                <!-- CHOFER ASIGNADO -->
                <div class="py-3 flex flex-col gap-1">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Conductor Asignado</span>
                  <p class="font-bold text-slate-800" *ngIf="getNombreChoferSeleccionado()">
                    {{ getNombreChoferSeleccionado() }}
                  </p>
                  <p class="text-slate-400 font-semibold italic" *ngIf="!viaje.chofer_id">
                    Sin conductor asignado
                  </p>
                </div>

                <!-- ESTADO DE PAGO EN TICKET -->
                <div class="py-3 flex items-center justify-between">
                  <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Estado de Pago</span>
                  <span 
                    [class]="viaje.estado_pago === 'aprobado' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'"
                    class="px-2.5 py-1 rounded-full text-[10px] font-bold border"
                  >
                    {{ viaje.estado_pago === 'aprobado' ? 'Pagado / Verificado' : 'Pendiente' }}
                  </span>
                </div>

                <!-- TOTAL PRICE DISPLAY -->
                <div class="py-4 flex items-center justify-between border-t border-slate-100 mt-4">
                  <div>
                    <span class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Estimado</span>
                    <p class="text-[10px] text-slate-400 font-bold mt-0.5" *ngIf="zonaCotizada">{{ zonaCotizada }}</p>
                  </div>
                  <p class="text-3xl font-black text-slate-900 tracking-tight">
                    \${{ tarifaCalculada | number:'1.2-2' }}
                  </p>
                </div>

              </div>
            </div>

            <!-- ACTION BUTTONS -->
            <div class="space-y-3 pt-6">
              <button 
                (click)="confirmarDespacho()"
                [disabled]="procesando || !clienteSeleccionado || !viaje.origen || !viaje.destino || !viaje.fecha || !viaje.hora"
                class="w-full h-14 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 shadow-lg shadow-blue-500/20 active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <span *ngIf="!procesando">Confirmar Reserva</span>
                <span *ngIf="procesando" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              </button>
              
              <button 
                (click)="resetFormulario()"
                [disabled]="procesando"
                class="w-full py-3 bg-slate-50 hover:bg-slate-100 text-slate-500 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors"
              >
                Limpiar datos
              </button>
            </div>

          </div>

        </div>
      </div>

    <!-- MODAL FLOTANTE DE REGISTRO RÁPIDO DE CLIENTES -->
    <div 
      *ngIf="modalClienteAbierto" 
      class="fixed inset-0 z-[99999] flex items-center justify-center px-4 bg-slate-950/40 backdrop-blur-sm animate-in fade-in duration-300"
    >
      <div 
        class="bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-md w-full p-8 flex flex-col gap-6 animate-in zoom-in-95 duration-300"
      >
        <div class="flex items-center justify-between">
          <div>
            <span class="text-[9px] font-black text-blue-600 uppercase tracking-widest">Rápido y Seguro</span>
            <h3 class="text-xl font-black text-slate-900 tracking-tight mt-1">Registrar Cliente</h3>
          </div>
          <button (click)="cerrarModalCliente()" class="text-slate-400 hover:text-slate-600 p-2 hover:bg-slate-50 rounded-xl transition-colors">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
          </button>
        </div>

        <div class="space-y-4">
          <!-- CÉDULA -->
          <div class="space-y-1.5">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Número de Cédula</label>
            <input 
              type="text" 
              [(ngModel)]="nuevoCliente.cedula" 
              placeholder="Ej: 1712345678"
              class="w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            >
          </div>
          
          <!-- NOMBRE COMPLETO -->
          <div class="space-y-1.5">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Nombre Completo</label>
            <input 
              type="text" 
              [(ngModel)]="nuevoCliente.nombre" 
              placeholder="Ej: Juan Pérez"
              class="w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            >
          </div>

          <!-- TELÉFONO -->
          <div class="space-y-1.5">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Número de Teléfono</label>
            <input 
              type="text" 
              [(ngModel)]="nuevoCliente.telefono" 
              placeholder="Ej: 0998765432"
              class="w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            >
          </div>

          <!-- CORREO ELECTRÓNICO -->
          <div class="space-y-1.5">
            <label class="text-[9px] font-black text-slate-400 uppercase tracking-widest">Correo Electrónico</label>
            <input 
              type="email" 
              [(ngModel)]="nuevoCliente.correo" 
              placeholder="Ej: juan.perez&#64;gmail.com"
              class="w-full border border-slate-200 rounded-2xl px-4 py-3 text-xs font-semibold bg-slate-50/50 focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-sm"
            >
          </div>
        </div>

        <div *ngIf="errorModal" class="bg-red-50 text-red-600 text-xs font-semibold px-4 py-3 rounded-2xl border border-red-100">
          {{ errorModal }}
        </div>

        <button 
          (click)="registrarCliente()"
          [disabled]="guardandoCliente || !nuevoCliente.cedula || !nuevoCliente.nombre || !nuevoCliente.telefono || !nuevoCliente.correo"
          class="w-full h-12 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2"
        >
          <span *ngIf="!guardandoCliente">Crear y Seleccionar</span>
          <span *ngIf="guardandoCliente" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
        </button>
      </div>
    </div>

    <!-- TOAST DE ALERTA PREMIUM -->
    <div 
      *ngIf="alerta" 
      [ngClass]="{
        'bg-emerald-50 border-emerald-100 text-emerald-800': alerta.tipo === 'success',
        'bg-red-50 border-red-100 text-red-800': alerta.tipo === 'error'
      }"
      class="fixed bottom-6 right-6 z-[999999] px-6 py-4 rounded-3xl border shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-8 duration-300"
    >
      <div 
        class="w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs"
        [ngClass]="{
          'bg-emerald-500 text-white': alerta.tipo === 'success',
          'bg-red-500 text-white': alerta.tipo === 'error'
        }"
      >
        ✓
      </div>
      <p class="text-xs font-black uppercase tracking-wider">{{ alerta.mensaje }}</p>
    </div>
  `,
  styles: [`
    /* Scrollbar-less behaviors */
    ::-webkit-scrollbar {
      display: none;
    }
  `]
})
export class ReservasComponent implements OnInit, AfterViewInit {
  @ViewChild('origenInput') origenInput!: ElementRef<HTMLInputElement>;
  @ViewChild('destinoInput') destinoInput!: ElementRef<HTMLInputElement>;

  // Búsqueda de clientes
  searchQuery: string = '';
  mostrarResultados: boolean = false;
  resultadosClientes: any[] = [];
  clienteSeleccionado: any = null;

  // Choferes disponibles
  choferesDisponibles: any[] = [];

  // Coordenadas calculadas para la ruta
  origenLocation?: google.maps.LatLngLiteral;
  destinoLocation?: google.maps.LatLngLiteral;

  // Datos del viaje
  viaje: any = {
    origen: '',
    destino: '',
    distancia_km: null,
    tiempo_estimado: '',
    tipo_servicio: 'pasajero',
    num_pasajeros: 1,
    fecha: '',
    hora: '',
    chofer_id: null,
    estado_pago: 'pendiente'
  };

  // Cotización y tarifas
  tarifaCalculada: number = 0;
  zonaCotizada: string = '';

  // Procesamiento general
  procesando: boolean = false;
  alerta: any = null;

  // Modal cliente rápido
  modalClienteAbierto: boolean = false;
  guardandoCliente: boolean = false;
  errorModal: string = '';
  nuevoCliente: any = {
    cedula: '',
    nombre: '',
    telefono: '',
    correo: ''
  };

  constructor(
    private adminService: AdminService,
    private viajeService: ViajeService,
    private reservaService: ReservaService,
    private directionsService: MapDirectionsService,
    private ngZone: NgZone,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.cargarChoferes();
  }

  ngAfterViewInit(): void {
    this.initAutocomplete();
  }

  initAutocomplete(): void {
    if (!google || !google.maps || !google.maps.places) {
      // Reintento si el script de Google Maps API se carga de manera asíncrona
      setTimeout(() => this.initAutocomplete(), 500);
      return;
    }

    const autocompleteOrigen = new google.maps.places.Autocomplete(this.origenInput.nativeElement, { componentRestrictions: { country: 'ec' } });
    const autocompleteDestino = new google.maps.places.Autocomplete(this.destinoInput.nativeElement, { componentRestrictions: { country: 'ec' } });

    autocompleteOrigen.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = autocompleteOrigen.getPlace();
        if (place.geometry && place.geometry.location) {
          this.origenLocation = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
          this.viaje.origen = place.formatted_address || '';
          this.calculateRoute();
        }
      });
    });

    autocompleteDestino.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = autocompleteDestino.getPlace();
        if (place.geometry && place.geometry.location) {
          this.destinoLocation = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
          this.viaje.destino = place.formatted_address || '';
          this.calculateRoute();
        }
      });
    });
  }

  calculateRoute(): void {
    if (!this.origenLocation || !this.destinoLocation) return;

    const request: google.maps.DirectionsRequest = {
      origin: this.origenLocation,
      destination: this.destinoLocation,
      travelMode: google.maps.TravelMode.DRIVING
    };

    this.directionsService.route(request).subscribe({
      next: (response) => {
        this.ngZone.run(() => {
          if (response.result?.routes[0]?.legs[0]) {
            const leg = response.result.routes[0].legs[0];
            this.viaje.distancia_km = (leg.distance?.value || 0) / 1000;
            this.viaje.tiempo_estimado = leg.duration?.text || '';
            this.recalcularCotizacion();
            this.cargarChoferes();
          }
        });
      },
      error: (err) => {
        console.error('Error calculando ruta:', err);
      }
    });
  }

  convertirTiempoAMinutos(tiempoStr: string): number {
    if (!tiempoStr) return 30;
    
    let totalMinutos = 0;
    
    // Buscar horas
    const horasMatch = tiempoStr.match(/(\d+)\s*(h|hor)/i);
    if (horasMatch) {
      totalMinutos += parseInt(horasMatch[1], 10) * 60;
    }
    
    // Buscar minutos
    const minutosMatch = tiempoStr.match(/(\d+)\s*(m|min)/i);
    if (minutosMatch) {
      totalMinutos += parseInt(minutosMatch[1], 10);
    }
    
    return totalMinutos > 0 ? totalMinutos : 30;
  }

  cargarChoferes(): void {
    const fecha = this.viaje.fecha;
    const hora = this.viaje.hora;
    let fechaViajeParam: string | undefined;
    let duracionParam: number | undefined;

    if (fecha && hora) {
      fechaViajeParam = `${fecha} ${hora}`;
      duracionParam = this.convertirTiempoAMinutos(this.viaje.tiempo_estimado);
    }

    // Buscar todos los choferes mediante el servicio de administración con filtros de horario
    this.adminService.getUsuarios(
      'chofer',
      undefined,
      'true', // solo activos
      undefined,
      undefined,
      undefined,
      fechaViajeParam,
      duracionParam
    ).subscribe({
      next: (choferes) => {
        this.choferesDisponibles = choferes;
      },
      error: (err) => {
        console.error('Error cargando choferes:', err);
      }
    });
  }

  buscarClientes(): void {
    if (!this.searchQuery || this.searchQuery.trim().length < 2) {
      this.resultadosClientes = [];
      return;
    }

    this.adminService.getUsuarios('cliente', this.searchQuery).subscribe({
      next: (res) => {
        this.resultadosClientes = res;
      },
      error: (err) => {
        console.error('Error buscando clientes:', err);
      }
    });
  }

  seleccionarCliente(cliente: any): void {
    this.clienteSeleccionado = cliente;
    this.searchQuery = cliente.nombre;
    this.mostrarResultados = false;
  }

  deseleccionarCliente(): void {
    this.clienteSeleccionado = null;
    this.searchQuery = '';
    this.resultadosClientes = [];
  }

  getNombreChoferSeleccionado(): string | null {
    if (!this.viaje.chofer_id) return null;
    const found = this.choferesDisponibles.find(c => c.id === Number(this.viaje.chofer_id));
    return found ? found.nombre : null;
  }

  recalcularCotizacion(): void {
    if (!this.viaje.distancia_km || this.viaje.distancia_km <= 0) {
      this.tarifaCalculada = 0;
      this.zonaCotizada = '';
      return;
    }

    const payload = {
      distancia_km: Number(this.viaje.distancia_km),
      tipo_servicio: this.viaje.tipo_servicio,
      num_pasajeros: Number(this.viaje.num_pasajeros || 1)
    };

    // Llamar al método local/remoto de cotización
    this.viajeService.cotizarViaje(payload as any).subscribe({
      next: (res) => {
        this.tarifaCalculada = res.precio_total;
        this.zonaCotizada = res.zona;
      },
      error: (err) => {
        console.error('Error recalculando tarifa:', err);
      }
    });
  }

  // MODAL CLIENTE RÁPIDO
  abrirModalCliente(): void {
    this.nuevoCliente = {
      cedula: '',
      nombre: '',
      telefono: '',
      correo: ''
    };
    this.errorModal = '';
    this.modalClienteAbierto = true;
  }

  cerrarModalCliente(): void {
    this.modalClienteAbierto = false;
  }

  registrarCliente(): void {
    this.guardandoCliente = true;
    this.errorModal = '';

    const payload = {
      nombre: this.nuevoCliente.nombre,
      cedula: this.nuevoCliente.cedula,
      telefono: this.nuevoCliente.telefono,
      correo: this.nuevoCliente.correo,
      password: this.nuevoCliente.cedula, // contraseña por defecto = cédula
      rol: 'cliente'
    };

    // Hacer petición POST directa para no pisar la sesión del admin
    this.http.post('http://127.0.0.1:5001/api/auth/register', payload).subscribe({
      next: (res: any) => {
        this.mostrarAlerta('success', 'Cliente registrado y seleccionado');

        // Seleccionar automáticamente al cliente registrado
        if (res.usuario) {
          this.clienteSeleccionado = res.usuario;
          this.searchQuery = res.usuario.nombre;
        } else {
          // Fallback por si la estructura difiere levemente
          this.clienteSeleccionado = {
            id: res.id || null,
            nombre: payload.nombre,
            cedula: payload.cedula,
            telefono: payload.telefono,
            correo: payload.correo
          };
          this.searchQuery = payload.nombre;
        }

        this.guardandoCliente = false;
        this.modalClienteAbierto = false;
      },
      error: (err) => {
        console.error('Error registrando cliente rápido:', err);
        this.errorModal = err.error?.error || 'No se pudo registrar el cliente. Valida si la cédula o correo ya existen.';
        this.guardandoCliente = false;
      }
    });
  }

  mostrarAlerta(tipo: 'success' | 'error', mensaje: string): void {
    this.alerta = { tipo, mensaje };
    setTimeout(() => {
      this.alerta = null;
    }, 4000);
  }

  confirmarDespacho(): void {
    if (!this.clienteSeleccionado) return;
    this.procesando = true;

    // Estructura completa compatible con viaje_service.reservar
    const datosReserva = {
      cliente_id: this.clienteSeleccionado.id,
      origen: this.viaje.origen,
      destino: this.viaje.destino,
      distancia_km: Number(this.viaje.distancia_km || 0),
      tarifa: Number(this.tarifaCalculada),
      tipo_servicio: this.viaje.tipo_servicio,
      chofer_id: this.viaje.chofer_id ? Number(this.viaje.chofer_id) : null,
      fecha_viaje: this.viaje.fecha + ' ' + this.viaje.hora,
      duracion_minutos: this.convertirTiempoAMinutos(this.viaje.tiempo_estimado),
      estado_pago: this.viaje.estado_pago
    };

    this.reservaService.crearReserva(datosReserva).subscribe({
      next: (res) => {
        this.mostrarAlerta('success', 'Reserva y despacho creados exitosamente');
        this.resetFormulario();
        this.procesando = false;
      },
      error: (err) => {
        console.error('Error confirmando despacho:', err);
        this.mostrarAlerta('error', err.error?.error || 'Ocurrió un error al despachar el viaje');
        this.procesando = false;
      }
    });
  }

  resetFormulario(): void {
    this.clienteSeleccionado = null;
    this.searchQuery = '';
    this.resultadosClientes = [];
    this.origenLocation = undefined;
    this.destinoLocation = undefined;
    this.viaje = {
      origen: '',
      destino: '',
      distancia_km: null,
      tiempo_estimado: '',
      tipo_servicio: 'pasajero',
      num_pasajeros: 1,
      fecha: '',
      hora: '',
      chofer_id: null,
      estado_pago: 'pendiente'
    };
    this.tarifaCalculada = 0;
    this.zonaCotizada = '';

    // Vaciar físicamente el texto de los inputs del autocompletado
    if (this.origenInput) this.origenInput.nativeElement.value = '';
    if (this.destinoInput) this.destinoInput.nativeElement.value = '';
  }
}
