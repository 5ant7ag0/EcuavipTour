import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, tap, map } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AuthService } from './auth.service';
import { ChatService } from './chat.service';
import { SoapService } from './soap.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private namespace = 'http://ecuaviptour.com/soap/admin';
  private pendingCountSource = new BehaviorSubject<number>(0);
  pendingCount$ = this.pendingCountSource.asObservable();

  private unreadCountSource = new BehaviorSubject<number>(0);
  unreadCount$ = this.unreadCountSource.asObservable();

  private pendingVehiclesCountSource = new BehaviorSubject<number>(0);
  pendingVehiclesCount$ = this.pendingVehiclesCountSource.asObservable();

  get pendingCountValue(): number {
    return this.pendingCountSource.value;
  }

  get unreadCountValue(): number {
    return this.unreadCountSource.value;
  }

  get pendingVehiclesCountValue(): number {
    return this.pendingVehiclesCountSource.value;
  }

  constructor(
    private soapService: SoapService, 
    private authService: AuthService,
    private chatService: ChatService,
    private http: HttpClient
  ) { }

  getPagos(estado: string = 'pendientes'): Observable<any[]> {
    return this.soapService.post(
      this.namespace,
      'getPagosRequest',
      { estado },
      this.authService.getToken() || undefined
    ).pipe(
      map(res => {
        const pagos = (res && res.pagos) || [];
        return pagos.map((p: any) => ({
          pago_id: p.id,
          viaje_id: p.viaje_id,
          cliente_nombre: p.cliente_nombre,
          cliente_cedula: p.cliente_cedula,
          monto: p.monto_total,
          comprobante_url: p.comprobante_url,
          fecha: p.fecha_subida,
          estado_pago: p.estado,
          origen: p.origen,
          destino: p.destino,
          tipo_servicio: p.tipo_servicio || p.tipoServicio || ''
        }));
      }),
      tap(pagos => {
        if (estado === 'pendientes') {
          this.pendingCountSource.next(pagos.length);
        }
      })
    );
  }

  getInbox(): Observable<any[]> {
    return this.soapService.post(
      this.namespace,
      'getInboxRequest',
      {},
      this.authService.getToken() || undefined
    ).pipe(
      map(res => {
        const chats = (res && res.chats) || [];
        return chats.map((c: any) => {
          let msgStr = c.ultimo_mensaje || '';
          if (msgStr.startsWith('SISTEMA_RESOLUCION:')) {
            msgStr = msgStr.replace('SISTEMA_RESOLUCION:', '').replace('@', '').trim();
          }
          return {
            cliente_id: c.cliente_id,
            cliente_nombre: c.cliente_nombre,
            ultimo_mensaje: msgStr,
            fecha_ultimo_mensaje: c.fecha,
            unread: c.unread,
            foto_perfil_url: c.cliente_foto_url,
            soporte_asignado_nombre: c.asignado_a,
            soporte_asignado_id: c.soporte_asignado_id || c.soporteAsignadoId || null,
            categoria: c.categoria,
            estado: c.resuelto ? 'resuelto' : 'abierto'
          };
        });
      }),
      tap(inbox => {
        const chatsConUnread = inbox.filter((c: any) => (c.unread || 0) > 0).length;
        this.unreadCountSource.next(chatsConUnread);
      })
    );
  }

  updatePendingCount(count: number) {
    this.pendingCountSource.next(count);
  }

  updateUnreadCount(count: number) {
    this.unreadCountSource.next(count);
  }

  updatePendingVehiclesCount(count: number) {
    this.pendingVehiclesCountSource.next(count);
  }

  markAsRead(viajeId: number): Observable<any> {
    return this.chatService.markAsRead(viajeId);
  }

  aprobarPago(pagoId: number): Observable<any> {
    return this.soapService.post(
      this.namespace,
      'aprobarPagoRequest',
      { pago_id: pagoId },
      this.authService.getToken() || undefined
    );
  }

  rechazarPago(pagoId: number, motivo: string): Observable<any> {
    return this.soapService.post(
      this.namespace,
      'rechazarPagoRequest',
      { pago_id: pagoId, motivo },
      this.authService.getToken() || undefined
    );
  }

  getUsuarios(rol?: string, search?: string, activo?: string, sort?: string, start_date?: string, end_date?: string, fecha_viaje?: string, duracion_minutos?: number): Observable<any[]> {
    return this.soapService.post(
      this.namespace,
      'getUsuariosRequest',
      {
        rol,
        search,
        activo,
        sort,
        start_date,
        end_date,
        fecha_viaje,
        duracion_minutos
      },
      this.authService.getToken() || undefined
    ).pipe(
      map(res => {
        const list = (res && res.usuarios) || [];
        return list.map((u: any) => ({
          id: u.id,
          nombre: u.nombre,
          correo: u.correo,
          telefono: u.telefono,
          cedula: u.cedula,
          rol: u.rol,
          activo: u.activo,
          fecha_registro: u.fecha_registro,
          foto_perfil_url: u.foto_perfil_url,
          viajes_completados: u.viajes_completados !== undefined ? u.viajes_completados : (u.viajesCompletados !== undefined ? u.viajesCompletados : 0),
          promedio_calificacion: u.promedio_calificacion !== undefined ? u.promedio_calificacion : (u.promedioCalificacion !== undefined ? u.promedioCalificacion : 0)
        }));
      })
    );
  }

  toggleUsuarioStatus(usuarioId: number): Observable<any> {
    return this.soapService.post(
      this.namespace,
      'toggleUsuarioStatusRequest',
      { usuario_id: usuarioId },
      this.authService.getToken() || undefined
    );
  }

  updateUsuarioAdmin(usuarioId: number, data: any): Observable<any> {
    return this.soapService.post(
      this.namespace,
      'updateUsuarioAdminRequest',
      {
        usuario_id: usuarioId,
        nombre: data.nombre,
        telefono: data.telefono,
        cedula: data.cedula,
        rol: data.rol,
        correo: data.correo,
        password: data.password
      },
      this.authService.getToken() || undefined
    ).pipe(
      tap((res: any) => {
        const currentUser = this.authService.getUsuario();
        if (currentUser && currentUser.id === usuarioId && res.usuario) {
          res.usuario.fotoPerfilUrl = currentUser.fotoPerfilUrl || currentUser.foto_perfil_url;
          res.usuario.foto_perfil_url = currentUser.fotoPerfilUrl || currentUser.foto_perfil_url;
          this.authService.updateCurrentUserLocal(res.usuario);
        }
      })
    );
  }

  updateUsuarioPhotoAdmin(usuarioId: number, file: File): Observable<any> {
    return new Observable(observer => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64Data = reader.result as string;
        this.soapService.post(
          this.namespace,
          'updateUsuarioPhotoAdminRequest',
          {
            usuario_id: usuarioId,
            file_base64: base64Data,
            filename: file.name
          },
          this.authService.getToken() || undefined
        ).subscribe({
          next: (res: any) => {
            const currentUser = this.authService.getUsuario();
            if (currentUser && currentUser.id === usuarioId) {
              const newPhoto = res.fotoPerfilUrl || res.foto_perfil_url;
              if (newPhoto) {
                currentUser.fotoPerfilUrl = newPhoto;
                currentUser.foto_perfil_url = newPhoto;
                this.authService.updateCurrentUserLocal(currentUser);
              }
            }
            observer.next(res);
            observer.complete();
          },
          error: (err) => observer.error(err)
        });
      };
      reader.onerror = (error) => observer.error(error);
    });
  }

  getStats(period: string = 'month', startDate?: string, endDate?: string): Observable<any> {
    return this.soapService.post(
      this.namespace,
      'getStatsRequest',
      {
        period,
        start_date: startDate,
        end_date: endDate
      },
      this.authService.getToken() || undefined
    ).pipe(
      map(res => {
        const jsonStr = res ? (res.stats_json || res.statsJson) : null;
        return JSON.parse(jsonStr || '{}');
      })
    );
  }

  descargarReporteIngresos(period: string, startDate?: string, endDate?: string): Observable<Blob> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    let url = `http://localhost:5001/api/admin/reportes/ingresos?periodo=${period}`;
    if (startDate) url += `&fecha_inicio=${startDate}`;
    if (endDate) url += `&fecha_fin=${endDate}`;
    return this.http.get(url, { headers, responseType: 'blob' });
  }

  descargarReporteGastos(period: string, startDate?: string, endDate?: string): Observable<Blob> {
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });
    let url = `http://localhost:5001/api/admin/reportes/gastos?periodo=${period}`;
    if (startDate) url += `&fecha_inicio=${startDate}`;
    if (endDate) url += `&fecha_fin=${endDate}`;
    return this.http.get(url, { headers, responseType: 'blob' });
  }

  getVehiculos(estado?: string, search?: string, marca?: string, modelo?: string, anio?: string, tipo?: string, asientos?: string): Observable<any[]> {
    return this.soapService.post(
      this.namespace,
      'getVehiculosRequest',
      {
        estado,
        search,
        marca,
        modelo,
        anio,
        tipo,
        asientos
      },
      this.authService.getToken() || undefined
    ).pipe(
      map(res => {
        const list = (res && res.vehiculos) || [];
        return list.map((v: any) => ({
          id: v.id,
          placa: v.placa,
          marca: v.marca,
          modelo: v.modelo,
          anio: v.anio,
          tipo_vehiculo: v.tipo,
          capacidad_max: v.capacidad_max,
          color: v.color,
          estado: v.estado,
          foto_auto_url: v.foto_auto_url,
          foto_matricula_url: v.foto_matricula_url,
          foto_licencia_url: v.foto_licencia_url,
          chofer: {
            id: v.chofer_id,
            nombre: v.chofer_nombre,
            telefono: v.chofer_telefono,
            correo: v.chofer_correo
          }
        }));
      }),
      tap(vehiculos => {
        if (estado === 'pendiente') {
          this.pendingVehiclesCountSource.next(vehiculos.length);
        }
      })
    );
  }

  cambiarEstadoVehiculo(vehiculoId: number, nuevoEstado: string): Observable<any> {
    return this.soapService.post(
      this.namespace,
      'cambiarEstadoVehiculoRequest',
      {
        vehiculo_id: vehicleIdFix(vehiculoId),
        estado: nuevoEstado
      },
      this.authService.getToken() || undefined
    );
  }
}

function vehicleIdFix(id: any): number {
  return typeof id === 'number' ? id : Number(id);
}
