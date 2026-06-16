import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './auth-modal.component.html'
})
export class AuthModalComponent implements OnInit {
  @Output() onSuccess = new EventEmitter<void>();
  @Output() onClose = new EventEmitter<void>();

  @Input() isLogin = true;
  @Input() initialRol = 'cliente';

  formData = {
    correo: '',
    password: '',
    nombre: '',
    telefono: '',
    cedula: '',
    rol: 'cliente'
  };

  ngOnInit() {
    this.formData.rol = this.initialRol;
  }
  
  @Input() error = '';
  loading = false;

  constructor(private authService: AuthService) {}

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.error = '';
  }

  closeModal() {
    this.onClose.emit();
  }

  onSubmit() {
    if (!this.formData.correo || !this.formData.password) {
      this.error = 'Por favor llena los campos requeridos.';
      return;
    }
    
    this.loading = true;
    this.error = '';

    if (this.isLogin) {
      this.authService.login(this.formData).subscribe({
        next: () => {
          this.loading = false;
          this.onSuccess.emit();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.error || 'Error al iniciar sesión';
        }
      });
    } else {
      if (!this.formData.nombre) {
        this.error = 'El nombre es obligatorio para registrarse.';
        this.loading = false;
        return;
      }
      this.authService.register(this.formData).subscribe({
        next: () => {
          this.loading = false;
          this.onSuccess.emit();
        },
        error: (err) => {
          this.loading = false;
          this.error = err.error?.error || 'Error al registrarse';
        }
      });
    }
  }
}
