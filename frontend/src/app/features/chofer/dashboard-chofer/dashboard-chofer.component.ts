import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocketService } from '../../../core/services/socket.service';
import { AuthService } from '../../../core/services/auth.service';
import { ViajeService } from '../../../core/services/viaje.service';
import { SoapService } from '../../../core/services/soap.service';
import { Subscription } from 'rxjs';
import { ChoferService } from '../../../core/services/chofer.service';

import { ChatSidebarComponent } from '../../../shared/components/chat-sidebar/chat-sidebar.component';
import { ChatPanelComponent } from '../../../shared/components/chat-panel/chat-panel.component';

@Component({
  selector: 'app-dashboard-chofer',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatSidebarComponent, ChatPanelComponent],
  template: `
    <!-- VISTA CONSOLA FIJA (SIN SCROLL) -->
    <div class="h-screen w-full flex flex-col overflow-hidden bg-slate-50 lg:flex-row lg:p-8 lg:gap-8 font-sans">
      
      <!-- SECCIÓN MAPA (Elástica en móvil) -->
      <div class="flex-1 w-full min-h-0 lg:h-full lg:flex-[7] order-1 lg:order-2 relative">
        <div class="w-full h-full lg:rounded-3xl lg:shadow-sm lg:border-8 lg:border-white overflow-hidden relative">
          <div id="choferMap" class="w-full h-full"></div>
          
          <!-- Radar Effect (Sólo si no hay viaje y estamos en Express) -->
          <div *ngIf="activeTab === 'express' && !viajeActual && nuevosViajes.length === 0" class="absolute inset-0 z-10 pointer-events-none flex items-center justify-center bg-blue-600/5">
             <div class="relative">
               <div class="absolute inset-0 -m-20 border border-blue-500/20 rounded-full animate-ping"></div>
               <div class="absolute inset-0 -m-40 border border-blue-500/10 rounded-full animate-ping" style="animation-delay: 1s"></div>
             </div>
          </div>

          <!-- Badge Status (Solo punto) -->
          <div class="absolute top-6 left-6 p-2 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-white flex items-center gap-2">
            <div class="w-2.5 h-2.5 bg-blue-600 rounded-full animate-ping"></div>
          </div>
        </div>
      </div>

      <!-- SECCIÓN INFORMACIÓN / ACCIONES (Compacta) -->
      <div class="shrink-0 w-full p-4 pb-[84px] lg:pb-0 lg:h-full lg:flex-[5] order-2 lg:order-1 lg:p-0 flex flex-col">
        
        <div class="w-full bg-white lg:bg-transparent rounded-3xl lg:rounded-none p-4 pb-2 lg:p-0 shadow-sm lg:shadow-none border border-gray-100 lg:border-none flex flex-col gap-3 justify-between lg:h-full overflow-hidden">
          
          <!-- Subtle type header -->
          <div class="flex items-center justify-between px-2 py-1 shrink-0 border-b border-gray-100/50 pb-2">
            <span class="text-[10px] font-black uppercase tracking-widest"
                  [ngClass]="{
                    'text-blue-600': activeTab === 'express',
                    'text-indigo-600': activeTab === 'shared'
                  }">
              {{ activeTab === 'express' ? (viajeActual?.tipo_servicio === 'encomienda' ? 'Envío de Paquete' : 'Servicio Exprés') : 'Ruta Compartida' }}
            </span>
            <div *ngIf="activeTab === 'shared' && frecuenciaAsignada" class="flex items-center gap-1.5">
              <span class="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-black rounded-full uppercase tracking-wider border border-blue-100">
                {{ (frecuenciaAsignada.estado || 'PROGRAMADO').toUpperCase() }}
              </span>
              <span *ngIf="(frecuenciaAsignada.estado || '').toUpperCase() === 'EN_RUTA'" class="w-2 h-2 bg-green-500 rounded-full animate-ping"></span>
            </div>
          </div>

          <!-- CONTENIDO DINÁMICO SEGÚN LA PESTAÑA -->
          <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
            
            <!-- ====== PESTAÑA: VIAJES EXPRÉS ====== -->
            <div *ngIf="activeTab === 'express'" class="flex-1 flex flex-col justify-between h-full">
              <div class="flex-1 flex flex-col justify-center">
                <!-- ESTADO: BUSCANDO -->
                <div *ngIf="!viajeActual" class="text-center space-y-2 animate-slide-up">
                  <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto animate-pulse">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 2v4M12 18v4M4.9 4.9l2.9 2.9M16.2 16.2l2.9 2.9M2 12h4M18 12h4M4.9 19.1l2.9-2.9M16.2 7.8l2.9-2.9"/></svg>
                  </div>
                  <h3 class="text-base font-black text-gray-900 uppercase tracking-wider font-sans">Buscando Exprés y Paquetes</h3>
                </div>
     
                <!-- ESTADO: EN VIAJE -->
                <div *ngIf="viajeActual" class="space-y-4 animate-slide-up">
                  <!-- Info Cliente Compacta -->
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-3">
                      <div class="w-10 h-10 bg-gray-900 text-white rounded-full flex items-center justify-center shadow-lg overflow-hidden border border-gray-800 shrink-0">
                        <img *ngIf="viajeActual.foto_cliente_url" [src]="'http://localhost:5001/' + viajeActual.foto_cliente_url" class="w-full h-full object-cover rounded-full">
                        <svg *ngIf="!viajeActual.foto_cliente_url" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      </div>
                      <div>
                        <h4 class="text-base font-black text-gray-900 leading-tight">{{ viajeActual.nombre_cliente || 'Pasajero VIP' }}</h4>
                        <p class="text-[8px] font-bold text-blue-600 uppercase tracking-widest">
                          {{ viajeActual.tipo_servicio === 'encomienda' ? 'Paquete en Curso' : 'En Curso' }} • $ {{ viajeActual.tarifa || viajeActual.monto }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Detalle de Paquete (Encomienda) -->
                  <div *ngIf="viajeActual.tipo_servicio === 'encomienda' && viajeActual.referencia" class="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-start gap-2">
                    <span class="text-lg leading-none mt-0.5">📦</span>
                    <div class="flex-1 min-w-0">
                      <p class="text-[9px] font-black text-indigo-500 uppercase tracking-widest leading-none mb-1">Detalles del Envío</p>
                      <p class="text-[10px] font-bold text-indigo-950 leading-snug break-words">{{ viajeActual.referencia }}</p>
                    </div>
                  </div>

                  <!-- Ruta Ultra-Compacta -->
                  <div class="p-3 bg-gray-50 rounded-2xl border border-gray-100 space-y-2">
                    <div class="flex items-center gap-2">
                      <div class="w-1 h-1 bg-blue-500 rounded-full shrink-0"></div>
                      <p class="text-[10px] font-bold text-gray-500 leading-tight line-clamp-1">{{ viajeActual.origen }}</p>
                    </div>
                    <div class="flex items-center gap-2">
                      <div class="w-1 h-1 bg-gray-900 rounded-sm shrink-0"></div>
                      <p class="text-[10px] font-black text-gray-900 leading-tight line-clamp-1">{{ viajeActual.destino }}</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- BOTONERA FIJA INFERIOR (UNA SOLA FILA) -->
              <div *ngIf="viajeActual" class="pt-3 border-t border-gray-50 flex gap-2 items-center h-16 shrink-0">
                <!-- Cancelar -->
                <button (click)="cancelarViaje()" 
                       class="w-12 h-12 bg-red-50 text-red-500 rounded-xl flex items-center justify-center hover:bg-red-100 transition-all border border-red-100 active:scale-95 shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>

                <!-- Chat -->
                <button (click)="openChat()" 
                       class="w-12 h-12 bg-gray-50 text-gray-900 rounded-xl flex items-center justify-center hover:bg-gray-100 transition-all border border-gray-100 active:scale-95 shrink-0 relative">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7c1.1 0 2.2.3 3.2.8l4.4-1.1-1.1 4.4z"/></svg>
                  <div *ngIf="unreadMessages > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                    {{ unreadMessages }}
                  </div>
                </button>

                <!-- Acción Dinámica -->
                <div class="flex-1 h-12">
                  <button *ngIf="viajeActual.estado_logistico === 'aceptado'" (click)="marcarLlegada()" 
                          class="w-full h-full bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95">
                     {{ viajeActual.tipo_servicio === 'encomienda' ? 'Llegué a Recogida' : 'Llegué al Origen' }}
                  </button>
                  <button *ngIf="viajeActual.estado_logistico === 'esperando_cliente'" (click)="isScannerOpen = true" 
                          class="w-full h-full bg-blue-600 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95">
                     {{ viajeActual.tipo_servicio === 'encomienda' ? 'Validar Retiro (PIN)' : 'Validar Abordaje' }}
                  </button>
                  <button *ngIf="viajeActual.estado_logistico === 'en_curso'" (click)="finalizarViaje()" 
                          class="w-full h-full bg-gray-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-black/20 hover:bg-green-600 active:scale-95">
                     {{ viajeActual.tipo_servicio === 'encomienda' ? 'Entregar Paquete' : 'Finalizar Viaje' }}
                  </button>
                </div>
              </div>
            </div>

            <!-- ====== PESTAÑA: RUTAS COMPARTIDAS ====== -->
            <div *ngIf="activeTab === 'shared'" class="flex-1 flex flex-col justify-between h-full overflow-hidden">
              
              <!-- LOADING STATE -->
              <div *ngIf="loadingFrecuencias" class="flex-1 flex flex-col items-center justify-center py-10 shrink-0">
                <div class="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                <p class="mt-2 text-xs text-gray-500 font-bold">Cargando frecuencia asignada...</p>
              </div>

              <!-- SIN FRECUENCIA ASIGNADA -->
              <div *ngIf="!loadingFrecuencias && !frecuenciaAsignada" class="flex-1 flex flex-col items-center justify-center py-10 text-center px-4 shrink-0">
                <div class="w-12 h-12 bg-gray-100 rounded-2xl flex items-center justify-center mb-3 text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M16 3h5v5M8 3H3v5M12 22v-4M17 22H7M2 12h20"/>
                  </svg>
                </div>
                <h3 class="text-sm font-black text-gray-900 uppercase tracking-wider">Sin Ruta Asignada</h3>
                <p class="text-[10px] text-gray-400 font-medium mt-1">No tienes frecuencias programadas o asignadas para el día de hoy.</p>
                <button (click)="cargarFrecuenciaAsignada()" class="mt-4 px-5 py-2.5 bg-white border border-gray-200 rounded-2xl text-[9px] font-black text-gray-700 uppercase tracking-wider hover:bg-gray-50 shadow-sm active:scale-95 transition-all">
                  Reintentar
                </button>
              </div>

              <!-- FRECUENCIA ASIGNADA -->
              <div *ngIf="!loadingFrecuencias && frecuenciaAsignada" class="flex-1 flex flex-col min-h-0 overflow-hidden">
                
                <!-- Tarjeta de Frecuencia (Rediseñada a blanco / estilo premium) -->
                <div class="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm relative overflow-hidden mb-4 shrink-0 animate-slide-up">
                  <div class="absolute -right-8 -bottom-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
                  <div class="flex items-center justify-between mb-3">
                    <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-black rounded-full uppercase tracking-wider border border-blue-100">
                      {{ (frecuenciaAsignada.estado || 'PROGRAMADO').toUpperCase() }}
                    </span>
                    <span class="text-xs font-black text-gray-950">
                      <span class="text-blue-600 font-extrabold">$</span>{{ frecuenciaAsignada.precio_asiento | number:'1.2-2' }} <span class="text-[8px] font-medium text-gray-400">/ as.</span>
                    </span>
                  </div>
                  
                  <div class="space-y-1.5 mb-3">
                    <p class="text-[10px] text-gray-600 font-semibold truncate"><span class="font-black text-blue-600">Desde:</span> {{ frecuenciaAsignada.dir_origen }}</p>
                    <p class="text-[10px] text-gray-600 font-semibold truncate"><span class="font-black text-gray-900">Hasta:</span> {{ frecuenciaAsignada.dir_destino }}</p>
                  </div>

                  <div class="border-t border-gray-100 pt-3 flex justify-between items-center text-[9px] text-gray-400 font-black uppercase tracking-wider">
                    <div>
                      Salida: <span class="text-gray-700 font-bold">{{ frecuenciaAsignada.fecha_hora_salida }}</span>
                    </div>
                    <div>
                      Asientos: <span class="text-gray-700 font-bold">{{ capacidadOcupada }} / {{ frecuenciaAsignada.capacidad_total }}</span>
                    </div>
                  </div>
                </div>

                <!-- Botón de Operación de Frecuencia con Toggle de Manifiesto -->
                <div class="mb-4 shrink-0 px-1 flex gap-2 items-center">
                  <!-- Chat -->
                  <button 
                    (click)="abrirMensajeriaCompartido()"
                    class="w-12 h-12 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl transition-all active:scale-95 flex items-center justify-center relative shrink-0"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7c1.1 0 2.2.3 3.2.8l4.4-1.1-1.1 4.4z"/></svg>
                    <div *ngIf="totalUnreadSharedMessages > 0" class="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-md">
                      {{ totalUnreadSharedMessages }}
                    </div>
                  </button>

                  <!-- Iniciar Viaje -->
                  <button 
                    *ngIf="(frecuenciaAsignada.estado || '').toUpperCase() === 'PROGRAMADO'"
                    (click)="iniciarFrecuenciaViaje()"
                    [disabled]="updatingFrecuenciaStatus"
                    class="flex-1 h-12 bg-blue-600 disabled:bg-gray-150 text-white disabled:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-500/10 flex items-center justify-center gap-2"
                  >
                    <span *ngIf="updatingFrecuenciaStatus" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M11.596 8.697l-6.363 3.692c-.54.313-1.233-.066-1.233-.697V4.308c0-.63.692-1.01 1.233-.696l6.363 3.692a.802.802 0 0 1 0 1.393z"/></svg>
                    Iniciar Viaje
                  </button>
                  
                  <!-- Terminar Viaje -->
                  <button 
                    *ngIf="(frecuenciaAsignada.estado || '').toUpperCase() === 'EN_RUTA'"
                    (click)="terminarFrecuenciaViaje()"
                    [disabled]="updatingFrecuenciaStatus"
                    class="flex-1 h-12 bg-gray-900 disabled:bg-gray-150 text-white disabled:text-gray-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-600 active:scale-95 transition-all shadow-lg flex items-center justify-center gap-2"
                  >
                    <span *ngIf="updatingFrecuenciaStatus" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"/></svg>
                    Terminar Viaje
                  </button>

                  <!-- Toggle Manifiesto Pasajeros (Gente elegante) -->
                  <button 
                    (click)="togglePassengerManifest()"
                    [class.bg-blue-50]="showPassengerManifest"
                    [class.text-blue-600]="showPassengerManifest"
                    [class.bg-slate-100]="!showPassengerManifest"
                    [class.text-slate-700]="!showPassengerManifest"
                    class="w-12 h-12 rounded-2xl transition-all active:scale-95 flex items-center justify-center shrink-0 border border-transparent"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                  </button>
                </div>

                <!-- MANIFIESTO DE PASAJEROS -->
                <div *ngIf="showPassengerManifest" class="flex-1 flex flex-col min-h-0 bg-white rounded-3xl border border-gray-100 p-4 shadow-sm overflow-hidden animate-slide-up">
                  <div class="flex items-center justify-between border-b border-gray-100 pb-2 mb-2 shrink-0">
                    <h4 class="text-xs font-black text-gray-900 uppercase tracking-wider">Manifiesto de Pasajeros</h4>
                    <button (click)="cargarManifiesto(frecuenciaAsignada.id)" class="text-[9px] font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-wider">
                      Actualizar
                    </button>
                  </div>

                  <!-- LOADING MANIFIESTO -->
                  <div *ngIf="loadingManifiesto" class="flex-1 flex items-center justify-center py-10 shrink-0">
                    <div class="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>

                  <!-- SIN PASAJEROS -->
                  <div *ngIf="!loadingManifiesto && manifiestoPasajeros.length === 0" class="flex-1 flex items-center justify-center py-10 text-center shrink-0">
                    <p class="text-[10px] text-gray-400 font-bold">No hay pasajes vendidos en esta frecuencia todavía.</p>
                  </div>

                  <!-- LISTA DE PASAJEROS -->
                  <div *ngIf="!loadingManifiesto && manifiestoPasajeros.length > 0" class="flex-1 overflow-y-auto divide-y divide-gray-50 pr-1 select-text">
                    <div *ngFor="let pasaje of manifiestoPasajeros" class="py-3.5 flex flex-col gap-2">
                      <div class="flex justify-between items-center">
                        <div class="flex items-center gap-3">
                          <!-- Número de asiento -->
                          <div class="w-6 h-6 bg-blue-50 text-blue-600 rounded-lg flex items-center justify-center text-[9px] font-black shrink-0 shadow-sm border border-blue-100">
                            #{{ pasaje.numero_asiento }}
                          </div>
                          
                          <!-- Avatar de Pasajero -->
                          <div class="w-8 h-8 bg-gray-150 text-gray-500 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 shrink-0">
                            <img *ngIf="pasaje.foto_usuario_url" [src]="'http://localhost:5001/' + pasaje.foto_usuario_url" class="w-full h-full object-cover">
                            <svg *ngIf="!pasaje.foto_usuario_url" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                          </div>

                          <div>
                            <p class="text-[11px] font-black text-gray-800 leading-tight">{{ pasaje.nombre_usuario }}</p>
                            <p class="text-[8px] text-gray-400 font-semibold">Aborda en: <span class="text-gray-600 font-bold">{{ pasaje.punto_abordaje }}</span></p>
                          </div>
                        </div>
                        
                        <!-- Lado Derecho: Badge o Acciones Directas -->
                        <div class="flex items-center gap-2">
                          <!-- Badge Estado A Bordo -->
                          <span 
                            *ngIf="pasaje.estado_pago === 'ABORDO' || pasaje.estado_pago === 'CONFIRMADO_ABORDO'"
                            class="px-2.5 py-1 bg-green-50 text-green-700 text-[8px] font-black rounded-full uppercase tracking-wider border border-green-150"
                          >
                            A Bordo / Asistió
                          </span>

                          <!-- Acciones Rápidas (Solo si está CONFIRMADO) -->
                          <div *ngIf="pasaje.estado_pago === 'CONFIRMADO'" class="flex items-center gap-1.5">
                            <button 
                              (click)="abrirModalPin(pasaje)"
                              class="px-2.5 py-1.5 bg-green-600 hover:bg-green-700 text-white text-[9px] font-black rounded-xl uppercase tracking-wider flex items-center gap-1 shadow-sm active:scale-95 transition-all"
                            >
                              Asistió
                            </button>
                            <button 
                              (click)="marcarNoAsistio(pasaje)"
                              class="px-2.5 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 text-gray-500 text-[9px] font-black rounded-xl uppercase tracking-wider active:scale-95 transition-all border border-gray-250/30"
                            >
                              No Asistió
                            </button>
                          </div>
                        </div>
                      </div>

                      <!-- Confirmado / A Bordo Visual Indicator -->
                      <div *ngIf="pasaje.estado_pago === 'ABORDO' || pasaje.estado_pago === 'CONFIRMADO_ABORDO'" class="flex items-center gap-1.5 text-[9px] font-bold text-green-600 bg-green-50/50 px-2.5 py-1 rounded-xl w-fit mt-1">
                        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="none" stroke="currentColor" stroke-width="3" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
                        </svg>
                        Pasajero a Bordo
                      </div>
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>

        </div>
      </div>

    </div>

    <!-- STACK DE SOLICITUDES DE VIAJE EN PARALELO (FLOTANTE) -->
    <div *ngIf="activeTab === 'express' && !viajeActual && nuevosViajes.length > 0" class="fixed top-24 right-6 left-6 md:left-auto md:w-96 z-[10000] flex flex-col gap-4 pointer-events-none">
      <div *ngFor="let viaje of nuevosViajes" class="pointer-events-auto bg-white rounded-3xl p-6 shadow-2xl border border-gray-100 relative overflow-hidden animate-fade-in-right">
         <!-- Barra de progreso individual (15s) -->
         <div class="absolute bottom-0 left-0 right-0 h-1.5 bg-gray-100 overflow-hidden">
           <div class="h-full bg-blue-600 animate-notification-timeout" [style.animationDuration.ms]="15000"></div>
         </div>
         
         <div class="flex items-start gap-4">
            <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shrink-0">
               <svg *ngIf="viaje.tipo_servicio === 'encomienda'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"/><polygon points="12 22.08 21 17.08 21 6.92 12 12 12 22.08"/><polygon points="12 12 21 6.92 12 1.84 3 6.92 12 12"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
               <svg *ngIf="viaje.tipo_servicio !== 'encomienda'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C2.1 10.3 2 10.6 2 11v5c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
            <div class="flex-1 min-w-0">
               <div class="flex justify-between items-start">
                  <h4 class="text-sm font-black text-gray-900">{{ viaje.tipo_servicio === 'encomienda' ? '¡Nuevo Paquete!' : '¡Nuevo Viaje!' }}</h4>
                  <span class="text-lg font-black text-green-600 leading-none">$ {{ viaje.tarifa }}</span>
               </div>
               <p class="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-0.5">A {{ viaje.distancia || '2.4' }} km</p>
               
               <div class="mt-3 space-y-1.5">
                  <p class="text-[10px] font-bold text-gray-700 truncate"><span class="text-blue-500 font-extrabold">De:</span> {{ viaje.origen }}</p>
                  <p class="text-[10px] font-bold text-gray-700 truncate"><span class="text-gray-900 font-extrabold">A:</span> {{ viaje.destino }}</p>
               </div>
               
               <div class="mt-4 flex gap-3">
                  <button (click)="aceptarViaje(viaje)" class="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase tracking-wider shadow-md hover:bg-blue-700 transition-all active:scale-95">{{ viaje.tipo_servicio === 'encomienda' ? 'Aceptar Envío' : 'Aceptar' }}</button>
                  <button (click)="rechazarViaje(viaje)" class="py-2.5 px-4 bg-gray-50 text-gray-400 rounded-xl font-black text-[10px] uppercase tracking-wider border border-gray-100 hover:bg-gray-100 transition-all active:scale-95">Ignorar</button>
               </div>
            </div>
         </div>
      </div>
    </div>

    <!-- MODALES DE CONTROL (CONFIRMACIONES, SCANNER, ETC) -->
    <!-- Scanner -->
    <div *ngIf="isScannerOpen" class="fixed inset-0 z-[10001] flex items-center justify-center p-6 animate-fade-in">
      <div class="absolute inset-0 bg-gray-900/80 backdrop-blur-xl" (click)="isScannerOpen = false"></div>
      <div class="bg-white w-full max-w-sm rounded-3xl p-12 relative z-10 shadow-sm text-center">
        <h3 class="text-3xl font-black text-gray-900 mb-8">{{ viajeActual?.tipo_servicio === 'encomienda' ? 'Validar Retiro' : 'Validar Abordaje' }}</h3>
        <div class="bg-gray-50 aspect-square rounded-3xl mb-10 flex flex-col items-center justify-center border-2 border-dashed border-gray-200 relative overflow-hidden">
           <div class="w-40 h-40 border-4 border-blue-500/30 rounded-3xl relative">
              <div class="absolute top-0 left-0 w-full h-1 bg-blue-500 animate-scanner-line shadow-[0_0_15px_rgba(59,130,246,0.8)]"></div>
           </div>
        </div>
        <div class="space-y-4">
          <input type="text" [(ngModel)]="pinIngresado" maxlength="4" placeholder="PIN de 4 dígitos" class="w-full py-6 bg-gray-50 rounded-2xl text-center font-black text-3xl tracking-[0.3em] focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all">
          <button (click)="confirmarAbordaje()" class="w-full h-20 bg-blue-600 text-white font-black rounded-3xl shadow-sm active:scale-95 transition-all uppercase tracking-widest text-xs">Confirmar</button>
        </div>
      </div>
    </div>

    <!-- Finalizar -->
    <div *ngIf="showFinishModal" class="fixed inset-0 z-[10001] flex items-center justify-center p-6 animate-fade-in">
      <div class="absolute inset-0 bg-blue-900/40 backdrop-blur-xl" (click)="showFinishModal = false"></div>
      <div class="bg-white w-full max-w-sm rounded-3xl p-10 relative z-10 shadow-sm text-center">
        <div class="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h3 class="text-2xl font-black text-gray-900 mb-4 font-black">{{ viajeActual?.tipo_servicio === 'encomienda' ? '¿Entrega Completada?' : '¿Viaje Terminado?' }}</h3>
        <p class="text-gray-500 text-sm font-medium mb-10 px-4">{{ viajeActual?.tipo_servicio === 'encomienda' ? 'Asegúrate de haber entregado el paquete al destinatario correspondiente.' : 'Asegúrate de que el pasajero haya desembarcado con seguridad en el destino.' }}</p>
        <div class="grid grid-cols-1 gap-4">
          <button (click)="confirmarFinalizacion()" class="w-full h-16 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-600/20 font-black">{{ viajeActual?.tipo_servicio === 'encomienda' ? 'Sí, Entregar' : 'Sí, Finalizar' }}</button>
          <button (click)="showFinishModal = false" class="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest">Volver</button>
        </div>
      </div>
    </div>

    <!-- Cancelar -->
    <div *ngIf="showCancelModal" class="fixed inset-0 z-[10001] flex items-center justify-center p-6 animate-fade-in">
      <div class="absolute inset-0 bg-red-900/40 backdrop-blur-xl" (click)="showCancelModal = false"></div>
      <div class="bg-white w-full max-w-sm rounded-3xl p-10 relative z-10 shadow-sm text-center border border-white/20">
        <div class="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
        </div>
        <h3 class="text-2xl font-black text-gray-900 mb-4 font-black">¿Cancelar Viaje?</h3>
        <p class="text-gray-500 text-sm font-medium mb-10 px-4">Esta acción afectará tu calificación y notificará al cliente de inmediato.</p>
        <div class="grid grid-cols-1 gap-4">
          <button (click)="confirmarCancelacion()" class="w-full h-16 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-red-500/20 font-black">Confirmar</button>
          <button (click)="showCancelModal = false" class="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest">No, Mantener</button>
        </div>
      </div>
    </div>

    <!-- Confirmar Iniciar Viaje Frecuencia -->
    <div *ngIf="showStartFrecuenciaModal && frecuenciaAsignada" class="fixed inset-0 z-[10001] flex items-center justify-center p-6 animate-fade-in">
      <div class="absolute inset-0 bg-blue-900/40 backdrop-blur-xl" (click)="showStartFrecuenciaModal = false"></div>
      <div class="bg-white w-full max-w-sm rounded-3xl p-10 relative z-10 shadow-sm text-center">
        <div class="w-20 h-20 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 3l14 9-14 9V3z"/></svg>
        </div>
        <h3 class="text-2xl font-black text-gray-900 mb-4 font-black">¿Iniciar Viaje?</h3>
        <p class="text-gray-500 text-sm font-medium mb-10 px-4 leading-relaxed">
          <span *ngIf="capacidadOcupada < frecuenciaAsignada.capacidad_total" class="text-amber-600 font-bold block mb-2">El viaje no está lleno.</span>¿Estás seguro que deseas iniciar el viaje?
        </p>
        <div class="grid grid-cols-1 gap-4">
          <button (click)="confirmarInicioFrecuencia()" class="w-full h-16 bg-blue-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 font-black">Sí, Iniciar</button>
          <button (click)="showStartFrecuenciaModal = false" class="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest">Cancelar</button>
        </div>
      </div>
    </div>

    <!-- Confirmar Finalizar Viaje Frecuencia -->
    <div *ngIf="showFinishFrecuenciaModal && frecuenciaAsignada" class="fixed inset-0 z-[10001] flex items-center justify-center p-6 animate-fade-in">
      <div class="absolute inset-0 bg-blue-900/40 backdrop-blur-xl" (click)="showFinishFrecuenciaModal = false"></div>
      <div class="bg-white w-full max-w-sm rounded-3xl p-10 relative z-10 shadow-sm text-center">
        <div class="w-20 h-20 bg-green-50 text-green-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 6 9 17l-5-5"/></svg>
        </div>
        <h3 class="text-2xl font-black text-gray-900 mb-4 font-black">¿Viaje Terminado?</h3>
        <p class="text-gray-500 text-sm font-medium mb-10 px-4">Asegúrate de que todos los pasajeros hayan desembarcado con seguridad en el destino.</p>
        <div class="grid grid-cols-1 gap-4">
          <button (click)="confirmarFinFrecuencia()" class="w-full h-16 bg-green-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-green-600/20 font-black">Sí, Terminar</button>
          <button (click)="showFinishFrecuenciaModal = false" class="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest">Volver</button>
        </div>
      </div>
    </div>

    <!-- Modal para Validar PIN del Pasajero -->
    <div *ngIf="showPinModal && selectedReservaParaPin" class="fixed inset-0 z-[10001] flex items-center justify-center p-6 animate-fade-in">
      <div class="absolute inset-0 bg-blue-900/40 backdrop-blur-xl" (click)="cerrarModalPin()"></div>
      <div class="bg-white w-full max-w-sm rounded-3xl p-10 relative z-10 shadow-sm text-center">
        <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
        </div>
        <h3 class="text-xl font-black text-gray-900 mb-1">Confirmar Asistencia</h3>
        <p class="text-[11px] font-bold text-blue-600 mb-4">{{ selectedReservaParaPin.nombre_usuario }} (Asiento #{{ selectedReservaParaPin.numero_asiento }})</p>
        <p class="text-gray-500 text-xs font-semibold mb-6 px-4">Por favor ingresa el PIN de 4 dígitos proporcionado por el pasajero:</p>
        
        <div class="space-y-4">
          <input 
            type="text" 
            [(ngModel)]="pinModalInput" 
            maxlength="4" 
            placeholder="PIN" 
            class="w-full py-4 bg-gray-50 rounded-2xl text-center font-black text-3xl tracking-[0.3em] focus:outline-none focus:ring-4 focus:ring-blue-500/10 transition-all uppercase"
            (keyup.enter)="confirmarPinModal()"
          >
          <p *ngIf="pinModalError" class="text-red-500 text-[10px] font-bold mt-1">{{ pinModalError }}</p>
          
          <div class="flex flex-col gap-2 pt-2">
            <button 
              [disabled]="validatingPin[selectedReservaParaPin.id] || pinModalInput.length !== 4"
              (click)="confirmarPinModal()" 
              class="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-500/20 active:scale-95 disabled:bg-gray-100 disabled:text-gray-400 disabled:shadow-none transition-all uppercase tracking-widest text-xs flex items-center justify-center gap-2"
            >
              <span *ngIf="validatingPin[selectedReservaParaPin.id]" class="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Validar e Ingresar
            </button>
            <button 
              (click)="cerrarModalPin()" 
              class="w-full py-3 text-gray-400 font-bold hover:text-gray-600 transition-colors text-[10px] uppercase tracking-widest"
            >
              Cancelar
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- TOAST -->
    <div *ngIf="toast" (click)="openChat()" class="cursor-pointer fixed top-24 left-1/2 -translate-x-1/2 z-[20000] w-[92%] max-w-lg transition-all duration-500 ease-out transform active:scale-95">
      <div class="bg-gradient-to-r from-blue-600 to-indigo-700 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-blue-500/20 flex items-center gap-4 border border-blue-400/25 relative overflow-hidden backdrop-blur-md animate-slide-up">
        <!-- Glow effect -->
        <div class="absolute -right-10 -top-10 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
        <div class="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0 animate-pulse">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        </div>
        <div>
          <span class="text-[8px] font-black uppercase tracking-[0.2em] text-blue-100 block mb-0.5">Notificación en tiempo real</span>
          <p class="text-xs font-black leading-snug text-white font-semibold">{{ toast }}</p>
        </div>
      </div>
    </div>

    <!-- CHAT -->
    <app-chat-sidebar 
      [isOpen]="isChatOpen"
      [viajeId]="viajeActual?.viaje_id || viajeActual?.id"
      [destinatarioId]="viajeActual?.cliente_id"
      [tipoReceptor]="'chofer'"
      [tituloCabecera]="'Cliente: ' + (viajeActual?.nombre_cliente || 'Pasajero VIP')"
      [fotoPerfilUrl]="viajeActual?.foto_cliente_url"
      (closed)="isChatOpen = false">
    </app-chat-sidebar>

    <!-- Modal Mensajes del Viaje Compartido -->
    <div *ngIf="showSharedMessagesModal && frecuenciaAsignada" class="fixed inset-0 z-[10001] flex items-center justify-center p-4 md:p-10 animate-fade-in">
      <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-md" (click)="cerrarMensajeriaCompartido()"></div>
      
      <div class="bg-white w-full max-w-4xl h-[80vh] rounded-3xl relative z-10 shadow-2xl border border-gray-100 flex flex-col overflow-hidden">
        
        <!-- Header -->
        <div class="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white shrink-0">
          <div class="flex items-center gap-2.5">
            <div class="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-sm">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
              </svg>
            </div>
            <div>
              <h3 class="text-xs font-black text-gray-900 uppercase tracking-wider">Mensajes del Viaje Compartido</h3>
              <p class="text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Frecuencia #{{ frecuenciaAsignada.id }} - Pasajeros a bordo</p>
            </div>
          </div>
          <button (click)="cerrarMensajeriaCompartido()" class="w-8 h-8 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-50 flex items-center justify-center transition-colors">
            <svg width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
          </button>
        </div>
        
        <!-- Main Panel Body -->
        <div class="flex-1 flex overflow-hidden min-h-0">
          
          <!-- Left Panel: Passenger List -->
          <div 
            [class.hidden]="selectedPassengerForChat" 
            class="w-full md:w-[320px] md:flex border-r border-gray-100 flex flex-col bg-slate-50/30 shrink-0"
          >
            <!-- Search bar -->
            <div class="p-4 bg-white border-b border-gray-100 shrink-0">
              <div class="relative">
                <input 
                  type="text" 
                  [(ngModel)]="searchPassengerQuery"
                  placeholder="Buscar pasajero..." 
                  class="w-full bg-slate-50 border border-gray-200 rounded-2xl py-2.5 pl-10 pr-4 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:bg-white transition-all"
                >
                <div class="absolute left-3.5 top-3.5 text-gray-400">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                </div>
              </div>
            </div>
            
            <!-- List scroll area -->
            <div class="flex-1 overflow-y-auto p-3 space-y-1">
              <!-- Empty state -->
              <div *ngIf="filteredPasajeros.length === 0" class="py-10 text-center text-gray-400">
                <p class="text-[10px] font-semibold">No se encontraron pasajeros.</p>
              </div>
              
              <!-- Passenger Items -->
              <button 
                *ngFor="let pasaje of filteredPasajeros"
                (click)="selectPassenger(pasaje)"
                [ngClass]="{ 
                  'bg-blue-50/60 border-blue-100': selectedPassengerForChat?.usuario_id === pasaje.usuario_id,
                  'bg-red-50/30 border-red-100/40 hover:bg-red-50/50': selectedPassengerForChat?.usuario_id !== pasaje.usuario_id && pasaje.unreadCount > 0
                }"
                class="w-full text-left p-3 rounded-2xl border border-transparent hover:bg-slate-50 transition-all flex items-center gap-3 active:scale-[0.99] relative"
              >
                <!-- Avatar with Badge -->
                <div class="relative w-8 h-8 shrink-0">
                  <div class="w-full h-full bg-gray-200 text-gray-500 rounded-full flex items-center justify-center overflow-hidden border border-gray-200 shadow-sm">
                    <img *ngIf="pasaje.foto_usuario_url" [src]="'http://localhost:5001/' + pasaje.foto_usuario_url" class="w-full h-full object-cover">
                    <svg *ngIf="!pasaje.foto_usuario_url" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  </div>
                  
                  <!-- Contador de mensajes no leídos en rojo -->
                  <div *ngIf="pasaje.unreadCount > 0" class="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center border border-white animate-bounce shadow-md z-10">
                    {{ pasaje.unreadCount }}
                  </div>
                </div>
                
                <!-- Info -->
                <div class="flex-1 min-w-0">
                  <div class="flex justify-between items-start gap-1">
                    <p class="text-[11px] font-black text-gray-800 truncate leading-tight">{{ pasaje.nombre_usuario }}</p>
                    <span class="px-1.5 py-0.5 bg-blue-50 text-blue-600 text-[8px] font-black rounded-md shrink-0 border border-blue-100">As. {{ pasaje.numero_asiento }}</span>
                  </div>
                  
                  <!-- Mensaje con previsualización en color distintivo si no está leído -->
                  <p *ngIf="pasaje.lastMessage" 
                     [ngClass]="{ 
                       'text-red-500 font-extrabold': pasaje.unreadCount > 0, 
                       'text-gray-500 font-medium': !pasaje.unreadCount || pasaje.unreadCount === 0 
                     }" 
                     class="text-[9px] truncate mt-1">
                    {{ pasaje.lastMessage }}
                  </p>
                  
                  <p *ngIf="!pasaje.lastMessage" class="text-[9px] text-gray-400 font-semibold truncate mt-0.5">
                    Aborda en: <span class="text-gray-600 font-bold">{{ pasaje.punto_abordaje }}</span>
                  </p>
                </div>
              </button>
            </div>
          </div>
          
          <!-- Right Panel: Chat Box -->
          <div 
            [class.hidden]="!selectedPassengerForChat"
            class="w-full md:flex flex-1 h-full bg-slate-50/10 flex flex-col relative overflow-hidden"
          >
            <div *ngIf="selectedPassengerForChat" class="flex-1 h-full flex flex-col min-h-0">
              <!-- Chat panel integration -->
              <div class="flex-1 min-h-0 relative">
                <app-chat-panel 
                  [otroId]="selectedPassengerForChat.usuario_id" 
                  [viajeId]="frecuenciaAsignada.id"
                  [showHeader]="true"
                  [showBackButton]="true"
                  (back)="selectedPassengerForChat = null"
                  [otroNombre]="selectedPassengerForChat.nombre_usuario"
                  [otroFotoUrl]="selectedPassengerForChat.foto_usuario_url"
                  [tipoReceptor]="'chofer'"
                  class="h-full block w-full absolute inset-0"
                ></app-chat-panel>
              </div>
            </div>
            
            <!-- Chat Box Empty State -->
            <div *ngIf="!selectedPassengerForChat" class="flex-1 flex flex-col items-center justify-center text-gray-400 p-8">
              <div class="w-12 h-12 rounded-2xl bg-slate-50 text-slate-400 flex items-center justify-center mb-4 border border-slate-100 shadow-sm">
                <svg xmlns="http://www.w3.org/2050/svg" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M5 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0m4 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0"/>
                  <path d="M14 1a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H4.414A2 2 0 0 0 3 11.586l-2 2V2a1 1 0 0 1 1-1zM2 0a2 2 0 0 0-2 2v12.793a.5.5 0 0 0 .854.353l2.853-2.853A1 1 0 0 1 4.414 12H14a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2z"/>
                </svg>
              </div>
              <h4 class="text-xs font-black text-gray-800 uppercase tracking-widest mb-1">Selecciona un pasajero</h4>
              <p class="text-[10px] text-gray-400 font-semibold max-w-xs text-center leading-relaxed">Haz clic en cualquier pasajero de la lista izquierda para iniciar una conversación en tiempo real.</p>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes radar-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-radar-spin {
      animation: radar-spin 4s linear infinite;
    }
    @keyframes scanner-line {
      0% { top: 10%; }
      50% { top: 90%; }
      100% { top: 10%; }
    }
    .animate-scanner-line {
      animation: scanner-line 3s ease-in-out infinite;
    }
    @keyframes notification-timeout {
      from { width: 100%; }
      to { width: 0%; }
    }
    .animate-notification-timeout {
      animation: notification-timeout linear forwards;
    }
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }
    .animate-slide-up {
      animation: slideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
    @keyframes slideUp {
      from { opacity: 0; transform: translateY(100px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInRight {
      from { opacity: 0; transform: translateX(50px); }
      to { opacity: 1; transform: translateX(0); }
    }
    .animate-fade-in-right {
      animation: fadeInRight 0.4s ease-out forwards;
    }
  `]
})
export class DashboardChoferComponent implements OnInit, OnDestroy {
  usuario: any = null;
  viajeActual: any = null;
  nuevosViajes: any[] = [];
  isScannerOpen = false;
  isChatOpen = false;
  showCancelModal = false;

  showFinishModal = false;
  showStartFrecuenciaModal = false;
  showFinishFrecuenciaModal = false;
  pinIngresado = '';
  toast: string | null = null;
  private componentSubs: Subscription[] = [];

  // Phase 3 Properties
  activeTab: 'express' | 'shared' = 'express';
  frecuenciaAsignada: any = null;
  manifiestoPasajeros: any[] = [];
  showPinModal = false;
  selectedReservaParaPin: any = null;
  pinModalInput = '';
  pinModalError = '';
  loadingFrecuencias = false;
  loadingManifiesto = false;
  validatingPin: { [reservaId: number]: boolean } = {};
  updatingFrecuenciaStatus = false;

  showPassengerManifest = false;
  showSharedMessagesModal = false;
  selectedPassengerForChat: any = null;
  searchPassengerQuery = '';

  get filteredPasajeros(): any[] {
    let list = [...this.manifiestoPasajeros];
    if (this.searchPassengerQuery.trim()) {
      const query = this.searchPassengerQuery.toLowerCase().trim();
      list = list.filter(p => 
        (p.nombre_usuario || '').toLowerCase().includes(query)
      );
    }
    
    // Sort: passengers with more recent lastMessageTime come first
    return list.sort((a, b) => {
      const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
      const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
      
      if (timeA !== timeB) {
        return timeB - timeA; // Descending order: newest first
      }
      
      // Fallback: sort by seat number
      const seatA = parseInt(a.numero_asiento) || 999;
      const seatB = parseInt(b.numero_asiento) || 999;
      return seatA - seatB;
    });
  }

  abrirMensajeriaCompartido() {
    this.showSharedMessagesModal = true;
    this.socketService.isChatActive = true; // Silenciar notificaciones push globales
    this.searchPassengerQuery = '';
    
    if (this.frecuenciaAsignada && this.manifiestoPasajeros.length === 0) {
      this.cargarManifiesto(this.frecuenciaAsignada.id);
    }
    
    // Auto-select first passenger on desktop, but keep it null on mobile to see the list first
    if (window.innerWidth >= 768 && this.manifiestoPasajeros.length > 0) {
      this.selectPassenger(this.manifiestoPasajeros[0]);
    } else {
      this.selectedPassengerForChat = null;
    }
  }

  cerrarMensajeriaCompartido() {
    this.showSharedMessagesModal = false;
    this.selectedPassengerForChat = null;
    this.socketService.isChatActive = false; // Reactivar notificaciones push globales
  }

  selectPassenger(pasaje: any) {
    this.selectedPassengerForChat = pasaje;
    if (pasaje) {
      pasaje.unreadCount = 0;
      this.saveChatStateToStorage(); // Persistir cambio a leído
    }
  }

  togglePassengerManifest() {
    this.showPassengerManifest = !this.showPassengerManifest;
  }

  saveChatStateToStorage() {
    if (!this.frecuenciaAsignada || !this.usuario) return;
    const storageKey = `Ecuavip_SharedChatState_${this.usuario.id}_${this.frecuenciaAsignada.id}`;
    
    const state: { [key: number]: { unreadCount: number, lastMessage: string, lastMessageTime: any } } = {};
    for (const p of this.manifiestoPasajeros) {
      state[p.usuario_id] = {
        unreadCount: p.unreadCount || 0,
        lastMessage: p.lastMessage || '',
        lastMessageTime: p.lastMessageTime || null
      };
    }
    
    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (e) {
      console.error('[DashboardChofer] Error saving chat state to localStorage:', e);
    }
  }

  get unreadMessages(): number {
    return this.socketService.unreadMessages;
  }
  
  get capacidadOcupada(): number {
    return this.manifiestoPasajeros.reduce((sum, p) => {
      const count = (p.asientos && Array.isArray(p.asientos)) ? p.asientos.length : 1;
      return sum + (p.estado_pago !== 'CANCELADO' ? count : 0);
    }, 0);
  }

  get totalUnreadSharedMessages(): number {
    return this.manifiestoPasajeros.reduce((sum, p) => sum + (p.unreadCount || 0), 0);
  }
  
  // Map State
  map: any;
  directionsService: any;
  directionsRenderer: any;
  myMarker: any;
  
  private socketSub?: Subscription;
  private gpsInterval: any;

  constructor(
    private authService: AuthService,
    private socketService: SocketService,
    private viajeService: ViajeService,
    private soapService: SoapService,
    private choferService: ChoferService
  ) {
    this.usuario = this.authService.getUsuario();
  }

  ngOnInit() {
    this.socketService.connectAndJoin();
    this.setupListeners();
    this.checkActiveTrip();
    this.cargarFrecuenciaAsignada();
    setTimeout(() => this.initMap(), 500);

    // Escuchar el evento reactivo global para abrir el chat
    const chatSub = this.socketService.triggerChatOpen.subscribe(() => {
      this.openChat();
    });
    this.componentSubs.push(chatSub);

    if (this.socketService.openChatOnLoad) {
      this.openChat();
      this.socketService.openChatOnLoad = false;
    }
  }

  ngOnDestroy() {
    this.socketService.isChatActive = false; // Asegurar que no quede silenciado si se destruye el dashboard
    if (this.socketSub) this.socketSub.unsubscribe();
    this.componentSubs.forEach(s => s.unsubscribe());
    this.stopGPS();
  }

  onTabChange(tab: 'express' | 'shared') {
    this.activeTab = tab;
    if (tab === 'shared') {
      this.cargarFrecuenciaAsignada();
    } else {
      setTimeout(() => this.calculateRoute(), 100);
    }
  }

  cargarFrecuenciaAsignada() {
    this.loadingFrecuencias = true;
    this.soapService.post(
      'http://ecuaviptour.com/soap/viajes',
      'getViajesProgramadosRequest',
      {}
    ).subscribe({
      next: (res) => {
        this.loadingFrecuencias = false;
        const list = res.viajes_programados || [];
        this.frecuenciaAsignada = list.find((vp: any) => vp.chofer && Number(vp.chofer.id) === Number(this.usuario?.id));
        if (this.frecuenciaAsignada) {
          this.cargarManifiesto(this.frecuenciaAsignada.id);
          setTimeout(() => this.calculateRoute(), 200);

          if ((this.frecuenciaAsignada.estado || '').toUpperCase() === 'EN_RUTA') {
            this.startGPS();
          } else {
            this.stopGPS();
          }

          // Seleccionar pestaña de compartido automáticamente si no hay viaje express
          if (!this.viajeActual) {
            this.activeTab = 'shared';
          }
        }
      },
      error: (err) => {
        this.loadingFrecuencias = false;
        console.error('Error cargando frecuencia asignada:', err);
      }
    });
  }

  cambiarEstadoFrecuencia(nuevoEstado: string) {
    if (!this.frecuenciaAsignada) return;
    this.updatingFrecuenciaStatus = true;
    console.log('[DashboardChofer] cambiarEstadoFrecuencia called with:', nuevoEstado, 'Frecuencia ID:', this.frecuenciaAsignada.id);
    this.choferService.updateEstadoFrecuencia(this.frecuenciaAsignada.id, nuevoEstado).subscribe({
      next: (res) => {
        this.updatingFrecuenciaStatus = false;
        if (res && res.exito) {
          this.showToast(res.mensaje || 'Estado de viaje actualizado.');
          this.cargarFrecuenciaAsignada();
        } else {
          this.showToast(res.mensaje || 'No se pudo actualizar el estado de la frecuencia.');
        }
      },
      error: (err) => {
        this.updatingFrecuenciaStatus = false;
        this.showToast(err.error?.error || 'Error al actualizar el estado.');
      }
    });
  }

  iniciarFrecuenciaViaje() {
    if (!this.frecuenciaAsignada) return;
    this.showStartFrecuenciaModal = true;
  }

  confirmarInicioFrecuencia() {
    this.showStartFrecuenciaModal = false;
    this.cambiarEstadoFrecuencia('EN_RUTA');
  }

  terminarFrecuenciaViaje() {
    if (!this.frecuenciaAsignada) return;
    this.showFinishFrecuenciaModal = true;
  }

  confirmarFinFrecuencia() {
    this.showFinishFrecuenciaModal = false;
    this.cambiarEstadoFrecuencia('FINALIZADO');
  }

  cargarManifiesto(frecuenciaId: number) {
    this.loadingManifiesto = true;
    this.soapService.post(
      'http://ecuaviptour.com/soap/viajes',
      'getReservasFrecuenciaRequest',
      { viaje_programado_id: frecuenciaId }
    ).subscribe({
      next: (res) => {
        this.loadingManifiesto = false;
        const rawReservas = res.reservas || [];
        
        // Conservar valores previos en memoria, o leer de localStorage si es una recarga completa de página
        const storageKey = `Ecuavip_SharedChatState_${this.usuario?.id}_${frecuenciaId}`;
        let persistedState: { [key: number]: { unreadCount: number, lastMessage: string, lastMessageTime: any } } = {};
        try {
          const val = localStorage.getItem(storageKey);
          if (val) {
            persistedState = JSON.parse(val);
          }
        } catch (e) {
          console.error('[DashboardChofer] Error parsing persisted chat state:', e);
        }

        const existingMap = new Map<number, { unreadCount: number, lastMessage: string, lastMessageTime: any }>();
        if (this.manifiestoPasajeros && this.manifiestoPasajeros.length > 0) {
          for (const p of this.manifiestoPasajeros) {
            existingMap.set(p.usuario_id, { 
              unreadCount: p.unreadCount || 0, 
              lastMessage: p.lastMessage || '',
              lastMessageTime: p.lastMessageTime || null
            });
          }
        }

        // Group by usuario_id to prevent duplicates of the same passenger
        const groups: { [key: number]: any } = {};
        for (const r of rawReservas) {
          const uId = Number(r.usuario_id);
          const pLocal = existingMap.get(uId);
          const pStored = persistedState[uId];
          const preserved = pLocal || pStored || { unreadCount: 0, lastMessage: '', lastMessageTime: null };
          
          if (!groups[uId]) {
            groups[uId] = {
              id: r.id, // Keep the first ID for pin validation actions
              usuario_id: uId,
              nombre_usuario: r.nombre_usuario,
              foto_usuario_url: r.foto_usuario_url,
              punto_abordaje: r.punto_abordaje,
              pin_abordaje: r.pin_abordaje,
              estado_pago: r.estado_pago,
              asientos: [Number(r.numero_asiento)],
              reservas: [r],
              unreadCount: preserved.unreadCount,
              lastMessage: preserved.lastMessage,
              lastMessageTime: preserved.lastMessageTime
            };
          } else {
            // Append seat
            groups[uId].asientos.push(Number(r.numero_asiento));
            groups[uId].reservas.push(r);
            // If any of the seats is CONFIRMADO, keep it as CONFIRMADO (needs checkin)
            if (r.estado_pago === 'CONFIRMADO') {
              groups[uId].estado_pago = 'CONFIRMADO';
              groups[uId].id = r.id; // use the ID that needs verification
              groups[uId].pin_abordaje = r.pin_abordaje;
            }
          }
        }

        // Convert groups back to array and format seats
        this.manifiestoPasajeros = Object.values(groups).map((group: any) => {
          group.asientos.sort((a: number, b: number) => a - b);
          group.numero_asiento = group.asientos.join(', '); // Format seats as "2, 3"
          return group;
        });

        // Guardar estado en localStorage
        this.saveChatStateToStorage();
      },
      error: (err) => {
        this.loadingManifiesto = false;
        console.error('Error cargando manifiesto:', err);
      }
    });
  }

  abrirModalPin(reserva: any) {
    this.selectedReservaParaPin = reserva;
    this.pinModalInput = '';
    this.pinModalError = '';
    this.showPinModal = true;
  }

  cerrarModalPin() {
    this.showPinModal = false;
    this.selectedReservaParaPin = null;
  }

  confirmarPinModal() {
    if (!this.selectedReservaParaPin || this.pinModalInput.trim().length !== 4) return;
    
    const id = this.selectedReservaParaPin.id;
    const pin = this.pinModalInput.trim();
    
    this.validatingPin[id] = true;
    this.pinModalError = '';
    
    this.soapService.post(
      'http://ecuaviptour.com/soap/viajes',
      'validarPinAbordajeRequest',
      {
        reserva_id: id,
        pin: pin
      }
    ).subscribe({
      next: (res) => {
        this.validatingPin[id] = false;
        if (res && res.exito === true) {
          this.showToast(res.mensaje || 'PIN validado con éxito. Pasajero a bordo.');
          this.cerrarModalPin();
          this.cargarManifiesto(this.frecuenciaAsignada.id);
        } else {
          this.pinModalError = res.mensaje || 'PIN de abordaje incorrecto.';
        }
      },
      error: (err) => {
        this.validatingPin[id] = false;
        this.pinModalError = err.error?.error || 'Error al validar PIN.';
      }
    });
  }

  marcarNoAsistio(reserva: any) {
    this.showToast(`Marcado como no asistió: ${reserva.nombre_usuario || 'Pasajero'}`);
  }

  initMap() {
    if (!window.hasOwnProperty('google')) return;
    
    const mapElement = document.getElementById('choferMap');
    if (!mapElement) return;

    this.map = new google.maps.Map(mapElement, {
      center: { lat: -0.1807, lng: -78.4678 }, // Quito default
      zoom: 15,
      disableDefaultUI: true,
      styles: [
        { "featureType": "all", "elementType": "labels.text.fill", "stylers": [{ "color": "#7c93a3" }, { "lightness": "-10" }] },
        { "featureType": "administrative.country", "elementType": "geometry", "stylers": [{ "visibility": "on" }] },
        { "featureType": "landscape", "elementType": "geometry.fill", "stylers": [{ "color": "#f2f2f2" }] },
        { "featureType": "poi", "elementType": "all", "stylers": [{ "visibility": "off" }] },
        { "featureType": "road", "elementType": "all", "stylers": [{ "saturation": -100 }, { "lightness": 45 }] },
        { "featureType": "road.highway", "elementType": "all", "stylers": [{ "visibility": "simplified" }] },
        { "featureType": "water", "elementType": "all", "stylers": [{ "color": "#e9eff2" }, { "visibility": "on" }] }
      ]
    });

    this.directionsService = new google.maps.DirectionsService();
    this.directionsRenderer = new google.maps.DirectionsRenderer({
      map: this.map,
      suppressMarkers: false,
      polylineOptions: {
        strokeColor: '#2563eb',
        strokeWeight: 6,
        strokeOpacity: 0.8
      }
    });

    if (this.viajeActual || (this.activeTab === 'shared' && this.frecuenciaAsignada)) {
      this.calculateRoute();
    } else {
      this.startWaitingMap();
    }
  }

  startWaitingMap() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        const myPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.map.setCenter(myPos);
        
        if (!this.myMarker) {
          this.myMarker = new google.maps.Marker({
            position: myPos,
            map: this.map,
            icon: {
              url: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png',
              scaledSize: new google.maps.Size(40, 40)
            }
          });
        }
      });
    }
  }

  calculateRoute() {
    let origin = '';
    let destination = '';

    if (this.activeTab === 'express' && this.viajeActual) {
      origin = this.viajeActual.origen;
      destination = this.viajeActual.destino;
    } else if (this.activeTab === 'shared' && this.frecuenciaAsignada) {
      origin = this.frecuenciaAsignada.dir_origen;
      destination = this.frecuenciaAsignada.dir_destino;
    }

    if (!origin || !destination) {
      if (this.directionsRenderer) {
        this.directionsRenderer.setDirections({ routes: [] });
      }
      return;
    }

    const request = {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING
    };
    
    if (this.directionsService) {
      this.directionsService.route(request, (result: any, status: any) => {
        if (status === google.maps.DirectionsStatus.OK && this.directionsRenderer) {
          this.directionsRenderer.setDirections(result);
        }
      });
    }
  }

  setupListeners() {
    // Escuchar nuevos mensajes para actualizar previsualización y contadores
    this.componentSubs.push(
      this.socketService.listen('nuevo_mensaje').subscribe((data: any) => {
        console.log('[DashboardChofer] nuevo_mensaje recibido:', data);
        if (!data || !this.usuario) return;

        // Si el remitente es el usuario actual, ignorar
        const isFromPassenger = Number(data.remitente_id) !== Number(this.usuario.id);
        if (!isFromPassenger) return;

        // Buscar al pasajero en nuestro manifiesto
        const passenger = this.manifiestoPasajeros.find(p => Number(p.usuario_id) === Number(data.remitente_id));
        if (passenger) {
          passenger.lastMessage = data.contenido;
          passenger.lastMessageTime = new Date(); // Guardar el timestamp para ordenar al inicio de la lista
          
          // Si el chat con este pasajero está abierto y el modal de mensajes también, no contar como no leído
          const isCurrentChatOpen = this.showSharedMessagesModal && 
                                    this.selectedPassengerForChat && 
                                    Number(this.selectedPassengerForChat.usuario_id) === Number(passenger.usuario_id);
          
          if (!isCurrentChatOpen) {
            passenger.unreadCount = (passenger.unreadCount || 0) + 1;
          } else {
            passenger.unreadCount = 0;
          }

          // Persistir estado en localStorage
          this.saveChatStateToStorage();
        }
      })
    );

    // Escuchar nuevos viajes disponibles
    this.componentSubs.push(
      this.socketService.listen('nuevo_viaje_disponible').subscribe((data: any) => {
        if (data && data.viaje_id) {
          const exists = this.nuevosViajes.some(v => v.viaje_id === data.viaje_id);
          if (!exists) {
            this.nuevosViajes.unshift(data);
          }
        }
      })
    );

    // Escuchar viaje confirmado chofer
    this.componentSubs.push(
      this.socketService.listen('viaje_confirmado_chofer').subscribe((data: any) => {
        if (data && data.viaje_id) {
          this.nuevosViajes = this.nuevosViajes.filter(v => v.viaje_id !== data.viaje_id);
          this.checkActiveTrip(); // Recargar el viaje activo y cambiar pestaña
        }
      })
    );

    // Escuchar viaje ya tomado
    this.componentSubs.push(
      this.socketService.listen('viaje_ya_tomado').subscribe((data: any) => {
        if (data && data.viaje_id) {
          this.nuevosViajes = this.nuevosViajes.filter(v => v.viaje_id !== data.viaje_id);
        }
      })
    );

    // Escuchar viaje cancelado
    this.componentSubs.push(
      this.socketService.listen('viaje_cancelado').subscribe((data: any) => {
        if (data && this.viajeActual && Number(this.viajeActual.viaje_id || this.viajeActual.id) === Number(data.viaje_id)) {
          this.viajeActual = null;
          this.showToast(data.mensaje || 'El cliente ha cancelado el viaje.');
          this.showCancelModal = false;
          this.stopGPS();
          if (this.directionsRenderer) {
            this.directionsRenderer.setDirections({routes: []});
          }
          setTimeout(() => this.initMap(), 500); // Volver al radar
        }
      })
    );

    // Escuchar actualizaciones de pago para refrescar el manifiesto de pasajeros
    this.componentSubs.push(
      this.socketService.listen('pago_actualizado').subscribe((data: any) => {
        console.log('[DashboardChofer] Pago actualizado recibido:', data);
        if (this.frecuenciaAsignada && data && Number(data.viaje_id) === Number(this.frecuenciaAsignada.id)) {
          console.log('[DashboardChofer] Recargando manifiesto para frecuencia:', this.frecuenciaAsignada.id);
          this.cargarManifiesto(this.frecuenciaAsignada.id);
        }
      })
    );
  }

  checkActiveTrip() {
    this.viajeService.getViajeActivo().subscribe({
      next: (viaje) => {
        if (viaje && (viaje.viaje_id || viaje.id)) {
          console.log('[DashboardChofer] Viaje activo detectado:', viaje);
          console.log('[DashboardChofer] Estado logístico:', viaje.estado_logistico);
          this.viajeActual = viaje;
          this.activeTab = 'express';
          // Si el mapa ya está listo, calcular ruta
          if (this.map) {
            this.calculateRoute();
          }
        } else {
          this.viajeActual = null;
          // Si no hay viaje express, pero hay frecuencia, mostrar compartido
          if (this.frecuenciaAsignada) {
            this.activeTab = 'shared';
          }
        }
      },
      error: (err) => console.error('[DashboardChofer] Error al buscar viaje activo:', err)
    });
  }

  aceptarViaje(viaje: any) {
    if (!viaje || !this.usuario) return;
    this.socketService.emit('aceptar_viaje', {
      viaje_id: viaje.viaje_id,
      chofer_id: this.usuario.id
    });
  }

  rechazarViaje(viaje: any) {
    if (viaje) {
      this.nuevosViajes = this.nuevosViajes.filter(v => v.viaje_id !== viaje.viaje_id);
    }
  }

  startGPS() {
    if (this.gpsInterval) return; // Prevent duplicates
    if (navigator.geolocation) {
      this.gpsInterval = setInterval(() => {
        navigator.geolocation.getCurrentPosition((pos) => {
          let targetId = null;
          if (this.activeTab === 'express' && this.viajeActual) {
            targetId = this.viajeActual.viaje_id;
          } else if (this.activeTab === 'shared' && this.frecuenciaAsignada) {
            targetId = this.frecuenciaAsignada.id;
          }
          
          if (targetId) {
            this.socketService.emit('actualizar_ubicacion_chofer', {
              viaje_id: targetId,
              lat: pos.coords.latitude,
              lng: pos.coords.longitude
            });
          }
        });
      }, 5000); // Cada 5 segundos
    }
  }

  stopGPS() {
    if (this.gpsInterval) {
      clearInterval(this.gpsInterval);
      this.gpsInterval = null;
    }
  }

  marcarLlegada() {
    if (!this.viajeActual) return;
    this.socketService.emit('llegada_origen', {
      viaje_id: this.viajeActual.viaje_id
    });
    this.viajeActual.estado_logistico = 'esperando_cliente';
    this.showToast('Notificando al cliente de tu llegada...');
  }

  finalizarViaje() {
    this.showFinishModal = true;
  }

  confirmarFinalizacion() {
    if (!this.viajeActual) return;
    this.socketService.emit('finalizar_viaje', {
      viaje_id: this.viajeActual.viaje_id
    });
    this.showToast('¡Viaje finalizado con éxito!');
    this.viajeActual = null;
    this.showFinishModal = false;
    this.stopGPS();
    if (this.directionsRenderer) {
      this.directionsRenderer.setDirections({routes: []}); // Limpiar ruta
    }
    setTimeout(() => this.initMap(), 500); // Volver al radar
  }

  confirmarAbordaje() {
    if (!this.viajeActual || (!this.pinIngresado && !this.isScannerOpen)) return;
    
    // Si no hay PIN, podríamos estar simulando un escaneo exitoso
    const codigo = this.pinIngresado || 'QR_SIMULADO'; 

    this.viajeService.validarAbordaje(this.viajeActual.viaje_id, codigo).subscribe({
      next: (res) => {
        if (res && res.estado === 'en_curso') {
          this.showToast(res.mensaje || 'Abordaje verificado correctamente');
          this.isScannerOpen = false;
          this.pinIngresado = '';
          this.viajeActual.estado_logistico = 'en_curso';
          this.calculateRoute(); // Actualizar ruta hacia el destino
        } else {
          this.showToast(res.mensaje || 'Código de abordaje inválido.');
        }
      },
      error: (err) => {
        this.showToast(err.error?.error || 'Error al validar');
      }
    });
  }

  openExternalMap() {
    if (!this.viajeActual) return;
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(this.viajeActual.destino)}`;
    window.open(url, '_blank');
  }

  openChat() {
    this.isChatOpen = true;
    this.socketService.unreadMessages = 0;
  }

  cancelarViaje() {
    this.showCancelModal = true;
  }

  confirmarCancelacion() {
    if (!this.viajeActual) return;
    
    const viajeId = this.viajeActual.viaje_id || this.viajeActual.id;
    this.viajeService.cancelarViaje(viajeId).subscribe({
      next: (res) => {
        this.socketService.emit('cancelar_viaje', {
          viaje_id: viajeId,
          motivo: 'Cancelado por el chofer desde la consola'
        });
        this.showToast('Viaje cancelado con éxito.');
        this.viajeActual = null;
        this.showCancelModal = false;
        this.stopGPS();
        if (this.directionsRenderer) {
          this.directionsRenderer.setDirections({routes: []});
        }
        setTimeout(() => this.initMap(), 500); // Volver al radar
      },
      error: (err) => {
        console.error('[DashboardChofer] Error al cancelar viaje:', err);
        this.showToast(err.error?.error || 'Error al cancelar el viaje.');
      }
    });
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = null, 4000);
  }
}
