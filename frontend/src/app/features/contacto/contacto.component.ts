import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

import { ChatSidebarComponent } from '../../shared/components/chat-sidebar/chat-sidebar.component';

@Component({
  selector: 'app-contacto',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatSidebarComponent],
  template: `
    <div class="min-h-screen bg-white">
      <!-- HERO CONTACTO (DARK PREMIUM) -->
      <section class="relative py-32 bg-[#0a1628] overflow-hidden">
        <div class="absolute inset-0 z-0">
          <div class="absolute inset-0 bg-gradient-to-b from-blue-600/10 to-transparent"></div>
          <div class="absolute top-0 right-0 w-1/2 h-full bg-blue-500/5 blur-[120px] rounded-full"></div>
        </div>

        <div class="container mx-auto px-6 relative z-10 text-center">
          <span class="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-400 text-sm font-black uppercase tracking-widest mb-6">
            Contacto
          </span>
          <h1 class="text-4xl md:text-7xl font-black text-white mb-6 leading-tight">
            Estamos para servirte <br>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-blue-500">24 horas, 7 días</span>
          </h1>
          <p class="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            ¿Tienes dudas, sugerencias o necesitas un viaje especial? Nuestro equipo está listo para atenderte en cualquier momento.
          </p>
        </div>
      </section>

      <!-- CONTACT GRID (HI-FI) -->
      <section class="py-20 container mx-auto px-6 -mt-16 relative z-20">
        <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          
          <!-- WHATSAPP -->
          <div class="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div class="flex justify-between items-start mb-10">
              <div class="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 group-hover:text-[#fd1d1d] transition-colors duration-300">
                <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 9.22a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.82 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17l.92-.08Z"/></svg>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-gray-300">WhatsApp</span>
            </div>
            <h3 class="text-xl font-black text-ecuavip-blue mb-2">WhatsApp</h3>
            <p class="text-gray-600 font-bold text-lg mb-8 tracking-tight">099 921 6037</p>
            <a href="https://wa.me/593999216037" target="_blank" class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-900 hover:text-ecuavip-blue transition-colors border-b-2 border-gray-100 hover:border-ecuavip-blue pb-1">
              Enviar Mensaje
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>

          <!-- TELÉFONO -->
          <div class="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div class="flex justify-between items-start mb-10">
              <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-ecuavip-blue group-hover:text-[#fd1d1d] transition-colors duration-300">
                <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 9.22a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.82 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17l.92-.08Z"/></svg>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-gray-300">Central</span>
            </div>
            <h3 class="text-xl font-black text-ecuavip-blue mb-2">Llamadas 24h</h3>
            <p class="text-gray-600 font-bold text-lg mb-8 tracking-tight">099 921 6037</p>
            <a href="tel:0999216037" class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-900 hover:text-ecuavip-blue transition-colors border-b-2 border-gray-100 hover:border-ecuavip-blue pb-1">
              Llamar ahora
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>

          <!-- CORREO -->
          <div class="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div class="flex justify-between items-start mb-10">
              <div class="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-600 group-hover:text-[#fd1d1d] transition-colors duration-300">
                <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-gray-300">Email</span>
            </div>
            <h3 class="text-xl font-black text-ecuavip-blue mb-2">Consultas</h3>
            <p class="text-gray-600 font-bold text-base mb-8 truncate">ecuaviptour&#64;gmail.com</p>
            <a href="mailto:ecuaviptour@gmail.com" class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-900 hover:text-ecuavip-blue transition-colors border-b-2 border-gray-100 hover:border-ecuavip-blue pb-1">
              Enviar Correo
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>

          <!-- DIRECCIÓN -->
          <div class="group bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden">
            <div class="flex justify-between items-start mb-10">
              <div class="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-ecuavip-blue group-hover:text-[#fd1d1d] transition-colors duration-300">
                <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-gray-300">Matriz</span>
            </div>
            <h3 class="text-xl font-black text-ecuavip-blue mb-2">Ubicación</h3>
            <p class="text-gray-600 font-bold text-lg mb-8 tracking-tight">Ambato, Ecuador</p>
            <a href="https://maps.google.com/?q=Ambato,Ecuador" target="_blank" class="inline-flex items-center gap-2 text-xs font-black uppercase tracking-widest text-gray-900 hover:text-ecuavip-blue transition-colors border-b-2 border-gray-100 hover:border-ecuavip-blue pb-1">
              Ver Mapa
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </a>
          </div>

          <!-- CHAT INTERNO -->
          <div class="group bg-ecuavip-blue p-8 rounded-[2rem] border border-ecuavip-blue shadow-xl shadow-blue-500/20 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden col-span-1 md:col-span-2 lg:col-span-1 cursor-pointer" (click)="handleChatAction()">
            <div class="flex justify-between items-start mb-10">
              <div class="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center text-white">
                <svg class="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              </div>
              <span class="text-[10px] font-black uppercase tracking-widest text-white/50">Plataforma</span>
            </div>
            <h3 class="text-xl font-black text-white mb-2">Chat en Vivo</h3>
            <p class="text-white/80 font-medium text-sm mb-8 leading-snug">Conversa con nosotros en tiempo real si estás registrado.</p>
            
            <button class="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white hover:opacity-80 transition-opacity border-b-2 border-white/20 pb-1">
              {{ isLoggedIn ? 'Ir al Chat' : 'Iniciar Sesión' }}
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
            </button>
          </div>

          <!-- REDES SOCIALES (SIMPLIFICADO) -->
          <div class="bg-gray-900 p-8 rounded-[2rem] border border-gray-800 shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="text-xl font-black text-white mb-6">Síguenos</h3>
              <div class="flex gap-4">
                <a href="https://www.instagram.com/ecuavip.tour?igsh=ODY1aWczNnkzbzlq" target="_blank" class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-[#fd1d1d] transition-all">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.981 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://www.facebook.com/share/1EN4w5BaNY/" target="_blank" class="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white hover:bg-[#1877F2] transition-all">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              </div>
            </div>
            <p class="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-8">Ecuavip Tour © 2024</p>
          </div>

        </div>
      </section>

      <!-- SECCIÓN MAPA REFINADA -->
      <section class="py-20 bg-gray-50/30">
        <div class="container mx-auto px-6">
          <div class="bg-white rounded-[3rem] border border-gray-100 shadow-xl overflow-hidden flex flex-col md:flex-row min-h-[500px]">
            <div class="md:w-1/3 p-12 flex flex-col justify-center">
              <h2 class="text-3xl font-black text-gray-900 mb-4">Nuestra Matriz</h2>
              <p class="text-gray-500 font-medium mb-8">Ubicados en el punto más estratégico para conectar todo el país.</p>
              <div class="space-y-6">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-ecuavip-blue">
                    <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  </div>
                  <div>
                    <p class="text-xs font-bold text-gray-400 uppercase tracking-widest">Dirección</p>
                    <p class="text-gray-700 font-bold">Ambato, Tungurahua</p>
                  </div>
                </div>
              </div>
            </div>
            <div class="md:w-2/3 bg-gray-200 min-h-[400px]">
              <iframe 
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d127641.5644503794!2d-78.6750058925585!3d-1.2541334057635674!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x91d382025170d139%3A0x6e2467f53a4736f!2sAmbato!5e0!3m2!1ses!2sec!4v1715360000000!5m2!1ses!2sec" 
                width="100%" height="100%" style="border:0;" allowfullscreen="" loading="lazy">
              </iframe>
            </div>
          </div>
        </div>
      </section>
      
      <!-- INTEGRACIÓN CHAT SIDEBAR (SOPORTE) -->
      <app-chat-sidebar 
        [isOpen]="isChatOpen" 
        tipoReceptor="admin" 
        tituloCabecera="Soporte VIP Ecuavip" 
        (closed)="isChatOpen = false">
      </app-chat-sidebar>
    </div>
  `,
  styles: [`
    :host { display: block; }
  `]
})
export class ContactoComponent {
  isLoggedIn = false;
  isChatOpen = false;

  constructor(private authService: AuthService, private router: Router) {
    this.isLoggedIn = this.authService.isLoggedIn();
  }

  handleChatAction() {
    if (this.isLoggedIn) {
      this.isChatOpen = true;
    } else {
      this.authService.openAuthModal();
    }
  }
}
