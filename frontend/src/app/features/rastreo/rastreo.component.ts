import { Component, OnInit, AfterViewInit, ViewChild, ElementRef, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { GoogleMapsModule, MapDirectionsRenderer, MapDirectionsService, MapMarker } from '@angular/google-maps';
import { Observable, Subscription, map } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { ClienteService } from '../../core/services/cliente.service';
import { MapService } from '../../core/services/map.service';
import { ViajeService } from '../../core/services/viaje.service';

@Component({
  selector: 'app-rastreo',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, GoogleMapsModule],
  template: `
    <div class="h-screen md:h-[calc(100vh-96px)] w-full flex flex-col overflow-hidden bg-gray-50/50">
      
      <!-- Navigation Tabs Header (Apple Style) -->
      <div class="bg-white border-b border-gray-100 py-3.5 px-6 shrink-0 z-20 shadow-sm flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 class="text-xl font-black text-gray-900 tracking-tight">Paquetes Ecuavip</h1>
        </div>
        
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
            (click)="setActiveTab('my-packages')"
            [class.bg-white]="activeTab === 'my-packages'"
            [class.shadow-sm]="activeTab === 'my-packages'"
            [class.text-gray-900]="activeTab === 'my-packages'"
            [class.text-gray-500]="activeTab !== 'my-packages'"
            class="flex-1 py-2.5 px-3 text-[10px] font-black rounded-xl transition-all uppercase tracking-wider focus:outline-none"
          >
            Encomiendas
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
        <ng-container *ngIf="activeTab === 'send-receive'">
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
                  <div class="mb-4 bg-gray-50 rounded-xl p-4 border border-gray-100">
                    <div class="flex items-center justify-between mb-3">
                      <span class="text-sm font-bold text-gray-700">Hora de recogida</span>
                      <select [(ngModel)]="horaSalida" class="bg-white border border-gray-200 rounded-lg text-sm px-3 py-1 focus:outline-none focus:ring-1 focus:ring-ecuavip-blue">
                        <option *ngFor="let hora of horariosDisponibles" [value]="hora">{{ hora }}</option>
                      </select>
                    </div>
                    <div class="bg-blue-50 text-ecuavip-blue text-[11px] font-bold p-3 rounded-xl flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                      <span>Peso máximo de la maleta/caja: 25Kg</span>
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

                  <button (click)="reservarEncomienda()" [disabled]="!cotizacionActual" class="w-full mt-4 bg-ecuavip-blue text-white font-bold py-4 rounded-xl shadow-[0_8px_20px_-4px_rgba(0,82,204,0.5)] hover:bg-ecuavip-dark hover:shadow-[0_12px_24px_-6px_rgba(0,51,128,0.6)] transition-all transform hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed">
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
        <ng-container *ngIf="activeTab === 'my-packages'">
          
          <!-- SUB-VIEW 2A: RASTREO SATELITAL ACTIVO EN TIEMPO REAL -->
          <div *ngIf="selectedPackage" class="relative w-full h-full">
            
            <!-- Back Button to List -->
            <button 
              (click)="selectedPackage = null; isTracking = false" 
              class="absolute top-6 left-6 z-30 flex items-center gap-2 px-4 py-3 bg-white/95 backdrop-blur-md border border-gray-100 rounded-2xl shadow-lg hover:bg-white hover:scale-105 active:scale-95 transition-all text-xs font-black text-gray-800 uppercase tracking-wider"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
              Volver a la lista
            </button>

            <!-- Map Area -->
            <google-map 
              height="100%" 
              width="100%" 
              [center]="mapCenter" 
              [zoom]="mapZoom"
              [options]="mapOptions"
            >
              <map-directions-renderer *ngIf="directionsResults$ | async as directions" [directions]="directions"></map-directions-renderer>
              <map-marker 
                *ngIf="selectedPackage?.estado_logistico === 'en_curso' && vehiclePosition"
                [position]="vehiclePosition"
                [options]="vehicleMarkerOptions"
              ></map-marker>
            </google-map>

            <!-- Uber-style Overlay (Only for active shipments) -->
            <div *ngIf="selectedPackage?.estado_logistico !== 'finalizado'" class="absolute bottom-8 left-1/2 -translate-x-1/2 w-[92%] max-w-xl z-10">
              <div class="bg-gray-900 text-white rounded-3xl p-6 flex items-center justify-between shadow-2xl border border-gray-800">
                <div class="flex items-center gap-4">
                  <div class="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 overflow-hidden p-1">
                    <img src="assets/logo.png" class="w-full h-full object-contain" alt="Transport">
                  </div>
                  <div>
                    <p class="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Unidad {{ selectedPackage?.unidad || '104' }} - Van Premium</p>
                    <p class="text-base font-black leading-snug">{{ selectedPackage?.chofer || 'Santiago Pérez' }}</p>
                    <p class="text-xs text-blue-400 font-bold mt-0.5">ETA: {{ selectedPackage?.eta || '25 min' }}</p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <a href="tel:0999999999" class="w-12 h-12 bg-white/10 hover:bg-white/20 rounded-xl flex items-center justify-center transition-colors no-underline text-white">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 9.22a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.82 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17l.92-.08Z"/></svg>
                  </a>
                  <button class="px-6 h-12 bg-ecuavip-blue hover:bg-blue-700 rounded-xl flex items-center justify-center font-black text-xs uppercase tracking-widest transition-all text-white">Chat</button>
                </div>
              </div>
            </div>

            <!-- Delivery Confirmed Overlay -->
            <div *ngIf="selectedPackage?.estado_logistico === 'finalizado'" class="absolute inset-0 bg-white/20 backdrop-blur-[2px] flex items-center justify-center p-8 z-10">
              <div class="bg-white p-8 rounded-[2.5rem] shadow-2xl border border-gray-100 text-center max-w-xs animate-fade-in">
                <div class="w-16 h-16 bg-green-50 text-green-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M20 6 9 17l-5-5"/></svg>
                </div>
                <h5 class="text-xl font-black text-gray-900 mb-1 font-sans">Entrega Exitosa</h5>
                <p class="text-gray-500 text-xs font-medium mb-6">El paquete fue recibido el {{ selectedPackage?.fecha | date:'shortTime' }}</p>
                <button (click)="selectedPackage = null" class="w-full py-3 bg-gray-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest">Volver</button>
              </div>
            </div>
          </div>

          <!-- SUB-VIEW 2B: LISTADO HISTÓRICO DE ENCOMIENDAS -->
          <div *ngIf="!selectedPackage" class="flex-1 overflow-y-auto py-8 px-4 sm:px-6 lg:px-8 w-full max-w-4xl mx-auto">
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
                    {{ e.estado_logistico === 'en_curso' ? 'En Curso / Rastrear' : e.estado_logistico }}
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
        <ng-container *ngIf="activeTab === 'scan-qr'">
          <div class="flex-1 overflow-y-auto py-12 px-4 sm:px-6 w-full max-w-2xl mx-auto flex flex-col items-center justify-center">
            
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
      animation: fadeIn 0.8s ease-out forwards;
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.5s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(30px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class RastreoComponent implements OnInit, AfterViewInit {
  @ViewChild('origenInput') origenInput!: ElementRef<HTMLInputElement>;
  @ViewChild('destinoInput') destinoInput!: ElementRef<HTMLInputElement>;

  // Tab Navigation: Enviar/recibir ('send-receive'), Tus Encomiendas ('my-packages'), Escanear QR ('scan-qr')
  activeTab: 'send-receive' | 'my-packages' | 'scan-qr' = 'send-receive';

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
      url: 'assets/logo.png',
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
  horaSalida = '04:00 AM';
  horariosDisponibles: string[] = [
    '04:00 AM', '05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM',
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM',
    '07:00 PM', '08:00 PM'
  ];
  private cotizacionSub?: Subscription;

  constructor(
    private authService: AuthService,
    private clienteService: ClienteService,
    private mapService: MapService,
    private viajeService: ViajeService,
    private directionsService: MapDirectionsService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarEncomiendas();
  }

  ngAfterViewInit() {
    if (this.activeTab === 'send-receive') {
      this.initAutocomplete();
    }
  }

  setActiveTab(tab: 'send-receive' | 'my-packages' | 'scan-qr') {
    this.activeTab = tab;
    if (tab === 'send-receive') {
      setTimeout(() => {
        this.initAutocomplete();
      }, 100);
    }
  }

  cargarEncomiendas() {
    this.loadingEncomiendas = true;
    this.clienteService.getMisViajes().subscribe({
      next: (res) => {
        console.log('Encomiendas raw data:', res);
        this.encomiendas = (res || [])
          .filter(v => {
            const tipo = v.tipo_servicio || '';
            return tipo.toLowerCase().includes('encomienda');
          })
          .map(v => ({
            ...v,
            codigo_seguimiento: `ECU-${v.viaje_id || v.id}`,
            origen: v.dir_origen || v.origen,
            destino: v.dir_destino || v.destino,
            unidad: v.unidad || '104',
            chofer: v.chofer || 'Santiago Pérez',
            eta: v.estado_logistico === 'finalizado' ? 'Entregado' : '25 min',
            progreso: v.estado_logistico === 'finalizado' ? 100 : 55
          }));
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

  reservarEncomienda() {
    if (!this.cotizacionActual) return;
    
    if (!this.authService.isLoggedIn()) {
      // Redirigir o abrir modal. Como estamos en paquetes, forzamos login o mostramos error.
      alert('Por favor inicia sesión para poder realizar un envío.');
      return;
    }
    
    this.router.navigate(['/cliente/reserva'], {
      queryParams: { 
        origen: this.origenAddress, 
        destino: this.destinoAddress, 
        distancia: this.distanciaKm,
        tipo: 'encomienda',
        tarifa: this.cotizacionActual.precio_total,
        pasajeros: 1,
        hora: this.horaSalida
      }
    });
  }

  // Tracking flow methods
  onTrackManual() {
    if (this.trackingCode) {
      this.activeTab = 'my-packages';
      this.isScannerOpen = false;
      this.isTracking = true;
      
      this.selectedPackage = this.encomiendas.find(e => e.codigo_seguimiento.toLowerCase() === this.trackingCode.toLowerCase().trim());
      
      if (this.selectedPackage) {
        this.calculateRoute();
      } else {
        this.selectedPackage = {
          codigo_seguimiento: this.trackingCode,
          destino: 'Destino Externo',
          estado_logistico: 'en_curso',
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

    // Usar coordenadas si existen, sino usar strings de dirección
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
          // Simular posición según progreso
          const index = Math.floor(path.length * (this.selectedPackage.progreso / 100));
          this.vehiclePosition = path[index]?.toJSON();
          
          // Ajustar centro
          this.mapCenter = this.vehiclePosition || path[0].toJSON();
        }
        return res;
      })
    );
  }

  trackSpecific(encomienda: any) {
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
      case 'en_curso': return 'bg-blue-50 text-blue-700 border-blue-100';
      case 'finalizado': return 'bg-gray-50 text-gray-600 border-gray-100';
      default: return 'bg-gray-50 text-gray-500 border-gray-100';
    }
  }
}
