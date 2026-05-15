import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SocketService } from '../../../core/services/socket.service';
import { ChoferNavbarComponent } from '../../components/chofer-navbar/chofer-navbar.component';

@Component({
  selector: 'app-chofer-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, ChoferNavbarComponent],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col font-sans">
      <!-- Navbar dedicado para chofer -->
      <app-chofer-navbar></app-chofer-navbar>

      <!-- Espaciador para Navbar Desktop -->
      <div class="hidden md:block h-20 w-full"></div>

      <!-- Main Content -->
      <main class="flex-1 pb-24 md:pb-8 overflow-y-auto">
        <router-outlet></router-outlet>
      </main>
    </div>
  `
})
export class ChoferLayoutComponent implements OnInit {
  usuario: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private socketService: SocketService
  ) {}

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    if (this.usuario?.rol !== 'chofer') {
      this.router.navigate(['/cliente']);
    }
    this.socketService.connectAndJoin();
  }

  logout() {
    this.authService.logout();
    this.socketService.disconnect();
    this.router.navigate(['/']);
  }
}
