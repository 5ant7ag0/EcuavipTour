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
        if (ultimoViaje.estado_logistico !== 'finalizado' && ultimoViaje.estado_logistico !== 'cancelado') {
          // Check if it's pending payment to let en-curso redirect, or let's go straight to en-curso
          router.navigate(['/cliente/en-curso']);
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
