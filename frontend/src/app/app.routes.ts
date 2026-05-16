import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [

  // ── RUTAS PÚBLICAS (con navbar, sin auth) ────────────────────────────────
  {
    path: '',
    loadComponent: () => import('./shared/layouts/public-layout/public-layout.component').then(m => m.PublicLayoutComponent),
    children: [
      // Landing page — siempre accesible, sin guard
      {
        path: '',
        pathMatch: 'full',
        loadComponent: () => import('./features/landing/landing.component').then(m => m.LandingComponent)
      },
      // Rastreo público
      {
        path: 'rastreo',
        loadComponent: () => import('./features/rastreo/rastreo.component').then(m => m.RastreoComponent)
      },
      // Servicios
      {
        path: 'servicios',
        loadComponent: () => import('./features/servicios/servicios.component').then(m => m.ServiciosComponent)
      },
      // Contacto
      {
        path: 'contacto',
        loadComponent: () => import('./features/contacto/contacto.component').then(m => m.ContactoComponent)
      }
    ]
  },

  // ── DASHBOARD CLIENTE (con layout, navbar + sidebar móvil) ────────────────
  {
    path: 'cliente',
    loadComponent: () => import('./shared/layouts/client-layout/client-layout.component').then(m => m.ClientLayoutComponent),
    children: [
      { path: 'cotizar', loadComponent: () => import('./features/cliente/cotizador/cotizador.component').then(m => m.CotizadorComponent) },
      { path: 'mis-viajes', loadComponent: () => import('./features/cliente/mis-viajes/mis-viajes.component').then(m => m.MisViajesComponent), canActivate: [authGuard] },
      { path: 'en-curso', loadComponent: () => import('./features/cliente/tracking-viaje/tracking-viaje.component').then(m => m.TrackingViajeComponent), canActivate: [authGuard] },
      { path: 'mensajes', loadComponent: () => import('./features/cliente/tracking-viaje/tracking-viaje.component').then(m => m.TrackingViajeComponent), canActivate: [authGuard] },
      { path: 'perfil', loadComponent: () => import('./features/cliente/perfil/perfil.component').then(m => m.PerfilComponent), canActivate: [authGuard] },
      { path: 'reserva', loadComponent: () => import('./features/cliente/reserva-pago/reserva-pago.component').then(m => m.ReservaPagoComponent) },
      { path: '', redirectTo: 'cotizar', pathMatch: 'full' }
    ]
  },

  // ── DASHBOARD CHOFER (protegido por RoleGuard) ────────────────────────────
  {
    path: 'chofer',
    loadComponent: () => import('./shared/layouts/chofer-layout/chofer-layout.component').then(m => m.ChoferLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'chofer' },
    children: [
      { path: 'dashboard', loadComponent: () => import('./features/chofer/dashboard-chofer/dashboard-chofer.component').then(m => m.DashboardChoferComponent) },
      { path: 'disponible', loadComponent: () => import('./features/chofer/solicitudes/solicitudes.component').then(m => m.SolicitudesComponent) },
      { path: 'ruta', loadComponent: () => import('./features/chofer/hoja-ruta/hoja-ruta.component').then(m => m.HojaRutaComponent) },
      { path: 'en-curso', loadComponent: () => import('./features/chofer/operacion-viaje/operacion-viaje.component').then(m => m.OperacionViajeComponent) },
      { path: 'vehiculo', loadComponent: () => import('./features/chofer/vehiculo/vehiculo.component').then(m => m.VehiculoComponent) },
      { path: 'perfil', loadComponent: () => import('./features/cliente/perfil/perfil.component').then(m => m.PerfilComponent) },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  },

  // ── DASHBOARD ADMIN (protegido por RoleGuard) ─────────────────────────────
  {
    path: 'admin',
    loadComponent: () => import('./shared/layouts/admin-layout/admin-layout.component').then(m => m.AdminLayoutComponent),
    canActivate: [authGuard, roleGuard],
    data: { role: 'admin' },
    children: [
      { path: 'pagos', loadComponent: () => import('./features/admin/validacion-pagos/validacion-pagos.component').then(m => m.ValidacionPagosComponent) },
      { path: 'mensajeria', loadComponent: () => import('./features/admin/mensajeria/mensajeria.component').then(m => m.MensajeriaComponent) },
      { path: 'monitor', loadComponent: () => import('./features/admin/monitor-flota/monitor-flota.component').then(m => m.MonitorFlotaComponent) },
      { path: 'vehiculos', loadComponent: () => import('./features/admin/gestion-vehiculos/gestion-vehiculos.component').then(m => m.GestionVehiculosComponent) },
      { path: 'usuarios', loadComponent: () => import('./features/admin/usuarios/usuarios.component').then(m => m.UsuariosComponent) },
      { path: 'perfil', loadComponent: () => import('./features/cliente/perfil/perfil.component').then(m => m.PerfilComponent) },
      { path: '', redirectTo: 'monitor', pathMatch: 'full' }
    ]
  }
];
