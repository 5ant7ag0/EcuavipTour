import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { SoapService } from '../../../../core/services/soap.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthModalComponent } from '../../../auth/auth-modal/auth-modal.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-viaje-compartido-cartelera',
  standalone: true,
  imports: [CommonModule, FormsModule, AuthModalComponent, RouterModule],
  templateUrl: './viaje-compartido-cartelera.component.html',
  styleUrls: ['./viaje-compartido-cartelera.component.css']
})
export class ViajeCompartidoCarteleraComponent implements OnInit {
  viajesProgramados: any[] = [];
  viajeSeleccionado: any = null;
  asientosSeleccionados: number[] = [];
  asientosOcupados: number[] = [];
  puntoAbordaje = '';
  puntosAbordaje: string[] = [
    'Terminal Terrestre Central',
    'Parque Central (Frente al Municipio)',
    'Gasolinera San Andrés (Entrada Norte)',
    'Oficina Ecuavip (Av. Indoamérica)'
  ];
  puntosAbordajeDinamicos: string[] = [];

  numPasajeros = 1;
  mostrarMapaAsientos = false;
  loading = false;
  loadingAsientos = false;
  error = '';
  authModalError = '';
  showAuthModal = false;

  constructor(
    private soapService: SoapService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarViajesProgramados();
  }

  cargarViajesProgramados() {
    this.loading = true;
    this.error = '';
    this.soapService.post(
      'http://ecuaviptour.com/soap/viajes',
      'getViajesProgramadosRequest',
      {}
    ).subscribe({
      next: (res) => {
        this.loading = false;
        this.viajesProgramados = res.viajes_programados || [];
      },
      error: (err) => {
        this.loading = false;
        this.error = 'Error al cargar la cartelera de frecuencias: ' + (err.error?.error || 'Conexión rechazada');
        console.error(err);
      }
    });
  }

  getParadasAproximadas(origen: string, destino: string): string[] {
    const orig = (origen || '').toLowerCase();
    const dest = (destino || '').toLowerCase();

    // Ruta: Quito <-> Ambato
    if ((orig.includes('quito') && dest.includes('ambato')) || (orig.includes('ambato') && dest.includes('quito'))) {
      return [
        'Machachi - Gasolinera Primax',
        'Lasso - Entrada a Cotopaxi',
        'Latacunga - El Salto / Terminal',
        'Salcedo - Parada del Helado'
      ];
    }
    // Ruta: Quito <-> Riobamba
    if ((orig.includes('quito') && dest.includes('riobamba')) || (orig.includes('riobamba') && dest.includes('quito'))) {
      return [
        'Machachi - Gasolinera Primax',
        'Latacunga - El Salto / Terminal',
        'Salcedo - Parada del Helado',
        'Ambato - El Fico / Mall de los Andes',
        'Mocha - Parada del Cuy',
        'Urbina - Límite Provincial'
      ];
    }
    // Ruta: Ambato <-> Riobamba
    if ((orig.includes('ambato') && dest.includes('riobamba')) || (orig.includes('riobamba') && dest.includes('ambato'))) {
      return [
        'Mocha - Parada del Cuy',
        'Urbina - Límite Provincial',
        'Guano - Entrada Principal'
      ];
    }
    // Ruta: Ambato/Quito <-> Baños
    if (orig.includes('baños') || dest.includes('baños') || orig.includes('banos') || dest.includes('banos')) {
      return [
        'Pelileo - Mercado Central',
        'Totoras - Parada Principal',
        'Río Verde - Entrada a Cascada'
      ];
    }
    // Ruta: Guayaquil
    if (orig.includes('guayaquil') || dest.includes('guayaquil')) {
      return [
        'Durán - Gasolinera Terpel',
        'El Triunfo - Redondel',
        'Cumandá - Parada Central',
        'Pallatanga - Gasolinera Primax'
      ];
    }

    // Fallback general
    return [
      'Terminal Terrestre Central',
      'Parque Central (Frente al Municipio)',
      'Gasolinera San Andrés (Entrada Norte)',
      'Oficina Ecuavip (Av. Indoamérica)'
    ];
  }

  seleccionarViaje(viaje: any) {
    this.viajeSeleccionado = viaje;
    this.asientosSeleccionados = [];
    this.numPasajeros = 1;
    this.mostrarMapaAsientos = false;
    this.puntoAbordaje = '';
    this.asientosOcupados = [];
    this.error = '';
    this.authModalError = '';

    const stops = this.getParadasAproximadas(viaje.dir_origen, viaje.dir_destino);
    const cleanedStops = stops.filter(stop => 
      stop.toLowerCase().trim() !== viaje.dir_origen.toLowerCase().trim() && 
      stop.toLowerCase().trim() !== viaje.dir_destino.toLowerCase().trim()
    );
    this.puntosAbordajeDinamicos = [viaje.dir_origen, ...cleanedStops];
    this.puntoAbordaje = viaje.dir_origen;

    this.cargarAsientosOcupados(viaje.id);
  }

  cargarAsientosOcupados(viajeProgramadoId: number) {
    this.loadingAsientos = true;
    this.soapService.post(
      'http://ecuaviptour.com/soap/viajes',
      'getAsientosOcupadosFrecuenciaRequest',
      { viaje_programado_id: viajeProgramadoId }
    ).subscribe({
      next: (res) => {
        this.loadingAsientos = false;
        if (res && res.asientos) {
          this.asientosOcupados = Array.isArray(res.asientos) ? res.asientos.map(Number) : [Number(res.asientos)];
        } else {
          this.asientosOcupados = [];
        }
      },
      error: (err) => {
        this.loadingAsientos = false;
        console.error('Error al cargar asientos ocupados:', err);
      }
    });
  }

  incrementarPasajeros() {
    if (!this.viajeSeleccionado) return;
    if (this.numPasajeros < this.viajeSeleccionado.asientos_disponibles) {
      this.numPasajeros++;
      this.asientosSeleccionados = []; // Reset manual choices to avoid mismatches
    }
  }

  decrementarPasajeros() {
    if (this.numPasajeros > 1) {
      this.numPasajeros--;
      this.asientosSeleccionados = []; // Reset manual choices to avoid mismatches
    }
  }

  getAsientosArray(): number[] {
    if (!this.viajeSeleccionado) return [];
    const cap = this.viajeSeleccionado.capacidad_total || 15;
    const arr = [];
    for (let i = 1; i <= cap; i++) {
      arr.push(i);
    }
    return arr;
  }

  toggleAsiento(numero: number) {
    if (this.asientosOcupados.includes(numero)) return;
    
    const index = this.asientosSeleccionados.indexOf(numero);
    if (index > -1) {
      this.asientosSeleccionados.splice(index, 1);
    } else {
      if (this.asientosSeleccionados.length < this.numPasajeros) {
        this.asientosSeleccionados.push(numero);
      } else {
        // Swap oldest selection
        this.asientosSeleccionados.shift();
        this.asientosSeleccionados.push(numero);
      }
    }
  }

  isAsientoSeleccionado(numero: number): boolean {
    return this.asientosSeleccionados.includes(numero);
  }

  isAsientoLibre(numero: number): boolean {
    return !this.isAsientoSeleccionado(numero) && !this.asientosOcupados.includes(numero);
  }

  get mostrarCargando(): boolean {
    return this.loading && this.viajesProgramados.length === 0;
  }

  get mostrarVacio(): boolean {
    return !this.loading && this.viajesProgramados.length === 0;
  }

  confirmarReserva() {
    if (!this.viajeSeleccionado || this.loading) return;
    if (!this.puntoAbordaje) {
      this.error = 'Por favor, selecciona tu punto de abordaje.';
      return;
    }

    if (!this.authService.isLoggedIn()) {
      this.showAuthModal = true;
      return;
    }

    this.procederReservaCompartida();
  }

  onAuthSuccess() {
    this.showAuthModal = false;
    this.procederReservaCompartida();
  }

  private procederReservaCompartida() {
    this.loading = true;
    this.error = '';

    // Auto-assign seats if they weren't chosen manually
    const autoAssigned: number[] = [];
    const needed = this.numPasajeros - this.asientosSeleccionados.length;
    if (needed > 0) {
      for (let i = 1; i <= this.viajeSeleccionado.capacidad_total; i++) {
        if (autoAssigned.length === needed) break;
        if (!this.asientosOcupados.includes(i) && !this.asientosSeleccionados.includes(i)) {
          autoAssigned.push(i);
        }
      }
    }

    const finalSeats = [...this.asientosSeleccionados, ...autoAssigned];

    if (finalSeats.length < this.numPasajeros) {
      this.loading = false;
      this.error = 'No hay suficientes asientos disponibles para la cantidad de pasajeros elegida.';
      return;
    }

    // Call reservation SOAP requests parallelly
    const requests = finalSeats.map(seat => {
      return this.soapService.post(
        'http://ecuaviptour.com/soap/viajes',
        'reservarViajeCompartidoRequest',
        {
          viaje_programado_id: this.viajeSeleccionado.id,
          numero_asiento: seat,
          punto_abordaje: this.puntoAbordaje
        },
        this.authService.getToken() || undefined
      );
    });

    forkJoin(requests).subscribe({
      next: (results: any[]) => {
        this.loading = false;
        const firstReserva = results[0].reserva;
        this.router.navigate(['/cliente/reserva'], {
          queryParams: {
            reservaId: firstReserva.id,
            origen: firstReserva.dir_origen,
            destino: firstReserva.dir_destino,
            asiento: finalSeats.join(', '),
            abordaje: firstReserva.punto_abordaje,
            tarifa: Number(this.viajeSeleccionado.precio_asiento) * this.numPasajeros,
            fechaLimite: firstReserva.fecha_limite_pago,
            hora: firstReserva.fecha_hora_salida,
            pin: firstReserva.pin_abordaje
          }
        });
      },
      error: (err) => {
        this.loading = false;
        const msg = err.error?.error || '';
        this.error = 'Error al crear la reserva: ' + (msg || 'Asientos no disponibles o sesión expirada');
        
        if (msg.includes('Sesión expirada') || msg.includes('inicia sesión') || msg.includes('autenticado') || msg.includes('anonymousUser')) {
          this.authService.logout();
          this.authModalError = 'Tu sesión ha expirado o es inválida. Por favor, inicia sesión de nuevo.';
          this.cerrarModal();
          this.showAuthModal = true;
        }
      }
    });
  }

  cerrarModal() {
    this.viajeSeleccionado = null;
    this.asientosSeleccionados = [];
    this.numPasajeros = 1;
    this.mostrarMapaAsientos = false;
    this.puntoAbordaje = '';
    this.error = '';
    this.authModalError = '';
  }
}
