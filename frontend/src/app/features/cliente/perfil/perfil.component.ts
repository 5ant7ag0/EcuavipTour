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
    <div class="max-w-2xl mx-auto px-4 pt-12 pb-24">
      <div class="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 relative overflow-hidden">
        <!-- Decoration -->
        <div class="absolute top-0 right-0 w-32 h-32 bg-ecuavip-blue/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
        
        <div class="flex flex-col items-center mb-10">
          <div class="relative group">
            <div class="w-28 h-28 rounded-full bg-ecuavip-blue/10 flex items-center justify-center text-ecuavip-blue text-4xl font-black mb-4 border-4 border-white shadow-sm overflow-hidden aspect-square">
              <img *ngIf="usuario?.foto_perfil_url" [src]="'http://localhost:5001/' + usuario.foto_perfil_url" class="w-full h-full object-cover rounded-full">
              <span *ngIf="!usuario?.foto_perfil_url">{{ usuario?.nombre?.charAt(0) || 'U' }}</span>
              
              <!-- Overlay de edición sobre la foto -->
              <div 
                *ngIf="isEditing"
                (click)="fileInput.click()"
                class="absolute inset-0 bg-ecuavip-blue/60 flex items-center justify-center text-white cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity rounded-full"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>
              </div>
            </div>
            
            <input #fileInput type="file" (change)="onFileSelected($event)" accept="image/*" class="hidden">
          </div>

          <h2 class="text-2xl font-black text-ecuavip-dark">{{ usuario?.nombre }}</h2>
          <p class="text-ecuavip-blue font-black uppercase tracking-widest text-[10px] mt-1">{{ usuario?.rol }} VIP</p>
        </div>

        <div *ngIf="!isEditing" class="space-y-6">
          <div class="bg-gray-50 p-6 rounded-3xl">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Nombre Completo</p>
            <p class="font-bold text-gray-900">{{ usuario?.nombre }}</p>
          </div>

          <div class="bg-gray-50 p-6 rounded-3xl">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Correo Electrónico</p>
            <p class="font-bold text-gray-900">{{ usuario?.correo }}</p>
          </div>

          <div class="bg-gray-50 p-6 rounded-3xl">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Teléfono de Contacto</p>
            <p class="font-bold text-gray-900">{{ usuario?.telefono || 'No registrado' }}</p>
          </div>

          <div class="bg-gray-50 p-6 rounded-3xl">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Número de Cédula</p>
            <p class="font-bold text-gray-900">{{ usuario?.cedula || 'No registrada' }}</p>
          </div>

          <div class="bg-gray-50 p-6 rounded-3xl">
            <p class="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Rol de Acceso</p>
            <p class="font-bold text-gray-900 capitalize">{{ usuario?.rol }}</p>
          </div>

          <div class="pt-6 space-y-3">
            <button (click)="startEditing()" class="w-full bg-ecuavip-blue text-white py-4 rounded-2xl font-black hover:bg-ecuavip-dark transition-all shadow-lg shadow-ecuavip-blue/20">
              Editar Perfil
            </button>
            <button (click)="logout()" class="w-full bg-red-50 text-red-500 py-4 rounded-2xl font-black hover:bg-red-100 transition-colors">
              Cerrar Sesión
            </button>
          </div>
        </div>

        <!-- MODO EDICION -->
        <div *ngIf="isEditing" class="space-y-5">
          <div class="space-y-2">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nombre Completo</label>
            <input [(ngModel)]="editForm.nombre" type="text" class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-ecuavip-blue transition-all">
          </div>

          <div class="space-y-2 opacity-60">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Correo (No editable)</label>
            <input [value]="usuario?.correo" type="email" disabled class="w-full bg-gray-100 border-none rounded-2xl px-6 py-4 font-bold text-gray-400 cursor-not-allowed">
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Teléfono</label>
            <input [(ngModel)]="editForm.telefono" type="text" class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-ecuavip-blue transition-all">
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Número de Cédula</label>
            <input [(ngModel)]="editForm.cedula" type="text" class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-ecuavip-blue transition-all">
          </div>

          <div class="space-y-2">
            <label class="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4">Nueva Contraseña (Opcional)</label>
            <input [(ngModel)]="editForm.password" type="password" placeholder="Dejar en blanco para no cambiar" class="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-bold text-gray-900 focus:ring-2 focus:ring-ecuavip-blue transition-all">
          </div>

          <div class="pt-6 grid grid-cols-2 gap-4">
            <button (click)="cancelEditing()" [disabled]="isLoading" class="bg-gray-100 text-gray-600 py-4 rounded-2xl font-black hover:bg-gray-200 transition-all disabled:opacity-50">
              Cancelar
            </button>
            <button (click)="saveChanges()" [disabled]="isLoading" class="bg-ecuavip-blue text-white py-4 rounded-2xl font-black hover:bg-ecuavip-dark transition-all shadow-lg shadow-ecuavip-blue/20 disabled:opacity-50 flex items-center justify-center gap-2">
              <svg *ngIf="isLoading" class="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
              {{ isLoading ? 'Guardando...' : 'Guardar' }}
            </button>
          </div>
        </div>
      </div>

      <div class="mt-8 text-center">
        <p class="text-gray-400 text-xs font-medium">Ecuavip Tour v2.4.0 • Logística de Confianza</p>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .bg-ecuavip-blue { background-color: #2563eb; }
    .text-ecuavip-blue { color: #2563eb; }
    .bg-ecuavip-blue\/5 { background-color: rgba(37, 99, 235, 0.05); }
    .bg-ecuavip-blue\/10 { background-color: rgba(37, 99, 235, 0.1); }
  `]
})
export class PerfilComponent implements OnInit {
  usuario: any;
  isEditing = false;
  isLoading = false;
  
  editForm = {
    nombre: '',
    telefono: '',
    cedula: '',
    password: ''
  };

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    this.usuario = this.authService.getUsuario();
    if (!this.usuario) {
      this.router.navigate(['/']);
    }
  }

  startEditing() {
    this.editForm.nombre = this.usuario.nombre;
    this.editForm.telefono = this.usuario.telefono || '';
    this.editForm.cedula = this.usuario.cedula || '';
    this.editForm.password = '';
    this.isEditing = true;
  }

  cancelEditing() {
    this.isEditing = false;
  }

  saveChanges() {
    this.isLoading = true;
    this.authService.updateProfile(this.editForm).subscribe({
      next: (res: any) => {
        this.usuario = res.usuario;
        this.isEditing = false;
        this.isLoading = false;
        // Opcional: mostrar un toast de éxito
      },
      error: (err: any) => {
        console.error(err);
        this.isLoading = false;
        alert('Error al actualizar el perfil');
      }
    });
  }

  logout() {
    this.authService.logout();
    window.location.reload();
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.isLoading = true;
      this.authService.uploadAvatar(file).subscribe({
        next: (res: any) => {
          this.usuario = res.usuario;
          this.isLoading = false;
        },
        error: (err: any) => {
          console.error(err);
          this.isLoading = false;
          alert('Error al subir la foto');
        }
      });
    }
  }
}
