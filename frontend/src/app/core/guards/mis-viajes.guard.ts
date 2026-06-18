import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ClienteService } from '../services/cliente.service';
import { map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

export const misViajesGuard: CanActivateFn = (route, state) => {
  const clienteService = inject(ClienteService);
  const router = inject(Router);

  return clienteService.getMisViajes().pipe(
    map(viajes => {
      if (viajes && viajes.length > 0) {
        const ultimoViaje = viajes[0];
        const isEncomienda = (ultimoViaje.tipo_servicio || '').toLowerCase() === 'encomienda';
        if (ultimoViaje.estado_logistico !== 'finalizado' && ultimoViaje.estado_logistico !== 'cancelado') {
          const dest = isEncomienda ? '/cliente/paquetes' : '/cliente/en-curso';
          router.navigate([dest]);
          return false;
        }
      }
      router.navigate(['/cliente/cotizar']);
      return false;
    }),
    catchError((err) => {
      console.error('Error checking active trip in misViajesGuard:', err);
      router.navigate(['/cliente/cotizar']);
      return of(false);
    })
  );
};
