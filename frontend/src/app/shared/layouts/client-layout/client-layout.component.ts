import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ClientNavbarComponent } from '../../components/client-navbar/client-navbar.component';
import { AuthModalComponent } from '../../../features/auth/auth-modal/auth-modal.component';

@Component({
  selector: 'app-client-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ClientNavbarComponent, AuthModalComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col">
      <!-- Navbar global para cliente -->
      <app-client-navbar (onLoginRequest)="showAuthModal = true"></app-client-navbar>

      <!-- Espaciador para el navbar desktop (header fijo de 80px) -->
      <div class="hidden md:block h-20 w-full"></div>

      <!-- Contenido principal -->
      <main class="flex-1 pb-24 md:pb-8">
        <router-outlet></router-outlet>
      </main>

      <!-- Modal de Autenticación Global -->
      <app-auth-modal 
        *ngIf="showAuthModal" 
        (onClose)="showAuthModal = false" 
        (onSuccess)="handleAuthSuccess()">
      </app-auth-modal>
    </div>
  `
})
export class ClientLayoutComponent {
  showAuthModal = false;

  handleAuthSuccess() {
    this.showAuthModal = false;
    // Recargar la página o emitir evento para que el navbar se actualice
    window.location.reload();
  }
}
