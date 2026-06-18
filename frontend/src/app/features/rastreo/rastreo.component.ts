import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { GoogleMapsModule, MapDirectionsRenderer, MapDirectionsService, MapMarker } from '@angular/google-maps';
import { Observable, Subscription, map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ClienteService } from '../../core/services/cliente.service';
import { MapService } from '../../core/services/map.service';
import { ViajeService } from '../../core/services/viaje.service';
import { SocketService } from '../../core/services/socket.service';
import { ChatService } from '../../core/services/chat.service';
import { ChatSidebarComponent } from '../../shared/components/chat-sidebar/chat-sidebar.component';
import { QRCodeModule } from 'angularx-qrcode';

@Component({
  selector: 'app-rastreo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, GoogleMapsModule, QRCodeModule, ChatSidebarComponent],
  template: `
    <div class="h-screen md:h-[calc(100vh-72px)] w-full flex flex-col overflow-hidden bg-gray-50/50">
      
      <!-- Navigation Tabs Header (Apple Style) - Hidden on Desktop, Visible on Mobile -->
      <div *ngIf="!selectedPackage" class="bg-white border-b border-gray-100 py-3.5 px-6 shrink-0 z-20 shadow-sm flex items-center justify-center md:hidden animate-fade-in">
        <!-- Tab Selector -->
        <div class="flex p-1 bg-gray-100 rounded-2xl max-w-xl w-full sm:w-[450px] shrink-0">
          <button 
            (click)="setActiveTab('send-receive')"
            [class.bg-white]="activeTab === 'send-receive'"
            [class.shadow-sm]="activeTab === 'send-receive'"
            [class.text-gray-900]="activeTab === 'send-receive'"
            [class.text-gray-500]="activeTab !== 'send-receive'"
            class="flex-1 py-2.5 px-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider focus:outline-none"
          >
            Enviar/Recibir
          </button>
          <button 
            *ngIf="isLoggedIn"
            (click)="setActiveTab('my-packages')"
            [class.bg-white]="activeTab === 'my-packages'"
            [class.shadow-sm]="activeTab === 'my-packages'"
            [class.text-gray-900]="activeTab === 'my-packages'"
            [class.text-gray-500]="activeTab !== 'my-packages'"
            class="flex-1 py-2.5 px-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider focus:outline-none"
          >
            MIs paquetes
          </button>
          <button 
            (click)="setActiveTab('scan-qr')"
            [class.bg-white]="activeTab === 'scan-qr'"
            [class.shadow-sm]="activeTab === 'scan-qr'"
            [class.text-gray-900]="activeTab === 'scan-qr'"
            [class.text-gray-500]="activeTab !== 'scan-qr'"
            class="flex-1 py-2.5 px-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider focus:outline-none"
          >
            Escanear QR
          </button>
        </div>
      </div>

      <!-- Main Dynamic Content Area -->
      <div class="flex-1 min-h-0 relative overflow-hidden flex flex-col">
        
        <!-- ========================================== -->
        <!-- TAB 1: ENVIAR/RECIBIR (COTIZACIÓN ENCOMIENDA CON MAPA) -->
        <!-- ========================================== -->
        <ng-container *ngIf="activeTab === 'send-receive' && !selectedPackage">
          <div class="relative w-full h-full">
            <!-- Google Map Background -->
            <google-map 
              height="100%" 
              width="100%" 
              [center]="mapCenter" 
              [zoom]="mapZoom" 
              [options]="mapOptions"
              (mapClick)="onMapClick($event)">
              <map-directions-renderer *ngIf="(directionsResults$ | async) as results" [directions]="results"></map-directions-renderer>
              <map-marker *ngIf="origenLocation && !destinoLocation" [position]="origenLocation"></map-marker>
              <map-marker *ngIf="origenLocation && destinoLocation" [position]="origenLocation"></map-marker>
              <map-marker *ngIf="destinoLocation" [position]="destinoLocation"></map-marker>
            </google-map>

            <!-- Floating UI Overlay -->
            <div class="absolute top-0 left-0 w-full md:w-[450px] h-full p-4 pb-20 md:p-8 pointer-events-none z-10 flex flex-col justify-end md:justify-center">
              
              <div class="bg-white/95 backdrop-blur-md rounded-3xl shadow-sm p-6 pointer-events-auto border border-ecuavip-light/50 max-h-full overflow-y-auto">
                
                <div class="flex items-center justify-between mb-6">
                  <h1 class="text-xl md:text-2xl font-extrabold text-ecuavip-dark tracking-tight">¿A dónde envías/recibes?</h1>
                  <button *ngIf="origenAddress || destinoAddress" (click)="limpiarQuoting()" class="text-sm text-gray-400 hover:text-red-500 transition-colors font-medium flex items-center gap-1" title="Limpiar ruta">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                    Limpiar
                  </button>
                </div>

                <!-- Address Inputs -->
                <div class="relative flex flex-col gap-4 mb-6">
                  <div class="absolute left-4 top-6 bottom-6 w-0.5 bg-gray-200"></div>

                  <!-- Origen -->
                  <div class="flex items-center gap-3">
                    <div class="w-3 h-3 rounded-full bg-ecuavip-blue z-10 shadow-sm border border-white"></div>
                    <input 
                      #origenInput
                      type="text" 
                      [(ngModel)]="origenAddress"
                      placeholder="Punto de Recogida del Paquete" 
                      class="flex-1 bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ecuavip-blue/50 transition-all text-gray-700 font-medium placeholder-gray-400"
                    >
                  </div>

                  <!-- Destino -->
                  <div class="flex items-center gap-3">
                    <div class="w-3 h-3 rounded-sm bg-gray-900 z-10 shadow-sm border border-white"></div>
                    <input 
                      #destinoInput
                      type="text" 
                      [(ngModel)]="destinoAddress"
                      placeholder="Destino del Paquete" 
                      class="flex-1 bg-gray-50/80 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-ecuavip-blue/50 transition-all text-gray-700 font-medium placeholder-gray-400"
                    >
                  </div>
                </div>

                <!-- Results -->
                <div *ngIf="distanciaKm > 0" class="animate-fade-in-up">
                  <!-- Info Encomienda -->
                  <div class="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100 flex flex-col gap-3">
                    <div class="flex items-center justify-between">
                      <span class="text-sm font-bold text-gray-700">Hora de recogida</span>
                      <input type="time" [(ngModel)]="horaSalida" class="bg-white border border-gray-200 rounded-lg text-sm px-3 py-1.5 w-36 focus:outline-none focus:ring-1 focus:ring-ecuavip-blue text-center font-semibold text-slate-700">
                    </div>
                    
                    <div class="h-px bg-gray-200/60 my-1"></div>

                    <!-- Datos del Paquete -->
                    <div class="flex flex-col gap-2">
                      <span class="text-[10px] font-black text-gray-400 uppercase tracking-wider">Detalles del Paquete</span>
                      
                      <!-- Peso y Descripcion -->
                      <div class="flex gap-2">
                        <div class="flex-1">
                          <label class="text-[9px] font-bold text-gray-500 block mb-0.5">Peso (máx 25 Kg)</label>
                          <div class="relative flex items-center">
                            <input 
                              type="number" 
                              [(ngModel)]="pesoArticulo" 
                              min="1" 
                              max="25" 
                              (ngModelChange)="validarPeso()"
                              class="w-full bg-white border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ecuavip-blue font-semibold text-slate-700">
                            <span class="absolute right-2 text-[10px] text-gray-400 font-bold pointer-events-none">Kg</span>
                          </div>
                        </div>
                        <div class="flex-[2]">
                          <label class="text-[9px] font-bold text-gray-500 block mb-0.5">Descripción</label>
                          <input 
                            type="text" 
                            [(ngModel)]="descripcionArticulo" 
                            placeholder="Ej. Ropa, Celular"
                            class="w-full bg-white border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ecuavip-blue font-semibold text-slate-700">
                        </div>
                      </div>

                      <!-- Destinatario -->
                      <div class="flex gap-2">
                        <div class="flex-1">
                          <label class="text-[9px] font-bold text-gray-500 block mb-0.5">Nombre Destinatario</label>
                          <input 
                            type="text" 
                            [(ngModel)]="nombreRecoge" 
                            placeholder="Nombre de quien recibe"
                            class="w-full bg-white border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ecuavip-blue font-semibold text-slate-700">
                        </div>
                        <div class="flex-1">
                          <label class="text-[9px] font-bold text-gray-500 block mb-0.5">Teléfono</label>
                          <input 
                            type="text" 
                            [(ngModel)]="telefonoRecoge" 
                            placeholder="Teléfono contacto"
                            class="w-full bg-white border border-gray-200 rounded-lg text-xs px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-ecuavip-blue font-semibold text-slate-700">
                        </div>
                      </div>
                    </div>

                    <div class="bg-blue-50 text-ecuavip-blue text-[10px] font-bold p-3 rounded-xl flex items-center gap-2 mt-1">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      <span>Peso máximo permitido: 25Kg</span>
                    </div>
                  </div>

                  <!-- Price -->
                  <div *ngIf="cotizacionActual" class="flex items-end justify-between px-2 mb-2">
                    <div>
                      <p class="text-xs text-gray-500 font-bold uppercase tracking-wider mb-1">Total Encomienda</p>
                      <p class="text-3xl font-extrabold text-ecuavip-dark">
                        \${{ cotizacionActual.precio_total | number:'1.2-2' }}
                      </p>
                    </div>
                    <div class="text-right">
                       <p class="text-xs font-bold text-gray-400">{{ distanciaKm | number:'1.1-1' }} KM • ~{{ tiempoEstimado }}</p>
                    </div>
                  </div>

                  <button (click)="reservarEncomienda()" [disabled]="!cotizacionActual || !descripcionArticulo || !nombreRecoge || !telefonoRecoge || pesoArticulo < 1 || pesoArticulo > 25" class="w-full mt-4 bg-ecuavip-blue text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_-4px_rgba(0,82,204,0.5)] hover:bg-ecuavip-dark hover:shadow-[0_12px_24px_-6px_rgba(0,51,128,0.6)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed">
                    Confirmar Envío
                  </button>
                </div>

              </div>
            </div>
          </div>
        </ng-container>

        <!-- ========================================== -->
        <!-- TAB 2: TUS ENCOMIENDAS (HISTORIAL O RASTREO ACTIVO) -->
        <!-- ========================================== -->
        <ng-container *ngIf="activeTab === 'my-packages' || selectedPackage">
          
          <!-- SUB-VIEW 2A: RASTREO SATELITAL ACTIVO EN TIEMPO REAL (TODO LO DE LA FOTO) -->
          <div *ngIf="selectedPackage" class="flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-6 p-4 lg:p-8 overflow-y-auto animate-fade-in relative bg-slate-50">
            
            <!-- COLUMNA INFO (Left on desktop, bottom on mobile - 5 cols) -->
            <div class="lg:col-span-5 order-2 lg:order-1 flex flex-col gap-6">
              
              <!-- Card Info Principal -->
              <div class="bg-white rounded-[2rem] p-6 lg:p-8 shadow-md border border-slate-100 space-y-6">
                
                <!-- Repartidor y Vehículo -->
                <div *ngIf="selectedPackage.nombre_chofer" class="bg-gradient-to-r from-blue-50/40 to-slate-50/40 p-4 rounded-3xl border border-blue-100/30 flex items-center justify-between gap-4">
                  <!-- Repartidor Info -->
                  <div class="flex items-center gap-3">
                    <div class="relative shrink-0">
                      <div class="w-14 h-14 rounded-full overflow-hidden border-2 border-white shadow-md flex items-center justify-center bg-blue-600 text-white">
                        <img *ngIf="selectedPackage.foto_chofer_url" [src]="'http://localhost:5001/' + selectedPackage.foto_chofer_url" class="w-full h-full object-cover rounded-full">
                        <span *ngIf="!selectedPackage.foto_chofer_url" class="text-lg font-black uppercase">
                          {{ selectedPackage.nombre_chofer.charAt(0) }}
                        </span>
                      </div>
                      <div class="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                    </div>
                    <div>
                      <p class="text-[8px] font-black uppercase tracking-widest text-blue-600 mb-0.5">Repartidor VIP</p>
                      <h4 class="text-sm font-black text-gray-900 leading-tight">{{ selectedPackage.nombre_chofer }}</h4>
                      <p class="text-[9px] font-bold text-gray-500 mt-0.5">
                        {{ selectedPackage.estado_logistico === 'aceptado' ? 'En camino a recogida' : (selectedPackage.estado_logistico === 'esperando_cliente' ? 'Esperando entrega de paquete' : 'En tránsito al destino') }} • 4.9 ★
                      </p>
                    </div>
                  </div>

                  <!-- Vehículo Info -->
                  <div *ngIf="selectedPackage.vehiculo" class="flex flex-col items-center gap-1.5 shrink-0">
                    <div class="w-20 h-12 bg-white rounded-xl overflow-hidden border border-blue-100 shadow-sm relative shrink-0">
                      <img *ngIf="selectedPackage.vehiculo.foto_auto_url" [src]="'http://localhost:5001/' + selectedPackage.vehiculo.foto_auto_url" class="w-full h-full object-cover">
                      <div *ngIf="!selectedPackage.vehiculo.foto_auto_url" class="w-full h-full flex items-center justify-center text-blue-200">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C2.1 10.3 2 10.6 2 11v5c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
                      </div>
                    </div>
                    <div class="text-center">
                      <h5 class="text-[9px] font-black text-gray-900 leading-none truncate max-w-[84px]">{{ selectedPackage.vehiculo.marca }} {{ selectedPackage.vehiculo.modelo }}</h5>
                      <p class="text-[8px] font-black text-blue-600 uppercase tracking-wider mt-0.5">{{ selectedPackage.vehiculo.placa }}</p>
                    </div>
                  </div>
                </div>

                <!-- Detalles del Envío -->
                <div *ngIf="selectedPackage.referencia" class="p-4 bg-blue-50 border border-blue-100/30 rounded-3xl flex flex-col gap-1">
                  <span class="text-[9px] font-black text-blue-600 uppercase tracking-widest leading-none">Detalles del Envío</span>
                  <p class="text-xs font-bold text-blue-950 leading-snug">{{ selectedPackage.referencia }}</p>
                </div>

                <!-- Caso: Revisando Pago -->
                <div *ngIf="selectedPackage.estado_pago === 'comprobante_subido'" class="bg-gray-50 border border-gray-200 p-6 rounded-3xl text-center space-y-4">
                  <div class="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mx-auto shadow-sm animate-pulse">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                  </div>
                  <div>
                    <h4 class="text-base font-black text-gray-900">Revisando comprobante de pago</h4>
                    <p class="text-xs text-gray-500 mt-1">Estamos validando tu comprobante de pago. Por favor espera a que sea aprobado.</p>
                  </div>
                </div>

                <!-- Caso: Buscando Repartidor -->
                <div *ngIf="!selectedPackage.nombre_chofer && (selectedPackage.estado_pago === 'aprobado' || selectedPackage.estado_pago === 'pagado' || selectedPackage.estado_pago === 'confirmado' || selectedPackage.estado_pago === 'abordo')" class="bg-blue-50/50 border border-blue-100/50 p-6 rounded-3xl text-center space-y-4">
                  <div class="relative w-12 h-12 mx-auto flex items-center justify-center">
                    <div class="w-12 h-12 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-lg animate-bounce z-10">
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><polygon points="12 22.08 12 12 3 6.92 3 17.08 12 22.08"/><polygon points="12 22.08 21 17.08 21 6.92 12 12 12 22.08"/><polygon points="12 12 21 6.92 12 1.84 3 6.92 12 12"/></svg>
                    </div>
                    <div class="absolute w-16 h-16 bg-blue-500/10 rounded-full animate-ping"></div>
                  </div>
                  <div>
                    <h4 class="text-base font-black text-gray-900">Buscando Repartidor</h4>
                    <p class="text-xs text-gray-500 mt-1">Tu pago ha sido aprobado. Buscando un repartidor cercano para retirar tu paquete.</p>
                  </div>
                </div>

                <!-- Caso: Pago Rechazado -->
                <div *ngIf="selectedPackage.estado_pago === 'rechazado'" class="bg-red-50 border border-red-100 p-6 rounded-3xl text-center space-y-4">
                  <div class="w-12 h-12 bg-red-100 text-red-500 rounded-xl flex items-center justify-center mx-auto">
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  </div>
                  <div>
                    <h4 class="text-base font-black text-red-800">Comprobante Rechazado</h4>
                    <p class="text-xs text-red-700 mt-1">{{ selectedPackage.comentario_rechazo || 'Tu comprobante de pago fue rechazado. Reintenta el pago antes de que expire.' }}</p>
                  </div>
                  <div class="flex gap-2">
                    <button (click)="cancelarViaje()" class="flex-1 py-2.5 bg-white text-gray-500 border border-gray-200 rounded-xl font-bold text-xs uppercase tracking-wider">Cancelar Envío</button>
                    <button [routerLink]="['/cliente/reserva']" 
                            [queryParams]="{
                              viajeId: selectedPackage.viaje_id || selectedPackage.id, 
                              origen: selectedPackage.origen, 
                              destino: selectedPackage.destino, 
                              tarifa: selectedPackage.monto, 
                              tipo: 'encomienda',
                              reintentar: true
                            }" 
                            class="flex-1 py-2.5 bg-red-600 text-white rounded-xl font-bold text-xs uppercase tracking-wider shadow-md">
                      Reintentar Pago
                    </button>
                  </div>
                </div>

                <!-- Progreso de Envío -->
                <div *ngIf="selectedPackage.estado_pago === 'aprobado' || selectedPackage.estado_pago === 'pagado' || selectedPackage.estado_pago === 'confirmado' || selectedPackage.estado_pago === 'abordo' || selectedPackage.nombre_chofer" class="space-y-3">
                  <div class="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div class="h-full bg-blue-600 transition-all duration-1000 shadow-[0_0_15px_rgba(37,99,235,0.3)]" [style.width]="getProgreso() + '%'"></div>
                  </div>
                  <div class="flex justify-between items-center text-xs font-black text-gray-900 uppercase tracking-widest">
                    <span>Progreso</span>
                    <span>LLEGADA: <span class="text-blue-600">12 MIN</span></span>
                  </div>
                </div>

                <!-- Botones de Acción -->
                <div class="flex flex-col gap-3">
                  <div class="flex gap-3">
                    <button *ngIf="selectedPackage.estado_logistico !== 'finalizado' && (selectedPackage.estado_pago === 'aprobado' || selectedPackage.estado_pago === 'pagado' || selectedPackage.estado_pago === 'confirmado' || selectedPackage.estado_pago === 'abordo')" 
                            (click)="toggleTicketModal()"
                            class="flex-1 h-14 bg-gray-900 text-white rounded-2xl font-black text-xs uppercase tracking-[0.15em] shadow-md flex items-center justify-between px-4">
                      <span class="flex items-center gap-1.5 text-slate-400 font-bold normal-case tracking-normal">
                        PIN: <strong class="text-white font-black tracking-widest text-sm bg-white/10 px-2.5 py-1 rounded-xl">{{ getPIN() }}</strong>
                      </span>
                      <span class="flex items-center gap-1">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
                        VER GUÍA
                      </span>
                    </button>

                    <button (click)="toggleChat()" 
                            [disabled]="!selectedPackage.nombre_chofer"
                            [class.opacity-50]="!selectedPackage.nombre_chofer"
                            class="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md relative shrink-0">
                      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 1 1-7.6-11.7c1.1 0 2.2.3 3.2.8l4.4-1.1-1.1 4.4z"/></svg>
                      <div *ngIf="unreadMessages > 0" class="absolute -top-1 -right-1 w-5.5 h-5.5 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center border-2 border-white animate-bounce">
                        {{ unreadMessages }}
                      </div>
                    </button>
                  </div>

                  <button *ngIf="selectedPackage.estado_logistico !== 'finalizado' && selectedPackage.estado_logistico !== 'cancelado'" 
                          (click)="cancelarViaje()"
                          class="w-full h-12 bg-red-50 text-red-500 hover:bg-red-100 rounded-2xl font-black text-xs uppercase tracking-[0.15em] transition-all flex items-center justify-center gap-2 border border-red-100">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                    Cancelar Envío
                  </button>
                </div>

                <!-- Ruta Detalle -->
                <div class="p-4 bg-gray-50 rounded-2xl border border-gray-100 space-y-4">
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 bg-white text-blue-600 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-blue-50">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="3"/></svg>
                    </div>
                    <div>
                      <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Punto de Recogida</p>
                      <p class="text-xs font-bold text-gray-900 leading-tight">{{ selectedPackage.origen }}</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-8 h-8 bg-white text-gray-900 rounded-lg flex items-center justify-center shrink-0 shadow-sm border border-gray-100">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                    </div>
                    <div>
                      <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Destino</p>
                      <p class="text-xs font-bold text-gray-900 leading-tight">{{ selectedPackage.destino }}</p>
                    </div>
                  </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 gap-3">
                  <div class="p-4 bg-blue-50/50 rounded-2xl border border-blue-100/50">
                    <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Distancia</p>
                    <p class="text-lg font-black text-blue-900">{{ selectedPackage.distancia || 12.5 }} km</p>
                  </div>
                  <div class="p-4 bg-green-50/50 rounded-2xl border border-green-100/50">
                    <p class="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Costo</p>
                    <p class="text-lg font-black text-green-700">$ {{ selectedPackage.monto }}</p>
                  </div>
                </div>

              </div>
            </div>

            <!-- COLUMNA MAPA (Right on desktop, top on mobile - 7 cols) -->
            <div class="lg:col-span-7 order-1 lg:order-2 h-[40vh] lg:h-full shrink-0 relative rounded-[2rem] overflow-hidden border-4 border-white shadow-md">
              <!-- Back button inside Map (Floating like in mockup) -->
              <button 
                (click)="selectedPackage = null; isTracking = false" 
                class="absolute top-4 right-4 z-30 flex items-center gap-2 px-4 py-3 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-lg hover:scale-105 active:scale-95 transition-all text-xs font-black text-blue-600 uppercase tracking-wider"
              >
                <!-- SVG Icon for package box -->
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" class="text-blue-600">
                  <polyline points="21 8 21 21 3 21 3 8"/>
                  <rect x="1" y="3" width="22" height="5"/>
                  <line x1="10" y1="12" x2="14" y2="12"/>
                </svg>
                MIS PAQUETES
              </button>

              <google-map 
                height="100%" 
                width="100%" 
                [center]="mapCenter" 
                [zoom]="mapZoom"
                [options]="mapOptions"
              >
                <map-directions-renderer *ngIf="directionsResults$ | async as directions" [directions]="directions"></map-directions-renderer>
                <map-marker 
                  *ngIf="(selectedPackage.estado_logistico === 'en_curso' || selectedPackage.estado_logistico === 'en_viaje' || selectedPackage.estado_logistico === 'en_ruta' || selectedPackage.estado_logistico === 'esperando_cliente' || selectedPackage.estado_logistico === 'aceptado') && vehiclePosition"
                  [position]="vehiclePosition"
                  [options]="vehicleMarkerOptions"
                ></map-marker>
              </google-map>
            </div>

          </div>

          <!-- SUB-VIEW 2B: LISTADO HISTÓRICO DE ENCOMIENDAS (solo si no hay seleccionado) -->
          <div *ngIf="!selectedPackage" class="flex-1 overflow-y-auto py-8 px-4 sm:px-6 lg:px-8 w-full max-w-4xl mx-auto animate-fade-in">
            <div class="mb-8">
              <h2 class="text-2xl font-black text-gray-900 tracking-tight">Tus Encomiendas</h2>
              <p class="mt-1.5 text-xs text-gray-500 font-medium">Historial completo de tus envíos y paquetes en curso.</p>
            </div>

            <div *ngIf="loadingEncomiendas" class="py-20 text-center">
              <div class="animate-spin h-12 w-12 border-4 border-ecuavip-blue border-t-transparent rounded-full mx-auto mb-4"></div>
              <p class="text-gray-400 font-bold text-sm uppercase tracking-widest">Cargando encomiendas...</p>
            </div>

            <div *ngIf="!loadingEncomiendas && encomiendas.length === 0" class="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/30 p-12 text-center max-w-md mx-auto">
              <div class="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-6 text-gray-400">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
              </div>
              <h3 class="text-lg font-bold text-gray-900">No tienes encomiendas registradas</h3>
              <p class="mt-2 text-sm text-gray-500 font-medium mb-6">Aún no has realizado ningún envío de paquetería.</p>
              <button (click)="setActiveTab('send-receive')" class="px-6 py-3 bg-ecuavip-blue text-white font-bold text-xs uppercase tracking-wider rounded-xl shadow-md hover:bg-blue-600 transition-colors">
                Hacer Nuevo Envío
              </button>
            </div>

            <!-- Encomiendas Grid -->
            <div *ngIf="!loadingEncomiendas && encomiendas.length > 0" class="grid grid-cols-1 md:grid-cols-2 gap-6 font-sans">
              <div 
                *ngFor="let e of encomiendas"
                (click)="trackSpecific(e)"
                class="bg-white p-6 rounded-3xl border border-gray-100 hover:border-ecuavip-blue/30 shadow-lg shadow-gray-200/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0 cursor-pointer transition-all duration-300 relative group"
              >
                <div class="flex justify-between items-start mb-4">
                  <span [class]="getStatusColor(e.estado_logistico) + ' px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider border'">
                    {{ (e.estado_logistico === 'en_curso' || e.estado_logistico === 'en_viaje' || e.estado_logistico === 'en_ruta' || e.estado_logistico === 'esperando_cliente' || e.estado_logistico === 'aceptado') ? 'En Curso / Rastrear' : e.estado_logistico }}
                  </span>
                  <span class="text-xs font-bold text-gray-400">{{ e.fecha | date:'dd MMM yyyy' }}</span>
                </div>
                
                <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1.5">Código de Guía: {{ e.codigo_seguimiento }}</p>
                <h4 class="text-gray-900 font-black text-base line-clamp-1 mb-2">Destino: {{ e.destino }}</h4>
                <p class="text-gray-500 text-xs font-medium truncate">Origen: {{ e.origen }}</p>
                
                <!-- Go to track indicator -->
                <div class="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 transition-opacity">
                  <svg class="text-ecuavip-blue" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
                </div>
              </div>
            </div>

          </div>
        </ng-container>

        <!-- ========================================== -->
        <!-- TAB 3: ESCANEAR QR (VISOR SIMULADO) -->
        <!-- ========================================== -->
        <ng-container *ngIf="activeTab === 'scan-qr' && !selectedPackage">
          <div class="flex-1 overflow-y-auto py-12 px-4 sm:px-6 w-full max-w-2xl mx-auto flex flex-col items-center justify-center animate-fade-in">
            
            <div class="w-full bg-white rounded-[2.5rem] p-6 md:p-8 shadow-2xl shadow-gray-200/50 border border-gray-100 text-center">
              <h3 class="text-2xl font-black text-gray-900 mb-2 font-sans">Escanear Código de Guía</h3>
              <p class="text-gray-500 text-sm font-medium mb-6">Enfoque el código QR de su comprobante de envío con la cámara de su dispositivo.</p>
              
              <!-- QR SCANNER VIEWPORT -->
              <div class="border-4 border-dashed border-gray-200 rounded-3xl overflow-hidden bg-gray-50 aspect-video relative flex flex-col items-center justify-center mb-6">
                <div class="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                  <div class="w-40 h-40 border-4 border-blue-400 rounded-3xl relative">
                    <div class="absolute top-0 left-0 w-full h-1 bg-blue-400/50 animate-scanner-line shadow-[0_0_15px_rgba(96,165,250,0.8)]"></div>
                  </div>
                </div>
                <p class="text-white relative z-20 font-black uppercase tracking-widest text-xs mt-36">Accediendo a la cámara...</p>
              </div>

              <!-- Manual entry option -->
              <div class="flex flex-col gap-3 w-full max-w-md mx-auto">
                <p class="text-xs text-gray-400 font-bold uppercase tracking-wider">O digite el código manualmente</p>
                <div class="flex gap-2">
                  <input 
                    type="text" 
                    [(ngModel)]="trackingCode"
                    placeholder="Ej: ECU-123456"
                    class="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-950 focus:outline-none focus:border-ecuavip-blue transition-colors"
                  >
                  <button 
                    (click)="onTrackManual()"
                    [disabled]="!trackingCode"
                    class="px-6 bg-ecuavip-blue text-white font-black rounded-xl shadow-lg shadow-blue-500/25 hover:bg-blue-700 disabled:opacity-50 disabled:shadow-none transition-all uppercase tracking-widest text-xs"
                  >
                    Rastrear
                  </button>
                </div>
              </div>
            </div>

          </div>
        </ng-container>

      </div>
    </div>

    <!-- MODAL TICKET DE ABORDAJE / GUÍA -->
    <div *ngIf="isTicketModalOpen && selectedPackage" class="fixed inset-0 z-[10000] flex items-center justify-center p-6 animate-fade-in">
      <div class="absolute inset-0 bg-gray-900/80 backdrop-blur-xl" (click)="toggleTicketModal()"></div>
      <div class="bg-white w-full max-w-sm rounded-3xl p-10 relative z-10 shadow-sm border border-white/20">
        <div class="text-center mb-10">
          <span class="inline-block px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest mb-4">
            Pase de Entrega
          </span>
          <h3 class="text-3xl font-black text-gray-900 font-sans tracking-tight">
            Tu Guía de Envío
          </h3>
        </div>
        <div class="bg-gray-50 aspect-square rounded-3xl mb-10 flex items-center justify-center border-2 border-dashed border-gray-200 relative overflow-hidden group">
           <div class="p-6 bg-white rounded-3xl shadow-sm border border-gray-100 group-hover:scale-105 transition-transform duration-500">
             <img [src]="'https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + selectedPackage.qr_hash" 
                  class="w-48 h-48" alt="QR Ticket">
           </div>
        </div>
        <div class="text-center bg-blue-600 rounded-3xl p-8 text-white shadow-sm">
          <p class="text-[10px] font-black uppercase tracking-[0.3em] opacity-70 mb-2">
            PIN de Entrega
          </p>
          <p class="text-5xl font-black tracking-[0.2em]">{{ getPIN() }}</p>
        </div>
        <button (click)="toggleTicketModal()" class="w-full mt-10 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-900 transition-all">Cerrar</button>
      </div>
    </div>

    <!-- MODAL CONFIRMACIÓN CANCELACIÓN -->
    <div *ngIf="showCancelModal" class="fixed inset-0 z-[10001] flex items-center justify-center p-6 animate-fade-in">
      <div class="absolute inset-0 bg-red-950/40 backdrop-blur-xl" (click)="showCancelModal = false"></div>
      <div class="bg-white w-full max-w-sm rounded-3xl p-10 relative z-10 shadow-xl text-center border border-slate-100">
        <div class="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M18 6 6 18M6 6l12 12"/>
          </svg>
        </div>
        <h3 class="text-2xl font-black text-gray-900 mb-2">
          ¿Cancelar Envío?
        </h3>
        <p class="text-gray-500 text-xs font-semibold mb-8 px-2 leading-relaxed">
          Esta acción cancelará tu envío de inmediato y liberará al conductor/repartidor asignado. No se puede deshacer.
        </p>
        <div class="space-y-3">
          <button (click)="confirmarCancelacion()" class="w-full h-14 bg-red-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all hover:bg-red-600">
            Sí, Cancelar Envío
          </button>
          <button (click)="showCancelModal = false" class="w-full py-3 text-gray-400 font-black text-[10px] uppercase tracking-widest hover:text-gray-600 transition-all">No, Mantener</button>
        </div>
      </div>
    </div>

    <!-- MODAL CALIFICACIÓN -->
    <div *ngIf="showRatingModal && selectedPackage" class="fixed inset-0 z-[10001] flex items-center justify-center p-6 animate-fade-in">
      <div class="absolute inset-0 bg-gray-900/80 backdrop-blur-xl"></div>
      <div class="bg-white w-full max-w-sm rounded-3xl p-12 relative z-10 shadow-sm text-center border border-white/20">
        <div class="w-24 h-24 bg-yellow-50 text-yellow-500 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-sm">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
        </div>
        <h3 class="text-3xl font-black text-gray-900 mb-2">
          ¡Entregado!
        </h3>
        <p class="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-12">
          Califica al Repartidor
        </p>
        <div class="flex justify-center gap-3 mb-12">
          <button *ngFor="let star of [1,2,3,4,5]" (click)="rating = star" class="transition-all hover:scale-125 active:scale-90 p-1">
            <svg [class]="rating >= star ? 'fill-yellow-400 stroke-yellow-400 drop-shadow-lg' : 'stroke-gray-200'" width="38" height="38" viewBox="0 0 24 24" fill="none" stroke-width="2.5">
              <path d="m12 2 3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          </button>
        </div>
        <div class="space-y-4">
          <button (click)="enviarCalificacion()" [disabled]="rating === 0" class="w-full h-20 bg-blue-600 text-white rounded-3xl font-black text-xs uppercase tracking-widest shadow-sm disabled:opacity-30">Enviar Opinión</button>
          <button (click)="omitirCalificacion()" class="w-full py-4 text-gray-400 font-black text-[10px] uppercase tracking-widest">Ahora No</button>
        </div>
      </div>
    </div>

    <!-- CHAT SIDEBAR -->
    <app-chat-sidebar 
      *ngIf="selectedPackage"
      [isOpen]="isChatOpen" 
      tipoReceptor="chofer" 
      [viajeId]="selectedPackage.viaje_id || selectedPackage.id" 
      [destinatarioId]="selectedPackage.chofer_id" 
      [tituloCabecera]="'Repartidor: ' + (selectedPackage.nombre_chofer || 'Conductor VIP')" 
      [fotoPerfilUrl]="selectedPackage.foto_chofer_url"
      (closed)="isChatOpen = false">
    </app-chat-sidebar>
  `,
  styles: [`
    @keyframes scanner-line {
      0% { top: 0; }
      50% { top: 100%; }
      100% { top: 0; }
    }
    .animate-scanner-line {
      animation: scanner-line 2s ease-in-out infinite;
    }
    .animate-fade-in {
      animation: fadeIn 0.5s ease-out forwards;
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.5s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(15px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(25px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class RastreoComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('origenInput') origenInput!: ElementRef<HTMLInputElement>;
  @ViewChild('destinoInput') destinoInput!: ElementRef<HTMLInputElement>;

  // Tab Navigation: Enviar/recibir ('send-receive'), Tus Encomiendas ('my-packages'), Escanear QR ('scan-qr')
  activeTab: 'send-receive' | 'my-packages' | 'scan-qr' = 'send-receive';

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  trackingCode = '';
  isTracking = false;
  isScannerOpen = false;
  
  encomiendas: any[] = [];
  loadingEncomiendas = false;
  selectedPackage: any = null;

  // Google Maps Properties
  mapCenter: google.maps.LatLngLiteral = { lat: -1.2416, lng: -78.6195 }; // Ambato default
  mapZoom = 13;
  mapOptions: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: false,
    scrollwheel: true,
    disableDoubleClickZoom: true,
    maxZoom: 20,
    minZoom: 6,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false,
    styles: [
      { "featureType": "poi", "stylers": [{ "visibility": "off" }] },
      { "featureType": "transit", "stylers": [{ "visibility": "off" }] }
    ]
  };

  directionsResults$!: Observable<google.maps.DirectionsResult | undefined>;
  vehiclePosition?: google.maps.LatLngLiteral;
  vehicleMarkerOptions: google.maps.MarkerOptions = {
    icon: {
      url: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', // Carrito azul para concordar
      scaledSize: new google.maps.Size(40, 40),
      anchor: new google.maps.Point(20, 20)
    },
    title: 'Vehículo en ruta'
  };

  // Quoting variables for Enviar/recibir
  origenAddress = '';
  destinoAddress = '';
  distanciaKm = 0;
  tiempoEstimado = '';
  origenLocation?: google.maps.LatLngLiteral;
  destinoLocation?: google.maps.LatLngLiteral;
  cotizacionActual?: any;
  horaSalida = '';
  pesoArticulo = 1;
  descripcionArticulo = '';
  nombreRecoge = '';
  telefonoRecoge = '';
  private cotizacionSub?: Subscription;

  // Socket & Chat Variables
  private socketSub: Subscription | null = null;
  private locationSub: Subscription | null = null;
  private assignmentSub: Subscription | null = null;
  private componentSubs: Subscription[] = [];

  isTicketModalOpen = false;
  isChatOpen = false;
  showCancelModal = false;
  showRatingModal = false;
  rating = 0;
  comentario = '';

  constructor(
    private authService: AuthService,
    private clienteService: ClienteService,
    private mapService: MapService,
    private viajeService: ViajeService,
    private directionsService: MapDirectionsService,
    private ngZone: NgZone,
    private router: Router,
    private route: ActivatedRoute,
    private socketService: SocketService,
    private chatService: ChatService
  ) {}

  ngOnInit() {
    this.setDefaultHoraSalida();
    this.cargarEncomiendas();
    this.setupSocketListeners();
    this.route.queryParams.subscribe(params => {
      const tab = params['tab'];
      if (tab === 'send-receive' || tab === 'my-packages' || tab === 'scan-qr') {
        this.activeTab = tab;
        if (tab === 'send-receive') {
          setTimeout(() => this.initAutocomplete(), 200);
        }
      }
    });
  }

  setDefaultHoraSalida() {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    this.horaSalida = `${hours}:${minutes}`;
  }

  ngAfterViewInit() {
    if (this.activeTab === 'send-receive' && !this.selectedPackage) {
      this.initAutocomplete();
    }
  }

  ngOnDestroy() {
    if (this.cotizacionSub) this.cotizacionSub.unsubscribe();
    if (this.socketSub) this.socketSub.unsubscribe();
    if (this.locationSub) this.locationSub.unsubscribe();
    if (this.assignmentSub) this.assignmentSub.unsubscribe();
    this.componentSubs.forEach(s => s.unsubscribe());
  }

  setActiveTab(tab: 'send-receive' | 'my-packages' | 'scan-qr') {
    this.activeTab = tab;
    if (tab === 'send-receive') {
      setTimeout(() => {
        this.initAutocomplete();
      }, 100);
    }
  }

  get unreadMessages(): number {
    return this.socketService.unreadMessages;
  }

  setupSocketListeners() {
    this.socketService.connectAndJoin();

    // Escuchar si se despacha en tiempo real
    this.componentSubs.push(
      this.socketService.listen('viaje_despachado_cliente').subscribe((data: any) => {
        console.log('[Rastreo Socket] Viaje despachado recibido:', data);
        this.cargarEncomiendas();
      })
    );

    // Escuchar actualizaciones de pago/estado
    this.socketSub = this.socketService.listen('pago_actualizado').subscribe((data: any) => {
      console.log('[Rastreo Socket] Pago actualizado recibido:', data);
      if (this.selectedPackage && Number(data.viaje_id) === Number(this.selectedPackage.viaje_id || this.selectedPackage.id)) {
        this.cargarEncomiendas();
      }
    });

    // Escuchar ubicación del chofer
    this.locationSub = this.socketService.listen('ubicacion_chofer_actualizada').subscribe((data: any) => {
      console.log('[Rastreo Socket] Ubicación chofer recibida:', data);
      this.ngZone.run(() => {
        this.vehiclePosition = { lat: Number(data.lat), lng: Number(data.lng) };
        this.mapCenter = this.vehiclePosition;
      });
    });

    // Escuchar chofer asignado
    this.assignmentSub = this.socketService.listen('chofer_asignado').subscribe((data: any) => {
      console.log('[Rastreo Socket] Chofer asignado:', data);
      if (this.selectedPackage && Number(data.viaje_id) === Number(this.selectedPackage.viaje_id || this.selectedPackage.id)) {
        this.ngZone.run(() => {
          this.selectedPackage.chofer_id = data.chofer_id;
          this.selectedPackage.nombre_chofer = data.nombre_chofer;
          this.selectedPackage.estado_logistico = data.estado;
          this.selectedPackage.foto_chofer_url = data.foto_chofer_url;
          this.selectedPackage.vehiculo = data.vehiculo;
          this.calculateRoute();
        });
      }
    });

    // Escuchar cuando llega
    this.componentSubs.push(
      this.socketService.listen('chofer_en_punto').subscribe((data: any) => {
        console.log('[Rastreo Socket] Chofer en punto:', data);
        if (this.selectedPackage && Number(data.viaje_id) === Number(this.selectedPackage.viaje_id || this.selectedPackage.id)) {
          this.ngZone.run(() => {
            this.selectedPackage.estado_logistico = 'esperando_cliente';
            this.calculateRoute();
          });
        }
      })
    );

    // Escuchar cuando el viaje finaliza
    this.componentSubs.push(
      this.socketService.listen('viaje_finalizado').subscribe((data: any) => {
        console.log('[Rastreo Socket] Viaje finalizado:', data);
        if (this.selectedPackage && Number(data.viaje_id) === Number(this.selectedPackage.viaje_id || this.selectedPackage.id)) {
          this.ngZone.run(() => {
            this.selectedPackage.estado_logistico = 'finalizado';
            this.showRatingModal = true;
          });
        }
      })
    );

    // Escuchar cuando el viaje es cancelado
    this.componentSubs.push(
      this.socketService.listen('viaje_cancelado').subscribe((data: any) => {
        console.log('[Rastreo Socket] Viaje cancelado:', data);
        if (this.selectedPackage && Number(data.viaje_id) === Number(this.selectedPackage.viaje_id || this.selectedPackage.id)) {
          this.ngZone.run(() => {
            this.selectedPackage.estado_logistico = 'cancelado';
            setTimeout(() => this.cargarEncomiendas(), 3000);
          });
        }
      })
    );

    // Escuchar cuando el chofer cancela el viaje
    this.componentSubs.push(
      this.socketService.listen('buscando_nuevo_chofer').subscribe((data: any) => {
        console.log('[Rastreo Socket] Buscando nuevo chofer:', data);
        if (this.selectedPackage && Number(data.viaje_id) === Number(this.selectedPackage.viaje_id || this.selectedPackage.id)) {
          this.ngZone.run(() => {
            this.selectedPackage.chofer_id = null;
            this.selectedPackage.nombre_chofer = null;
            this.selectedPackage.estado_logistico = 'buscando_chofer';
            if (this.selectedPackage.vehiculo) {
              this.selectedPackage.vehiculo = null;
            }
            this.cargarEncomiendas();
          });
        }
      })
    );

    // Escuchar actualizaciones genéricas
    this.componentSubs.push(
      this.socketService.listen('viaje_actualizado_cliente').subscribe((data: any) => {
        if (this.selectedPackage && Number(data.viaje_id) === Number(this.selectedPackage.viaje_id || this.selectedPackage.id)) {
          this.ngZone.run(() => {
            this.selectedPackage.estado_logistico = data.estado;
          });
        }
      })
    );

    // Trigger chat open event
    const chatSub = this.socketService.triggerChatOpen.subscribe(() => {
      this.isChatOpen = true;
    });
    this.componentSubs.push(chatSub);
  }

  cargarEncomiendas() {
    this.loadingEncomiendas = true;
    this.clienteService.getMisViajes().subscribe({
      next: (res) => {
        console.log('Encomiendas raw data:', res);
        this.encomiendas = (res || [])
          .filter((v: any) => {
            const tipo = v.tipo_servicio || '';
            return tipo.toLowerCase().includes('encomienda');
          })
          .map((v: any) => {
            const mapped = {
              ...v,
              viaje_id: v.viaje_id || v.id,
              id: v.id || v.viaje_id,
              codigo_seguimiento: `ECU-${v.viaje_id || v.id}`,
              origen: v.dir_origen || v.origen,
              destino: v.dir_destino || v.destino,
              monto: v.monto,
              tarifa: v.monto,
              estado_pago: v.estado_pago ? v.estado_pago.toLowerCase() : 'pendiente',
              estado_logistico: v.estado_logistico ? v.estado_logistico.toLowerCase() : 'pendiente',
              nombre_chofer: v.nombre_chofer || (v.chofer ? v.chofer.nombre : null),
              chofer_id: v.chofer_id || (v.chofer ? v.chofer.id : null),
              foto_chofer_url: v.foto_chofer_url || (v.chofer ? v.chofer.foto_perfil_url : null),
              vehiculo: v.vehiculo ? {
                marca: v.vehiculo.marca,
                modelo: v.vehiculo.modelo,
                placa: v.vehiculo.placa,
                foto_auto_url: v.vehiculo.foto_auto_url
              } : null,
              pin_abordaje: v.pin_abordaje || (v.qr_hash ? v.qr_hash.slice(-4).toUpperCase() : null),
              qr_hash: v.qr_hash || v.pin_abordaje || null,
              referencia: v.referencia
            };
            return mapped;
          });

        // Auto-seleccionar si hay una encomienda activa en curso
        const activePack = this.encomiendas.find(e => 
          e.estado_logistico !== 'finalizado' && e.estado_logistico !== 'cancelado'
        );
        if (activePack) {
          // Si selectedPackage ya está cargado, no sobreescribir para no perder estado de mapa/ruta
          if (!this.selectedPackage) {
            this.trackSpecific(activePack);
          } else {
            // Sincronizar propiedades en vivo
            this.selectedPackage.estado_pago = activePack.estado_pago;
            this.selectedPackage.estado_logistico = activePack.estado_logistico;
            this.selectedPackage.nombre_chofer = activePack.nombre_chofer;
            this.selectedPackage.chofer_id = activePack.chofer_id;
            this.selectedPackage.foto_chofer_url = activePack.foto_chofer_url;
            this.selectedPackage.vehiculo = activePack.vehiculo;
            this.selectedPackage.pin_abordaje = activePack.pin_abordaje;
            this.selectedPackage.qr_hash = activePack.qr_hash;
          }
        } else if (this.selectedPackage && (this.selectedPackage.estado_logistico === 'finalizado' || this.selectedPackage.estado_logistico === 'cancelado')) {
          // Si finalizó o canceló, mantener en pantalla de exito/rating y que el usuario cierre manualmente
        } else {
          this.selectedPackage = null;
        }

        this.loadingEncomiendas = false;
      },
      error: (err) => {
        console.error('Error cargando encomiendas:', err);
        this.loadingEncomiendas = false;
      }
    });
  }

  // Encomienda quoting flow methods
  initAutocomplete() {
    if (!google || !google.maps || !google.maps.places) return;
    if (!this.origenInput || !this.destinoInput) return;
    
    const autocompleteOrigen = new google.maps.places.Autocomplete(this.origenInput.nativeElement, { componentRestrictions: { country: 'ec' } });
    const autocompleteDestino = new google.maps.places.Autocomplete(this.destinoInput.nativeElement, { componentRestrictions: { country: 'ec' } });

    autocompleteOrigen.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = autocompleteOrigen.getPlace();
        if (place.geometry && place.geometry.location) {
          this.origenLocation = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
          this.origenAddress = place.formatted_address || '';
          this.calculateQuotingRoute();
        }
      });
    });

    autocompleteDestino.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = autocompleteDestino.getPlace();
        if (place.geometry && place.geometry.location) {
          this.destinoLocation = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
          this.destinoAddress = place.formatted_address || '';
          this.calculateQuotingRoute();
        }
      });
    });
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (!event.latLng || this.activeTab !== 'send-receive') return;
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();

    this.mapService.geocodeLatLng(lat, lng).then(address => {
      this.ngZone.run(() => {
        if (!this.origenLocation) {
          this.origenLocation = { lat, lng };
          this.origenAddress = address;
        } else if (!this.destinoLocation) {
          this.destinoLocation = { lat, lng };
          this.destinoAddress = address;
          this.calculateQuotingRoute();
        } else {
          this.origenLocation = { lat, lng };
          this.origenAddress = address;
          this.destinoLocation = undefined;
          this.destinoAddress = '';
          this.distanciaKm = 0;
          this.cotizacionActual = undefined;
          this.directionsResults$ = new Observable();
        }
      });
    }).catch(err => console.error(err));
  }

  calculateQuotingRoute() {
    if (!this.origenLocation || !this.destinoLocation) return;

    const request: google.maps.DirectionsRequest = {
      origin: this.origenLocation,
      destination: this.destinoLocation,
      travelMode: google.maps.TravelMode.DRIVING
    };

    this.directionsResults$ = this.directionsService.route(request).pipe(
      map(response => {
        if (response.result?.routes[0]?.legs[0]) {
          const leg = response.result.routes[0].legs[0];
          this.distanciaKm = (leg.distance?.value || 0) / 1000;
          this.tiempoEstimado = leg.duration?.text || '';
          this.actualizarCotizacion();
        }
        return response.result;
      })
    );
  }

  actualizarCotizacion() {
    if (this.distanciaKm <= 0) return;
    
    if (this.cotizacionSub) this.cotizacionSub.unsubscribe();

    this.cotizacionSub = this.viajeService.cotizarViaje({
      distancia_km: this.distanciaKm,
      tipo_servicio: 'encomienda',
      num_pasajeros: 1
    }).subscribe({
      next: (res) => this.cotizacionActual = res,
      error: (err) => console.error('Error cotizando envío', err)
    });
  }

  limpiarQuoting() {
    this.ngZone.run(() => {
      this.origenLocation = undefined;
      this.origenAddress = '';
      this.destinoLocation = undefined;
      this.destinoAddress = '';
      this.distanciaKm = 0;
      this.tiempoEstimado = '';
      this.cotizacionActual = undefined;
      this.directionsResults$ = new Observable();
    });
  }

  validarPeso() {
    if (this.pesoArticulo > 25) {
      this.pesoArticulo = 25;
    } else if (this.pesoArticulo < 1) {
      this.pesoArticulo = 1;
    }
  }

  reservarEncomienda() {
    if (!this.cotizacionActual) return;
    
    if (!this.authService.isLoggedIn()) {
      alert('Por favor inicia sesión para poder realizar un envío.');
      return;
    }
    
    const referencia = `Paquete: ${this.descripcionArticulo} | Peso: ${this.pesoArticulo}Kg | Destinatario: ${this.nombreRecoge} (${this.telefonoRecoge})`;

    this.router.navigate(['/cliente/reserva'], {
      queryParams: { 
        origen: this.origenAddress, 
        destino: this.destinoAddress, 
        distancia: this.distanciaKm,
        tipo: 'encomienda',
        tarifa: this.cotizacionActual.precio_total,
        pasajeros: 1,
        hora: this.horaSalida,
        referencia: referencia
      }
    });
  }

  // Tracking flow methods
  onTrackManual() {
    if (this.trackingCode) {
      this.activeTab = 'my-packages';
      this.isScannerOpen = false;
      this.isTracking = true;
      
      const found = this.encomiendas.find(e => e.codigo_seguimiento.toLowerCase() === this.trackingCode.toLowerCase().trim());
      
      if (found) {
        this.trackSpecific(found);
      } else {
        this.selectedPackage = {
          viaje_id: 0,
          id: 0,
          codigo_seguimiento: this.trackingCode,
          destino: 'Destino Externo',
          estado_pago: 'aprobado',
          estado_logistico: 'buscando_chofer',
          unidad: '000',
          chofer: 'Buscando conductor...',
          eta: 'Pendiente',
          progreso: 0
        };
      }
    }
  }

  calculateRoute() {
    if (!this.selectedPackage) return;

    const origin = (this.selectedPackage.lat_origen && this.selectedPackage.lng_origen) ?
      { lat: Number(this.selectedPackage.lat_origen), lng: Number(this.selectedPackage.lng_origen) } :
      this.selectedPackage.origen;

    const destination = (this.selectedPackage.lat_destino && this.selectedPackage.lng_destino) ?
      { lat: Number(this.selectedPackage.lat_destino), lng: Number(this.selectedPackage.lng_destino) } :
      this.selectedPackage.destino;

    if (!origin || !destination) return;

    const request: google.maps.DirectionsRequest = {
      origin: origin,
      destination: destination,
      travelMode: google.maps.TravelMode.DRIVING
    };

    this.directionsResults$ = this.directionsService.route(request).pipe(
      map(response => {
        const res = response.result;
        if (res && res.routes[0]) {
          const path = res.routes[0].overview_path;
          const index = Math.floor(path.length * (this.getProgreso() / 100));
          this.vehiclePosition = this.vehiclePosition || path[index]?.toJSON();
          this.mapCenter = this.vehiclePosition || path[0].toJSON();
        }
        return res;
      })
    );
  }

  trackSpecific(encomienda: any) {
    this.activeTab = 'my-packages';
    this.selectedPackage = encomienda;
    this.trackingCode = encomienda.codigo_seguimiento;
    this.isTracking = true;
    this.calculateRoute();
  }

  toggleScanner() {
    this.isScannerOpen = !this.isScannerOpen;
    this.isTracking = false;
  }

  getStatusColor(estado: string): string {
    switch(estado) {
      case 'pendiente': return 'bg-yellow-50 text-yellow-700 border-yellow-100';
      case 'aceptado':
      case 'esperando_cliente':
      case 'en_curso': 
      case 'en_viaje':
      case 'en_ruta':
        return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'finalizado': return 'bg-gray-50 text-gray-600 border-gray-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  }

  // Active tracking helper methods
  getPIN(): string {
    return this.selectedPackage?.pin_abordaje || '----';
  }

  getProgreso(): number {
    if (!this.selectedPackage) return 0;
    const est = this.selectedPackage.estado_logistico;
    if (est === 'pendiente' || est === 'programado') return 20;
    if (est === 'buscando_chofer') return 30;
    if (est === 'aceptado' || est === 'asignado') return 50;
    if (est === 'esperando_cliente') return 70;
    if (est === 'en_curso' || est === 'en_viaje' || est === 'en_ruta') return 90;
    if (est === 'finalizado') return 100;
    return 0;
  }

  toggleTicketModal() {
    this.isTicketModalOpen = !this.isTicketModalOpen;
  }

  toggleChat() {
    if (!this.selectedPackage?.nombre_chofer) return;
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.socketService.unreadMessages = 0;
      this.chatService.getAdminInfo().subscribe({
        next: (info) => {
          this.clienteService.markAsRead(info.admin_id).subscribe();
        },
        error: () => {
          this.clienteService.markAsRead(1).subscribe();
        }
      });
    }
  }

  cancelarViaje() {
    this.showCancelModal = true;
  }

  confirmarCancelacion() {
    if (!this.selectedPackage) return;
    this.showCancelModal = false;
    this.clienteService.cancelarViaje(this.selectedPackage.viaje_id || this.selectedPackage.id).subscribe({
      next: () => {
        this.selectedPackage.estado_logistico = 'cancelado';
        this.cargarEncomiendas();
      },
      error: (err) => {
        alert(err.error?.error || 'Error al cancelar envío');
      }
    });
  }

  enviarCalificacion() {
    if (!this.selectedPackage || this.rating === 0) return;
    
    this.clienteService.calificarViaje({
      viaje_id: this.selectedPackage.viaje_id || this.selectedPackage.id,
      reserva_id: undefined,
      isCompartido: false,
      estrellas: this.rating,
      comentario: this.comentario
    }).subscribe({
      next: () => {
        this.showRatingModal = false;
        this.selectedPackage = null;
        this.isTracking = false;
        this.cargarEncomiendas();
      },
      error: (err) => {
        alert(err.error?.error || 'Error al calificar al repartidor');
      }
    });
  }

  omitirCalificacion() {
    this.showRatingModal = false;
    this.selectedPackage = null;
    this.isTracking = false;
    this.cargarEncomiendas();
  }
}
