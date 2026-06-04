import { Component, OnInit, ViewChild, ElementRef, NgZone, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleMapsModule, MapDirectionsService } from '@angular/google-maps';
import { MapService } from '../../../core/services/map.service';
import { ViajeService, CotizacionResponse } from '../../../core/services/viaje.service';
import { AuthService } from '../../../core/services/auth.service';
import { AuthModalComponent } from '../../auth/auth-modal/auth-modal.component';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';
import { Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-cotizador',
  standalone: true,
  imports: [CommonModule, FormsModule, GoogleMapsModule, AuthModalComponent, RouterModule],
  templateUrl: './cotizador.component.html',
  styleUrls: ['./cotizador.component.css']
})
export class CotizadorComponent implements OnInit, OnDestroy {
  @ViewChild('origenInput') origenInput!: ElementRef<HTMLInputElement>;
  @ViewChild('destinoInput') destinoInput!: ElementRef<HTMLInputElement>;

  center: google.maps.LatLngLiteral = { lat: -1.2416, lng: -78.6195 }; // Ambato
  zoom = 13;
  options: google.maps.MapOptions = {
    mapTypeId: 'roadmap',
    zoomControl: false,
    scrollwheel: true,
    disableDoubleClickZoom: true,
    maxZoom: 20,
    minZoom: 6,
    streetViewControl: false,
    mapTypeControl: false,
    fullscreenControl: false
  };

  directionsResults$!: Observable<google.maps.DirectionsResult | undefined>;
  
  origenAddress = '';
  destinoAddress = '';
  distanciaKm = 0;
  tiempoEstimado = '';
  
  tipoViaje: 'pasajero' | 'encomienda' | 'express' = 'pasajero';
  numPasajeros = 1;
  maxPasajeros = 15;
  horaSalida = '04:00 AM';
  
  mostrarMapaAsientos = false;
  asientosSeleccionados: number[] = [];
  asientosOcupados: number[] = [];
  
  horariosDisponibles: string[] = [
    '04:00 AM', '05:00 AM', '06:00 AM', '07:00 AM', '08:00 AM',
    '09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM',
    '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM',
    '07:00 PM', '08:00 PM'
  ];

  cotizacionActual?: CotizacionResponse;
  private cotizacionSub?: Subscription;

  origenLocation?: google.maps.LatLngLiteral;
  destinoLocation?: google.maps.LatLngLiteral;
  
  showAuthModal = false;

  constructor(
    private mapService: MapService,
    private viajeService: ViajeService,
    private authService: AuthService,
    private directionsService: MapDirectionsService,
    private ngZone: NgZone,
    private router: Router
  ) {}

  ngOnInit() {}
  ngOnDestroy() {
    if (this.cotizacionSub) this.cotizacionSub.unsubscribe();
  }

  getTitulo(): string {
    return this.tipoViaje === 'encomienda' ? '¿A dónde envías/recibes?' : '¿A dónde vas?';
  }

  ngAfterViewInit() {
    this.initAutocomplete();
  }

  initAutocomplete() {
    if (!google || !google.maps || !google.maps.places) return;
    
    const autocompleteOrigen = new google.maps.places.Autocomplete(this.origenInput.nativeElement, { componentRestrictions: { country: 'ec' } });
    const autocompleteDestino = new google.maps.places.Autocomplete(this.destinoInput.nativeElement, { componentRestrictions: { country: 'ec' } });

    autocompleteOrigen.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = autocompleteOrigen.getPlace();
        if (place.geometry && place.geometry.location) {
          this.origenLocation = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
          this.origenAddress = place.formatted_address || '';
          this.calculateRoute();
        }
      });
    });

    autocompleteDestino.addListener('place_changed', () => {
      this.ngZone.run(() => {
        const place = autocompleteDestino.getPlace();
        if (place.geometry && place.geometry.location) {
          this.destinoLocation = { lat: place.geometry.location.lat(), lng: place.geometry.location.lng() };
          this.destinoAddress = place.formatted_address || '';
          this.calculateRoute();
        }
      });
    });
  }

  onMapClick(event: google.maps.MapMouseEvent) {
    if (!event.latLng) return;
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
          this.calculateRoute();
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

  calculateRoute() {
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

  cambiarTipoViaje(tipo: 'pasajero' | 'encomienda' | 'express') {
    this.tipoViaje = tipo;
    this.actualizarCotizacion();
  }

  incrementarPasajeros() {
    if (this.numPasajeros < this.maxPasajeros) {
      this.numPasajeros++;
      this.actualizarCotizacion();
    }
  }

  decrementarPasajeros() {
    if (this.numPasajeros > 1) {
      this.numPasajeros--;
      if (this.asientosSeleccionados.length > this.numPasajeros) {
        this.asientosSeleccionados = this.asientosSeleccionados.slice(0, this.numPasajeros);
      }
      this.actualizarCotizacion();
    }
  }

  actualizarCotizacion() {
    if (this.distanciaKm <= 0) return;
    
    if (this.cotizacionSub) this.cotizacionSub.unsubscribe();

    this.cotizacionSub = this.viajeService.cotizarViaje({
      distancia_km: this.distanciaKm,
      tipo_servicio: this.tipoViaje,
      num_pasajeros: this.numPasajeros
    }).subscribe({
      next: (res) => this.cotizacionActual = res,
      error: (err) => console.error('Error cotizando', err)
    });
  }

  limpiar() {
    this.ngZone.run(() => {
      this.origenLocation = undefined;
      this.origenAddress = '';
      this.destinoLocation = undefined;
      this.destinoAddress = '';
      this.distanciaKm = 0;
      this.tiempoEstimado = '';
      this.cotizacionActual = undefined;
      this.directionsResults$ = new Observable();
      this.mostrarMapaAsientos = false;
      this.asientosSeleccionados = [];
    });
  }

  toggleAsiento(numero: number) {
    if (this.asientosOcupados.includes(numero)) return;
    
    const index = this.asientosSeleccionados.indexOf(numero);
    if (index > -1) {
      this.asientosSeleccionados.splice(index, 1);
    } else {
      if (this.asientosSeleccionados.length >= this.numPasajeros) {
        this.asientosSeleccionados.shift();
      }
      this.asientosSeleccionados.push(numero);
    }
  }

  isAsientoSeleccionado(numero: number): boolean {
    return this.asientosSeleccionados.includes(numero);
  }

  reservar() {
    if (!this.cotizacionActual) return;
    
    if (!this.authService.isLoggedIn()) {
      this.showAuthModal = true;
      return;
    }
    
    this.procederReserva();
  }
  
  onAuthSuccess() {
    this.showAuthModal = false;
    this.procederReserva();
  }
  
  private procederReserva() {
    if (!this.cotizacionActual) return;
    this.router.navigate(['/cliente/reserva'], {
      queryParams: { 
        origen: this.origenAddress, 
        destino: this.destinoAddress, 
        distancia: this.distanciaKm,
        tipo: this.tipoViaje,
        tarifa: this.cotizacionActual.precio_total,
        pasajeros: this.numPasajeros,
        hora: this.horaSalida,
        asientos: JSON.stringify(this.asientosSeleccionados)
      }
    });
  }
}
