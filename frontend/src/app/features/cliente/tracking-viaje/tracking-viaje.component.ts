import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { QRCodeModule } from 'angularx-qrcode';
import { ClienteService } from '../../../core/services/cliente.service';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';
import { ChatService } from '../../../core/services/chat.service';
import { ChatSidebarComponent } from '../../../shared/components/chat-sidebar/chat-sidebar.component';
import { Subscription, Observable } from 'rxjs';
import { CountdownService } from '../../../core/services/countdown.service';

import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tracking-viaje',
  standalone: true,
  imports: [CommonModule, RouterModule, QRCodeModule, ChatSidebarComponent, FormsModule],
  templateUrl: './tracking-viaje.component.html'
})
export class TrackingViajeComponent implements OnInit, OnDestroy {
  viajeActual: any = null;
  historial: any[] = [];
  loading = true;
  isTicketModalOpen = false;
  toast: string | null = null;
  usuario: any = null;
  isChatOpen = false;
  isChatOnly = false;
  private componentSubs: Subscription[] = [];
  adminId = 1;
  countdown$: Observable<{time: string, isCritical: boolean, isExpired: boolean}> | null = null;
  private countdownSub?: Subscription;

  asTimer(timer: any): any {
    return timer;
  }

  get unreadMessages(): number {
    return this.socketService.unreadMessages;
  }

  // Cancelación
  showCancelModal = false;

  // Calificación
  showRatingModal = false;
  rating = 0;
  comentario = '';

  // Map state
  map: any;
  directionsService: any;
  directionsRenderer: any;
  driverMarker: any;

  private socketSub: Subscription | null = null;
  private chatSub: Subscription | null = null;
  private locationSub: Subscription | null = null;
  private assignmentSub: Subscription | null = null;

  constructor(
    private route: ActivatedRoute,
    private clienteService: ClienteService,
    private authService: AuthService,
    private router: Router,
    private socketService: SocketService,
    private chatService: ChatService,
    private countdownService: CountdownService
  ) {}

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    this.cargarViajes();
    
    const despachadoInfo = sessionStorage.getItem('despachado_toast');
    if (despachadoInfo) {
      try {
        const data = JSON.parse(despachadoInfo);
        sessionStorage.removeItem('despachado_toast');
        setTimeout(() => {
          this.showToast(`¡Tu viaje ha sido despachado! Conductor: ${data.chofer_nombre}. Vehículo: ${data.vehiculo_marca} ${data.vehiculo_modelo} (${data.vehiculo_placa})`);
        }, 1000);
      } catch (e) {
        sessionStorage.removeItem('despachado_toast');
      }
    }

    // Escuchar si se despacha en tiempo real estando en la pagina
    this.socketService.listen('viaje_despachado_cliente').subscribe((data: any) => {
      console.log('Viaje despachado en tiempo real!', data);
      this.cargarViajes();
      this.showToast(`¡Tu viaje ha sido despachado! Conductor: ${data.chofer_nombre}. Vehículo: ${data.vehiculo_marca} ${data.vehiculo_modelo} (${data.vehiculo_placa})`);
    });
    
    // Obtener el ID real del admin desde el backend
    this.chatService.getAdminInfo().subscribe({
      next: (info) => {
        this.adminId = info.admin_id;
        console.log('[Chat] Admin ID cargado:', this.adminId);
      },
      error: () => {
        console.warn('[Chat] No se pudo cargar admin ID, usando fallback=1');
        this.adminId = 1;
      }
    });
    
    // Conectarse a la sala del usuario (cliente)
    this.socketService.connectAndJoin();
    
    // Escuchar actualizaciones de estado (por ejemplo, admin aprueba/rechaza)
    this.socketSub = this.socketService.listen('pago_actualizado').subscribe((data) => {
      console.log('Pago actualizado en tiempo real!', data);
      if (this.viajeActual && Number(data.viaje_id) === Number(this.viajeActual.viaje_id || this.viajeActual.id)) {
        this.cargarViajes();
      }
    });


    // Escuchar ubicación del chofer
    this.locationSub = this.socketService.listen('ubicacion_chofer_actualizada').subscribe((data) => {
      console.log('Ubicación chofer recibida:', data);
      this.updateDriverMarker(data.lat, data.lng);
    });

    // Escuchar si se asigna un chofer en tiempo real
    this.assignmentSub = this.socketService.listen('chofer_asignado').subscribe((data: any) => {
      console.log('Chofer asignado en tiempo real!', data);
      if (this.viajeActual && Number(data.viaje_id) === Number(this.viajeActual.viaje_id || this.viajeActual.id)) {
        this.viajeActual.chofer_id = data.chofer_id;
        this.viajeActual.nombre_chofer = data.nombre_chofer;
        this.viajeActual.estado_logistico = data.estado;
        this.viajeActual.foto_chofer_url = data.foto_chofer_url;
        this.viajeActual.vehiculo = data.vehiculo;
        
        const isEnco = (this.viajeActual.tipo_servicio || '').toLowerCase() === 'encomienda' || (data.tipo_servicio || '').toLowerCase() === 'encomienda';
        this.showToast(isEnco 
          ? `¡Un repartidor ha aceptado tu envío! ${data.nombre_chofer} está en camino.` 
          : `¡Un chofer ha aceptado tu viaje! ${data.nombre_chofer} está en camino.`);
        
        if (this.directionsRenderer) this.calculateRoute();
      }
    });

    // Escuchar cuando el chofer llega al punto
    this.socketService.listen('chofer_en_punto').subscribe((data: any) => {
      console.log('Chofer en punto!', data);
      if (this.viajeActual && Number(data.viaje_id) === Number(this.viajeActual.viaje_id || this.viajeActual.id)) {
        this.viajeActual.estado_logistico = 'esperando_cliente';
        
        const isEnco = (this.viajeActual.tipo_servicio || '').toLowerCase() === 'encomienda' || (data.tipo_servicio || '').toLowerCase() === 'encomienda';
        this.showToast(isEnco 
          ? '¡El repartidor ha llegado para recoger el paquete!' 
          : '¡Tu chofer ha llegado al punto de inicio!');
        
        if (this.directionsRenderer) this.calculateRoute();
      }
    });

    // Escuchar cuando el viaje finaliza
    this.socketService.listen('viaje_finalizado').subscribe((data: any) => {
      console.log('Viaje finalizado!', data);
      if (this.viajeActual && Number(data.viaje_id) === Number(this.viajeActual.viaje_id || this.viajeActual.id)) {
        this.viajeActual.estado_logistico = 'finalizado';
        
        const isEnco = (this.viajeActual.tipo_servicio || '').toLowerCase() === 'encomienda' || (data.tipo_servicio || '').toLowerCase() === 'encomienda';
        this.showToast(isEnco 
          ? 'Tu paquete ha sido entregado. ¡Gracias por usar Ecuavip Tour!' 
          : 'Tu viaje ha finalizado. ¡Gracias por usar Ecuavip Tour!');
        
        this.showRatingModal = true; // ACTIVAR BURBUJA DE CALIFICACIÓN
        // No cargamos viajes aún para no quitar el modal de golpe
      }
    });
    
    // Escuchar cuando el viaje es cancelado
    this.socketService.listen('viaje_cancelado').subscribe((data: any) => {
      console.log('Viaje cancelado!', data);
      if (this.viajeActual && Number(data.viaje_id) === Number(this.viajeActual.viaje_id || this.viajeActual.id)) {
        this.viajeActual.estado_logistico = 'cancelado';
        
        const isEnco = (this.viajeActual.tipo_servicio || '').toLowerCase() === 'encomienda' || (data.tipo_servicio || '').toLowerCase() === 'encomienda';
        let msg = data.mensaje || 'El viaje ha sido cancelado';
        if (isEnco) {
          msg = msg.replace(/viaje/gi, 'envío').replace(/chofer/gi, 'repartidor');
        }
        this.showToast(msg);
        
        setTimeout(() => this.cargarViajes(), 3000); // Dar tiempo a ver el toast
      }
    });

    // Escuchar cuando el chofer cancela el viaje y vuelve a buscar chofer
    this.socketService.listen('buscando_nuevo_chofer').subscribe((data: any) => {
      console.log('Chofer canceló el viaje, buscando nuevo conductor...', data);
      if (this.viajeActual && Number(data.viaje_id) === Number(this.viajeActual.viaje_id || this.viajeActual.id)) {
        this.viajeActual.chofer_id = null;
        this.viajeActual.nombre_chofer = null;
        this.viajeActual.estado_logistico = 'buscando_chofer';
        if (this.viajeActual.vehiculo) {
          this.viajeActual.vehiculo = null;
        }
        
        const isEnco = (this.viajeActual.tipo_servicio || '').toLowerCase() === 'encomienda' || (data.tipo_servicio || '').toLowerCase() === 'encomienda';
        this.showToast(isEnco 
          ? 'El repartidor asignado canceló el envío. Buscando otro de inmediato...' 
          : 'El chofer asignado canceló el viaje. Buscando otro conductor de inmediato...');
        
        // Recargar los viajes para actualizar el mapa, quitar la ruta del conductor, etc.
        this.cargarViajes();
      }
    });

    // Escuchar cualquier actualización de estado genérica
    this.socketService.listen('viaje_actualizado_cliente').subscribe((data: any) => {
      if (this.viajeActual && Number(data.viaje_id) === Number(this.viajeActual.viaje_id || this.viajeActual.id)) {
        this.viajeActual.estado_logistico = data.estado;
      }
    });

    // Auto-abrir chat y activar modo Inbox si la ruta es /mensajes
    if (this.router.url.includes('/mensajes')) {
      this.isChatOpen = true;
      this.isChatOnly = true;
    }

    // Escuchar el evento reactivo global para abrir el chat
    const chatSub = this.socketService.triggerChatOpen.subscribe(() => {
      this.isChatOpen = true;
    });
    this.componentSubs.push(chatSub);

    if (this.socketService.openChatOnLoad) {
      this.isChatOpen = true;
      this.socketService.openChatOnLoad = false;
    }
  }

  initMap() {
    if (!this.viajeActual || !window.hasOwnProperty('google')) return;

    const mapElement = document.getElementById('trackingMap');
    if (!mapElement) return;

    this.map = new google.maps.Map(mapElement, {
      center: { lat: -0.1807, lng: -78.4678 }, // Quito default
      zoom: 13,
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

    this.calculateRoute();
  }

  calculateRoute() {
    if (!this.viajeActual) return;

    const request = {
      origin: this.viajeActual.origen,
      destination: this.viajeActual.destino,
      travelMode: google.maps.TravelMode.DRIVING
    };

    this.directionsService.route(request, (result: any, status: any) => {
      if (status === google.maps.DirectionsStatus.OK) {
        this.directionsRenderer.setDirections(result);
      }
    });
  }

  updateDriverMarker(lat: number, lng: number) {
    const pos = { lat, lng };
    if (!this.driverMarker) {
      this.driverMarker = new google.maps.Marker({
        position: pos,
        map: this.map,
        icon: {
          url: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', // Icono de carrito azul
          scaledSize: new google.maps.Size(40, 40)
        },
        title: 'Tu Chofer'
      });
    } else {
      this.driverMarker.setPosition(pos);
    }
    
    // Centrar suavemente el mapa si el chofer se mueve mucho
    // this.map.panTo(pos); 
  }

  ngOnDestroy() {
    if (this.socketSub) this.socketSub.unsubscribe();
    if (this.chatSub) this.chatSub.unsubscribe();
    if (this.locationSub) this.locationSub.unsubscribe();
    if (this.assignmentSub) this.assignmentSub.unsubscribe();
    if (this.countdownSub) this.countdownSub.unsubscribe();
    this.componentSubs.forEach(s => s.unsubscribe());
  }

  toggleChat() {
    if (!this.viajeActual?.nombre_chofer) return;
    this.isChatOpen = !this.isChatOpen;
    if (this.isChatOpen) {
      this.socketService.unreadMessages = 0;
      // Marcamos como leído ante la administración (ID 1)
      this.clienteService.markAsRead(1).subscribe();
    }
  }

  cargarViajes() {
    this.loading = true;
    
    const reservaIdParam = this.route.snapshot.queryParams['reservaId'];
    console.log('[TrackingViaje] queryParam reservaId:', reservaIdParam);
    if (reservaIdParam) {
      const targetReservaId = Number(reservaIdParam);
      this.clienteService.getMisReservas().subscribe({
        next: (reservas) => {
          console.log('[TrackingViaje] getMisReservas returned:', reservas);
          const res = (reservas || []).find((r: any) => Number(r.id) === targetReservaId);
          console.log('[TrackingViaje] Found matching reservation:', res);
          if (res) {
            this.viajeActual = {
              viaje_id: res.id,
              id: res.id,
              viaje_programado_id: res.viaje_programado_id,
              origen: res.dir_origen,
              destino: res.dir_destino,
              monto: res.precio_asiento,
              tarifa: res.precio_asiento,
              fecha: res.fecha_hora_salida,
              estado_pago: res.estado_pago ? res.estado_pago.toLowerCase() : 'pendiente',
              estado_logistico: res.estado_logistico ? res.estado_logistico.toLowerCase() : 'pendiente',
              nombre_chofer: res.chofer ? res.chofer.nombre : null,
              chofer_id: res.chofer ? res.chofer.id : null,
              foto_chofer_url: res.chofer ? res.chofer.foto_perfil_url : null,
              vehiculo: res.vehiculo ? {
                marca: res.vehiculo.marca,
                modelo: res.vehiculo.modelo,
                placa: res.vehiculo.placa,
                foto_auto_url: res.vehiculo.foto_auto_url
              } : null,
              asientos: res.numero_asiento ? res.numero_asiento.toString() : '',
              punto_abordaje: res.punto_abordaje,
              pin_abordaje: res.pin_abordaje,
              qr_hash: res.pin_abordaje,
              isCompartido: true
            };
            this.historial = [];
            setTimeout(() => this.initMap(), 500);
          } else {
            console.warn('[TrackingViaje] targetReservaId not found in reservas. Redirecting...');
            this.showToast('Reserva no encontrada.');
            this.router.navigate(['/cliente/cotizar']);
          }
          this.loading = false;
        },
        error: (err) => {
          console.error('[TrackingViaje] Error loading reservas:', err);
          this.showToast('Error al cargar la reserva.');
          this.loading = false;
          this.router.navigate(['/cliente/cotizar']);
        }
      });
      return;
    }

    this.clienteService.getMisViajes().subscribe({
      next: (viajes) => {
        if (viajes && viajes.length > 0) {
          const ultimoViaje = viajes[0];
          const isEncomienda = (ultimoViaje.tipo_servicio || '').toLowerCase() === 'encomienda';
          if (isEncomienda && ultimoViaje.estado_logistico !== 'finalizado' && ultimoViaje.estado_logistico !== 'cancelado') {
            this.router.navigate(['/cliente/paquetes']);
            return;
          }
          if (ultimoViaje.estado_logistico !== 'finalizado' && ultimoViaje.estado_logistico !== 'cancelado') {
            if (ultimoViaje.estado_pago === 'pendiente') {
              this.router.navigate(['/cliente/reserva'], {
                queryParams: {
                  viajeId: ultimoViaje.viaje_id || ultimoViaje.id
                }
              });
              return;
            }
            this.viajeActual = ultimoViaje;
            this.historial = viajes.slice(1);
            
            if (this.viajeActual.estado_pago === 'rechazado' && this.viajeActual.fecha_limite_pago) {
              if (this.countdownSub) this.countdownSub.unsubscribe();
              this.countdown$ = this.countdownService.getCountdown(this.viajeActual.fecha_limite_pago);
              this.countdownSub = this.countdown$.subscribe((val: any) => {
                if (val && val.isExpired) {
                  this.viajeActual = null;
                  this.cargarViajes();
                }
              });
            }

            setTimeout(() => this.initMap(), 500);
          } else {
            this.viajeActual = null;
            this.historial = viajes;
            this.router.navigate(['/cliente/cotizar']);
          }
        } else {
          this.viajeActual = null;
          this.historial = [];
          this.router.navigate(['/cliente/cotizar']);
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando viajes', err);
        this.loading = false;
      }
    });
  }
  
  getProgreso(): number {
    if (!this.viajeActual) return 0;
    const est = this.viajeActual.estado_logistico;
    if (est === 'pendiente' || est === 'programado') return 20;
    if (est === 'buscando_chofer') return 30;
    if (est === 'aceptado' || est === 'asignado') return 50;
    if (est === 'esperando_cliente') return 70;
    if (est === 'en_curso' || est === 'en_viaje' || est === 'en_ruta') return 90;
    if (est === 'finalizado') return 100;
    return 0;
  }

  getSharedTripStatusText(): string {
    if (!this.viajeActual) return '';

    const origen = this.viajeActual.origen || '';
    const puntoAbordaje = this.viajeActual.punto_abordaje || '';
    const estLog = this.viajeActual.estado_logistico || '';
    const estPago = this.viajeActual.estado_pago || '';

    const isOrigen = origen.toLowerCase().trim() === puntoAbordaje.toLowerCase().trim() ||
                     origen.toLowerCase().includes(puntoAbordaje.toLowerCase()) ||
                     puntoAbordaje.toLowerCase().includes(origen.toLowerCase());

    const isEnRuta = estLog === 'en_curso' || estLog === 'en_viaje' || estLog === 'en_ruta';
    const isAbordo = estPago === 'abordo' || estPago === 'confirmado_abordo';

    // Parse departure time to calculate arrival time
    let horaLlegadaStr = '12:00 pm';
    if (this.viajeActual.fecha) {
      try {
        const departureDate = new Date(this.viajeActual.fecha);
        if (!isNaN(departureDate.getTime())) {
          // Assume travel duration of 75 minutes
          const arrivalDate = new Date(departureDate.getTime() + 75 * 60 * 1000);
          let hours = arrivalDate.getHours();
          const minutes = arrivalDate.getMinutes();
          const ampm = hours >= 12 ? 'pm' : 'am';
          hours = hours % 12;
          hours = hours ? hours : 12;
          const minutesStr = minutes < 10 ? '0' + minutes : minutes;
          horaLlegadaStr = `${hours}:${minutesStr} ${ampm}`;
        }
      } catch (e) {
        console.error('Error parsing departure date', e);
      }
    }

    if (!isEnRuta) {
      // Before trip starts
      if (isOrigen) {
        if (this.viajeActual.fecha) {
          try {
            const departureDate = new Date(this.viajeActual.fecha);
            if (!isNaN(departureDate.getTime())) {
              const diffMs = departureDate.getTime() - new Date().getTime();
              const diffMins = Math.round(diffMs / (60 * 1000));
              if (diffMins > 0) {
                if (diffMins <= 60) {
                  return `Prepárate, salimos en ${diffMins} min`;
                } else {
                  let depHours = departureDate.getHours();
                  const depMins = departureDate.getMinutes();
                  const depAmpm = depHours >= 12 ? 'pm' : 'am';
                  depHours = depHours % 12;
                  depHours = depHours ? depHours : 12;
                  const depMinsStr = depMins < 10 ? '0' + depMins : depMins;
                  return `Prepárate, salimos a las ${depHours}:${depMinsStr} ${depAmpm}`;
                }
              } else {
                return 'Prepárate, salimos en breves momentos';
              }
            }
          } catch (e) {
            console.error('Error parsing departure date', e);
          }
        }
        return 'Prepárate, salimos en 5 min';
      } else {
        if (this.viajeActual.fecha) {
          try {
            const departureDate = new Date(this.viajeActual.fecha);
            if (!isNaN(departureDate.getTime())) {
              // Assume stop is reached 15 mins after departure.
              const stopArrivalDate = new Date(departureDate.getTime() + 15 * 60 * 1000);
              const diffMs = stopArrivalDate.getTime() - new Date().getTime();
              const diffMins = Math.round(diffMs / (60 * 1000));
              if (diffMins > 0) {
                if (diffMins <= 60) {
                  return `Espera en la parada: ${puntoAbordaje}, tiempo aproximado de llegada: ${diffMins} min`;
                } else {
                  let stopHours = stopArrivalDate.getHours();
                  const stopMins = stopArrivalDate.getMinutes();
                  const stopAmpm = stopHours >= 12 ? 'pm' : 'am';
                  stopHours = stopHours % 12;
                  stopHours = stopHours ? stopHours : 12;
                  const stopMinsStr = stopMins < 10 ? '0' + stopMins : stopMins;
                  return `Espera en la parada: ${puntoAbordaje}, hora aprox. de recogida: ${stopHours}:${stopMinsStr} ${stopAmpm}`;
                }
              } else {
                return `Espera en la parada: ${puntoAbordaje}, el vehículo llegará en breves momentos`;
              }
            }
          } catch (e) {
            console.error('Error parsing date for stop', e);
          }
        }
        return `Espera en la parada: ${puntoAbordaje}, tiempo aproximado de llegada: 15 min`;
      }
    } else {
      // During trip (en ruta)
      if (isAbordo) {
        return `Llegada al destino a las ${horaLlegadaStr} (según la hora de llegada aproximada)`;
      } else {
        return `Espera en la parada: ${puntoAbordaje}, tiempo aproximado de llegada del vehículo: 10 min`;
      }
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  toggleTicketModal() {
    this.isTicketModalOpen = !this.isTicketModalOpen;
    console.log('[Tracking] Ticket Modal toggled:', this.isTicketModalOpen);
  }

  getPIN(): string {
    if (!this.viajeActual) return '0000';
    if (this.viajeActual.isCompartido) {
      return this.viajeActual.pin_abordaje;
    }
    if (this.viajeActual.qr_hash) {
      return this.viajeActual.qr_hash.slice(-4).toUpperCase();
    }
    // Fallback: usar los últimos 4 dígitos del ID formateados
    const idStr = (this.viajeActual.viaje_id || this.viajeActual.id || 0).toString().padStart(4, '0');
    return idStr.slice(-4);
  }

  showToast(msg: string) {
    this.toast = msg;
    setTimeout(() => this.toast = null, 6000);
  }

  enviarCalificacion() {
    if (!this.viajeActual || this.rating === 0) return;
    
    const datos = {
      viaje_id: this.viajeActual.viaje_id || this.viajeActual.id,
      cliente_id: this.usuario.id,
      estrellas: this.rating,
      comentario: this.comentario
    };

    this.clienteService.calificarViaje(datos).subscribe({
      next: () => {
        this.showToast('¡Gracias por tu calificación!');
        this.showRatingModal = false;
        this.cargarViajes(); // Ahora sí movemos al historial
      },
      error: () => {
        this.showToast('Error al enviar calificación');
        this.showRatingModal = false;
        this.cargarViajes();
      }
    });
  }

  omitirCalificacion() {
    this.showRatingModal = false;
    this.cargarViajes();
  }

  cancelarViaje() {
    this.showCancelModal = true;
  }

  confirmarCancelacion() {
    if (!this.viajeActual) return;
    const viajeId = this.viajeActual.viaje_id || this.viajeActual.id;

    this.clienteService.cancelarViaje(viajeId).subscribe({
      next: () => {
        this.showToast('Viaje cancelado con éxito.');
        
        // Notify driver if assigned
        if (this.viajeActual.chofer_id) {
          this.socketService.emit('cancelar_viaje', {
            viaje_id: viajeId,
            motivo: 'Cancelado por el cliente'
          });
        }

        this.showCancelModal = false;
        this.viajeActual = null;
        setTimeout(() => this.cargarViajes(), 2000);
      },
      error: (err) => {
        this.showToast(err.error?.error || 'Error al cancelar viaje');
        this.showCancelModal = false;
      }
    });
  }
}
