import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">

      <!-- Alertas de estado -->
      <div *ngIf="successMsg" class="mb-6 bg-emerald-50 text-emerald-800 p-4 rounded-2xl border border-emerald-200 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="text-emerald-500 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
        <p class="text-xs font-bold uppercase tracking-wider">{{ successMsg }}</p>
      </div>

      <div *ngIf="errorMsg" class="mb-6 bg-red-50 text-red-800 p-4 rounded-2xl border border-red-200 flex items-center gap-3">
        <svg xmlns="http://www.w3.org/2000/svg" class="text-red-500 shrink-0" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <p class="text-xs font-bold uppercase tracking-wider">{{ errorMsg }}</p>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        <!-- TARJETA IZQUIERDA: RESUMEN DE USUARIO -->
        <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-between min-h-[420px] relative overflow-hidden">
          <!-- Glow superior decorativo -->
          <div class="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl"></div>
          
          <!-- Contenedor de Foto (UI Premium Círculo Perfecto) -->
          <div class="flex flex-col items-center w-full mt-4">
            <div class="relative w-36 h-36 rounded-full border-4 border-slate-100 shadow-md group shrink-0 aspect-square bg-slate-50 flex items-center justify-center overflow-hidden">
              <img 
                *ngIf="previewUrl || (usuario?.foto_perfil_url || usuario?.fotoPerfilUrl)" 
                [src]="previewUrl || ('http://localhost:5001/' + (usuario.foto_perfil_url || usuario.fotoPerfilUrl))" 
                class="w-full h-full object-cover rounded-full"
                alt="Foto de Perfil">
              <span *ngIf="!previewUrl && !(usuario?.foto_perfil_url || usuario?.fotoPerfilUrl)" class="text-3xl font-black text-blue-600 select-none">
                {{ nombre.charAt(0) || 'U' }}
              </span>
              
              <!-- Botón flotante de cámara (Solo se activa al dar en editar) -->
              <div 
                *ngIf="isEditing"
                (click)="fileInput.click()"
                class="absolute bottom-1 right-1 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center cursor-pointer shadow-md transition-all scale-100 active:scale-95 group-hover:scale-105 duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            </div>
            <!-- Input de archivo oculto -->
            <input #fileInput type="file" (change)="onFileSelected($event)" accept="image/*" class="hidden">

            <!-- Nombre e Indicador de Estado -->
            <h2 class="text-xl font-black text-slate-800 mt-6 tracking-tight text-center">{{ usuario?.nombre }}</h2>
            
            <!-- Badge de Estado según el Rol -->
            <div 
              [ngClass]="usuario?.rol === 'admin' ? 'bg-amber-50 text-amber-700 border-amber-100/60' : 'bg-blue-50 text-blue-700 border-blue-100/60'"
              class="mt-2.5 px-3.5 py-1.5 rounded-full text-xs font-black uppercase tracking-wider inline-flex items-center gap-1.5 border">
              <span 
                [ngClass]="usuario?.rol === 'admin' ? 'bg-amber-500' : 'bg-blue-500'"
                class="w-2 h-2 rounded-full animate-pulse"></span>
              {{ usuario?.rol === 'admin' ? 'Administrador' : 'Cliente VIP' }}
            </div>
          </div>
        </div>

        <!-- TARJETA DERECHA: FORMULARIO DE DETALLES -->
        <div class="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
          <div>
            <h3 class="text-lg font-black text-slate-900 tracking-tight pb-4 border-b border-slate-100 mb-6">Información Personal & Acceso</h3>
            
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <!-- Campo: Cédula (Siempre Solo Lectura) -->
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Número de Cédula</label>
                <input 
                  [value]="cedula || 'No Registrada'" 
                  type="text" 
                  readonly 
                  class="w-full bg-slate-50 border border-slate-200/50 rounded-2xl px-5 py-3.5 font-bold text-slate-400 cursor-not-allowed focus:outline-none"
                  title="Este campo está bloqueado por seguridad.">
              </div>

              <!-- Campo: Correo -->
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Correo Electrónico</label>
                <input 
                  [(ngModel)]="correo" 
                  [disabled]="!isEditing"
                  type="email" 
                  [ngClass]="isEditing ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100' : 'bg-slate-50 border-slate-200/50 text-slate-500 cursor-default select-none'"
                  class="w-full border rounded-2xl px-5 py-3.5 font-bold transition-all outline-none">
              </div>

              <!-- Campo: Nombre -->
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Nombre</label>
                <input 
                  [(ngModel)]="nombre" 
                  [disabled]="!isEditing"
                  type="text" 
                  [ngClass]="isEditing ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100' : 'bg-slate-50 border-slate-200/50 text-slate-500 cursor-default select-none'"
                  class="w-full border rounded-2xl px-5 py-3.5 font-bold transition-all outline-none">
              </div>

              <!-- Campo: Apellido -->
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Apellido</label>
                <input 
                  [(ngModel)]="apellido" 
                  [disabled]="!isEditing"
                  type="text" 
                  [ngClass]="isEditing ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100' : 'bg-slate-50 border-slate-200/50 text-slate-500 cursor-default select-none'"
                  class="w-full border rounded-2xl px-5 py-3.5 font-bold transition-all outline-none">
              </div>

              <!-- Campo: Teléfono -->
              <div class="space-y-2">
                <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Teléfono de Contacto</label>
                <input 
                  [(ngModel)]="telefono" 
                  [disabled]="!isEditing"
                  type="text" 
                  [ngClass]="isEditing ? 'bg-white border-slate-200 hover:border-slate-300 text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100' : 'bg-slate-50 border-slate-200/50 text-slate-500 cursor-default select-none'"
                  class="w-full border rounded-2xl px-5 py-3.5 font-bold transition-all outline-none">
              </div>
            </div>

            <!-- Bloque de Cambio de Contraseña (Solo en Modo Edición) -->
            <div *ngIf="isEditing">
              
              <!-- Botón de disparo si showPasswordForm es falso -->
              <div *ngIf="!showPasswordForm" class="mt-8 pt-8 border-t border-slate-100 flex justify-start">
                <button 
                  type="button"
                  (click)="showPasswordForm = true"
                  class="px-5 py-3.5 bg-slate-50 hover:bg-slate-100 text-blue-600 font-black rounded-2xl text-xs uppercase tracking-wider transition-all flex items-center gap-2 border border-slate-100 active:scale-95 duration-200">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                  Cambiar Contraseña
                </button>
              </div>

              <!-- Campos de contraseña si showPasswordForm es verdadero -->
              <div *ngIf="showPasswordForm" class="mt-8 pt-8 border-t border-slate-100 animate-fade-in">
                <div class="flex items-center justify-between mb-4">
                  <div class="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" class="text-blue-600" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    <h4 class="text-xs font-black text-slate-800 uppercase tracking-wider">Cambiar Contraseña de Acceso</h4>
                  </div>
                  <button 
                    type="button" 
                    (click)="showPasswordForm = false; passwordActual = ''; passwordNueva = ''"
                    class="text-xs font-black text-red-500 hover:text-red-700 transition-colors uppercase tracking-wider">
                    Cancelar Cambio
                  </button>
                </div>
                
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Contraseña Anterior</label>
                    <input 
                      [(ngModel)]="passwordActual" 
                      type="password" 
                      placeholder="Ingresar contraseña anterior"
                      class="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-2xl px-5 py-3.5 font-bold text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none">
                  </div>

                  <div class="space-y-2">
                    <label class="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block">Nueva Contraseña</label>
                    <input 
                      [(ngModel)]="passwordNueva" 
                      type="password" 
                      placeholder="Nueva contraseña deseada"
                      class="w-full bg-white border border-slate-200 hover:border-slate-300 rounded-2xl px-5 py-3.5 font-bold text-slate-800 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition-all outline-none">
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Footer de Acciones -->
          <div class="mt-10 pt-6 border-t border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p class="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
              {{ isEditing ? 'Ingresa tu clave anterior para aplicar los cambios de contraseña.' : 'Los datos de Cédula solo pueden ser modificados por un Admin.' }}
            </p>
            
            <!-- Estado de visualización: Botón Editar Perfil -->
            <button 
              *ngIf="!isEditing"
              (click)="startEditing()" 
              class="w-full sm:w-auto px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              Editar Perfil
            </button>

            <!-- Estado de edición: Cancelar y Guardar Cambios -->
            <div *ngIf="isEditing" class="w-full sm:w-auto flex flex-col sm:flex-row gap-3">
              <button 
                (click)="cancelEditing()" 
                [disabled]="isLoading" 
                class="px-8 py-4 bg-slate-100 hover:bg-slate-200 text-slate-600 font-black rounded-2xl text-xs uppercase tracking-wider transition-all disabled:opacity-50">
                Cancelar
              </button>
              
              <button 
                (click)="saveChanges()" 
                [disabled]="isLoading" 
                class="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-2xl shadow-lg shadow-blue-500/10 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2 text-xs uppercase tracking-wider">
                <svg *ngIf="isLoading" class="animate-spin text-white" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                {{ isLoading ? 'Guardando...' : 'Guardar Cambios' }}
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class PerfilComponent implements OnInit {
  usuario: any;
  isLoading = false;
  isEditing = false;
  showPasswordForm = false;
  successMsg: string | null = null;
  errorMsg: string | null = null;

  selectedFile: File | null = null;
  previewUrl: string | null = null;

  // Form Fields
  nombre: string = '';
  apellido: string = '';
  telefono: string = '';
  correo: string = '';
  cedula: string = '';

  // Password Fields
  passwordActual: string = '';
  passwordNueva: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.cargarUsuario();
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
    this.selectedFile = null;
    this.previewUrl = null;
    this.cargarUsuario();
  }

  saveChanges() {
    this.isLoading = true;
    this.successMsg = null;
    this.errorMsg = null;

    // Join name and surname
    const nombreCompleto = (this.nombre.trim() + ' ' + this.apellido.trim()).trim();

    const payload: any = {
      nombre: nombreCompleto,
      telefono: this.telefono,
      cedula: this.cedula,
      correo: this.correo
    };

    if (this.passwordNueva) {
      payload.password = this.passwordNueva;
    }

    const performUpdateProfile = () => {
      this.authService.updateProfile(payload).subscribe({
        next: (res: any) => {
          this.usuario = res.usuario;

          // Split name back
          const partes = (this.usuario.nombre || '').split(' ');
          this.nombre = partes[0] || '';
          this.apellido = partes.slice(1).join(' ') || '';

          this.isLoading = false;
          this.isEditing = false;
          this.showPasswordForm = false;
          this.selectedFile = null;
          this.previewUrl = null;
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
    };

    if (this.selectedFile) {
      this.authService.uploadAvatar(this.selectedFile).subscribe({
        next: (res: any) => {
          this.usuario = res.usuario;
          performUpdateProfile();
        },
        error: (err: any) => {
          console.error(err);
          this.isLoading = false;
          this.errorMsg = 'Error al subir la imagen de perfil.';
          setTimeout(() => this.errorMsg = null, 4000);
        }
      });
    } else {
      performUpdateProfile();
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;
      
      // Local preview using FileReader
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  logout() {
    this.authService.logout();
    window.location.reload();
  }
}
