import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { ClientNavbarComponent } from '../../components/client-navbar/client-navbar.component';
import { AdminNavComponent } from '../../components/admin-nav/admin-nav.component';
import { ChoferNavbarComponent } from '../../components/chofer-navbar/chofer-navbar.component';
import { AuthModalComponent } from '../../../features/auth/auth-modal/auth-modal.component';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-public-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ClientNavbarComponent, AdminNavComponent, ChoferNavbarComponent, AuthModalComponent],
  template: `
    <!-- Caso Cliente o Público -->
    <app-client-navbar *ngIf="isPublicOrCliente" (onLoginRequest)="showAuthModal = true"></app-client-navbar>

    <!-- Caso Admin -->
    <div *ngIf="isAdmin" class="flex h-screen bg-gray-50 font-sans overflow-hidden">
      <app-admin-nav [isSidebarOpen]="isSidebarOpen" (toggleSidebar)="isSidebarOpen = !isSidebarOpen"></app-admin-nav>
      <div class="flex-1 flex flex-col min-w-0">
        <header class="h-20 bg-white border-b border-gray-100 flex items-center px-8 shrink-0">
          <h2 class="text-xl font-black text-slate-900">Admin<span class="text-blue-600">Console</span></h2>
        </header>
        <main class="flex-1 overflow-y-auto pb-24 md:pb-0">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>

    <!-- Caso Chofer -->
    <div *ngIf="isChofer" class="min-h-screen bg-gray-50 flex flex-col font-sans">
      <app-chofer-navbar></app-chofer-navbar>
      <div class="hidden md:block h-20 w-full"></div>
      <main class="flex-1 pb-24 md:pb-0 overflow-y-auto">
        <router-outlet></router-outlet>
      </main>
    </div>

    <!-- Contenido para Cliente/Público (fuera del flex-col de admin/chofer) -->
    <router-outlet *ngIf="isPublicOrCliente"></router-outlet>

    <!-- Modal de Autenticación Global -->
    <app-auth-modal
      *ngIf="showAuthModal"
      [isLogin]="authModalIsLogin"
      [initialRol]="authModalRol"
      (onClose)="showAuthModal = false"
      (onSuccess)="handleAuthSuccess()">
    </app-auth-modal>
  `
})
export class PublicLayoutComponent implements OnInit, OnDestroy {
  showAuthModal = false;
  authModalIsLogin = true;
  authModalRol = 'cliente';
  isSidebarOpen = true;
  private authSub: Subscription;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    this.authSub = this.authService.authModal$.subscribe((options) => {
      this.authModalIsLogin = options?.isLogin !== false;
      this.authModalRol = options?.rol || 'cliente';
      this.showAuthModal = true;
    });
  }

  ngOnInit() {
    this.checkAndRedirect();
  }

  private checkAndRedirect() {
    const usuario = this.authService.getUsuario();
    if (usuario) {
      if (usuario.rol === 'admin') {
        this.router.navigate(['/admin/monitor']);
      } else if (usuario.rol === 'chofer') {
        this.router.navigate(['/chofer/dashboard']);
      }
    }
  }

  get isAdmin(): boolean {
    return this.authService.getUsuario()?.rol === 'admin';
  }

  get isChofer(): boolean {
    return this.authService.getUsuario()?.rol === 'chofer';
  }

  get isPublicOrCliente(): boolean {
    const rol = this.authService.getUsuario()?.rol;
    return !rol || rol === 'cliente';
  }

  ngOnDestroy() {
    if (this.authSub) this.authSub.unsubscribe();
  }

  handleAuthSuccess() {
    this.showAuthModal = false;
    const rol = this.authService.getRol();
    this.authService.redirectByRole(rol || 'cliente');
  }
}
