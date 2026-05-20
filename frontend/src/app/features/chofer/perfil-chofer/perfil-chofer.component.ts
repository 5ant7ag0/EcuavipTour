import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ChoferService } from '../../../core/services/chofer.service';
import { Router } from '@angular/router';
import { VehiculoComponent } from '../vehiculo/vehiculo.component';

@Component({
  selector: 'app-perfil-chofer',
  standalone: true,
  imports: [CommonModule, FormsModule, VehiculoComponent],
  templateUrl: './perfil-chofer.component.html',
  styleUrl: './perfil-chofer.component.css'
})
export class PerfilChoferComponent implements OnInit {
  usuario: any;
  isLoading = false;
  isEditing = false;
  showPasswordForm = false;
  successMsg: string | null = null;
  errorMsg: string | null = null;

  activeTab: 'perfil' | 'vehiculo' = 'perfil';

  selectTab(tab: 'perfil' | 'vehiculo') {
    this.activeTab = tab;
    this.successMsg = null;
    this.errorMsg = null;
    this.isEditing = false;
  }

  // Form Fields
  nombre: string = '';
  apellido: string = '';
  telefono: string = '';
  correo: string = '';
  cedula: string = '';

  // Password Fields
  passwordActual: string = '';
  passwordNueva: string = '';

  // Driver License & Vehicle state
  vehiculoEstado: string = 'pendiente';
  licenciaTipo: string = 'Tipo E - Profesional';
  licenciaVigencia: string = 'Dic 2029';

  constructor(
    private authService: AuthService,
    private choferService: ChoferService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarUsuario();
    this.cargarVehiculo();
  }

  cargarUsuario() {
    this.usuario = this.authService.getUsuario();
    if (!this.usuario) {
      this.router.navigate(['/']);
      return;
    }

    // Split name and surname
    const partes = (this.usuario.nombre || '').split(' ');
    this.nombre = partes[0] || '';
    this.apellido = partes.slice(1).join(' ') || '';

    this.telefono = this.usuario.telefono || '';
    this.correo = this.usuario.correo || '';
    this.cedula = this.usuario.cedula || '';
  }

  cargarVehiculo() {
    this.choferService.getVehiculo().subscribe({
      next: (v) => {
        if (v) {
          this.vehiculoEstado = v.estado || 'pendiente';
          if (v.licencia_tipo) {
            this.licenciaTipo = v.licencia_tipo;
          }
          if (v.licencia_vigencia) {
            this.licenciaVigencia = v.licencia_vigencia;
          }
        }
      },
      error: (err) => {
        console.error('Error al cargar vehículo en perfil:', err);
      }
    });
  }

  startEditing() {
    this.isEditing = true;
    this.showPasswordForm = false;
    this.successMsg = null;
    this.errorMsg = null;
    this.passwordActual = '';
    this.passwordNueva = '';
  }

  cancelEditing() {
    this.isEditing = false;
    this.showPasswordForm = false;
    this.cargarUsuario();
    this.cargarVehiculo();
  }

  saveChanges() {
    this.isLoading = true;
    this.successMsg = null;
    this.errorMsg = null;

    // Join name and surname
    const nombreCompleto = `${this.nombre.trim()} ${this.apellido.trim()}`.trim();

    const payload: any = {
      nombre: nombreCompleto,
      telefono: this.telefono,
      cedula: this.cedula,
      correo: this.correo
    };

    if (this.passwordNueva) {
      payload.password = this.passwordNueva;
    }

    this.authService.updateProfile(payload).subscribe({
      next: (res: any) => {
        this.usuario = res.usuario;
        this.authService.updateProfile(res.usuario); // refresh localStorage user state
        
        // Save license info in backend database if still editable
        if (this.vehiculoEstado !== 'activo') {
          const vFormData = new FormData();
          vFormData.append('licencia_tipo', this.licenciaTipo);
          vFormData.append('licencia_vigencia', this.licenciaVigencia);
          this.choferService.updateVehiculo(vFormData).subscribe({
            next: (vRes: any) => {
              console.log('Licencia guardada en BDD:', vRes);
              this.cargarVehiculo();
            },
            error: (vErr) => {
              console.error('Error al guardar licencia en BDD:', vErr);
            }
          });
        }

        // Split name back
        const partes = (this.usuario.nombre || '').split(' ');
        this.nombre = partes[0] || '';
        this.apellido = partes.slice(1).join(' ') || '';

        this.isLoading = false;
        this.isEditing = false;
        this.showPasswordForm = false;
        this.successMsg = '¡Tu perfil ha sido actualizado con éxito!';
        
        // Reset password fields
        this.passwordActual = '';
        this.passwordNueva = '';
        
        setTimeout(() => this.successMsg = null, 4000);
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        this.errorMsg = 'Error al actualizar el perfil. Por favor, reintenta.';
        setTimeout(() => this.errorMsg = null, 4000);
      }
    });
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isLoading = true;
      this.successMsg = null;
      this.errorMsg = null;
      
      this.authService.uploadAvatar(file).subscribe({
        next: (res: any) => {
          this.usuario = res.usuario;
          this.isLoading = false;
          this.successMsg = 'Foto de perfil actualizada correctamente.';
          setTimeout(() => this.successMsg = null, 4000);
        },
        error: (err: any) => {
          console.error(err);
          this.isLoading = false;
          this.errorMsg = 'Error al subir la imagen. Intente de nuevo.';
          setTimeout(() => this.errorMsg = null, 4000);
        }
      });
    }
  }

  logout() {
    this.authService.logout();
    window.location.reload();
  }
}
