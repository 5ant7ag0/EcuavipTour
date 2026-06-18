import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { ChatSidebarComponent } from '../../shared/components/chat-sidebar/chat-sidebar.component';

interface ServiceCard {
  title: string;
  description: string;
  icon: string;
  image?: string;
  tags: string[];
}

interface Amenity {
  name: string;
  icon: string;
}

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [CommonModule, RouterModule, ChatSidebarComponent],
  template: `
    <div class="min-h-screen bg-white">
      <!-- HERO SECTION -->
      <section class="relative h-[60vh] flex items-center justify-center overflow-hidden bg-[#0a1628]">
        <div class="absolute inset-0 z-0">
          <div class="absolute inset-0 bg-gradient-to-r from-[#0a1628] to-transparent z-10"></div>
          <!-- Imagen de fondo decorativa (puede ser una de los recursos si tuviéramos URL directa, sino usamos gradiente) -->
          <div class="absolute inset-0 opacity-30 bg-cover bg-center" style="background-image: url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80')"></div>
        </div>

        <div class="container mx-auto px-6 relative z-20 text-center md:text-left">
          <h1 class="text-4xl md:text-7xl font-black text-white leading-tight mb-6 max-w-3xl">
            Transporte Premium <br>
            <span class="text-transparent bg-clip-text bg-gradient-to-r from-[#0ea5e9] to-blue-500">A nivel nacional</span>
          </h1>
          <p class="text-gray-300 text-lg md:text-xl max-w-2xl mb-8 leading-relaxed">
            Confort, seguridad y puntualidad en cada kilómetro. Te llevamos a tu destino con la mejor experiencia de viaje en Ecuador.
          </p>
          <div class="flex flex-wrap gap-4 justify-center md:justify-start">
            <a routerLink="/cliente/cotizar" class="px-8 py-4 bg-blue-600 text-white font-bold rounded-2xl shadow-xl shadow-blue-600/30 hover:scale-105 active:scale-95 transition-all">
              Cotizar Ahora
            </a>
            <a href="https://wa.me/593999216037" target="_blank" class="px-8 py-4 bg-white/10 border border-white/20 text-white font-bold rounded-2xl backdrop-blur-md hover:bg-white/20 transition-all">
              Contactar Ventas
            </a>
          </div>
        </div>
      </section>

      <!-- AMENITIES BAR -->
      <div class="bg-gray-50 border-y border-gray-100 py-8">
        <div class="container mx-auto px-6">
          <div class="flex flex-wrap justify-center gap-8 md:gap-16">
            <div *ngFor="let amenity of amenities" class="flex items-center gap-3 group">
              <div class="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-300">
                <ng-container [ngSwitch]="amenity.name">
                  <!-- Música -->
                  <svg *ngSwitchCase="'Música'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>
                  
                  <!-- Confort -->
                  <svg *ngSwitchCase="'Confort'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/><path d="M19 21V9a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12"/><path d="M15 5H9"/><path d="M12 7V3"/></svg>
                  
                  <!-- Wi-Fi -->
                  <svg *ngSwitchCase="'Wi-Fi'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>
                  
                  <!-- A/C -->
                  <svg *ngSwitchCase="'A/C'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
                  
                  <!-- 24 Horas -->
                  <svg *ngSwitchCase="'24 Horas'" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                </ng-container>
              </div>
              <span class="font-bold text-gray-700 tracking-tight">{{ amenity.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- MAIN SERVICES -->
      <section class="py-24 container mx-auto px-6">
        <div class="text-center mb-16">
          <h2 class="text-3xl md:text-5xl font-black text-gray-900 mb-4">Soluciones de Transporte</h2>
          <p class="text-gray-500 max-w-2xl mx-auto text-lg">
            Ofrecemos una amplia gama de servicios adaptados a tus necesidades personales y empresariales.
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <div *ngFor="let service of services" class="group relative bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-[100px] -mr-16 -mt-16 group-hover:scale-150 transition-transform duration-700"></div>
            
            <div class="relative z-10">
              <div class="w-16 h-16 bg-blue-600 text-white rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-600/20 group-hover:scale-110 transition-transform">
                <ng-container [ngSwitch]="service.title">
                  <!-- Transporte al Aeropuerto -->
                  <svg *ngSwitchCase="'Transporte al Aeropuerto'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>
                  
                  <!-- Viajes Nacionales -->
                  <svg *ngSwitchCase="'Viajes Nacionales'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
                  
                  <!-- Envío de Encomiendas -->
                  <svg *ngSwitchCase="'Envío de Encomiendas'" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>
                </ng-container>
              </div>
              <h3 class="text-2xl font-black text-gray-900 mb-4">{{ service.title }}</h3>
              <p class="text-gray-600 leading-relaxed mb-6">
                {{ service.description }}
              </p>
              <div class="flex flex-wrap gap-2 mb-8">
                <span *ngFor="let tag of service.tags" class="text-[11px] font-bold uppercase tracking-wider bg-gray-100 text-gray-500 px-3 py-1 rounded-full">
                  {{ tag }}
                </span>
              </div>
              <button routerLink="/cliente/cotizar" class="flex items-center gap-2 text-blue-600 font-bold hover:gap-4 transition-all">
                Reservar servicio
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- COVERAGE SECTION -->
      <section class="py-24 bg-[#f8fafc] relative overflow-hidden">
        <div class="container mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
          <div>
            <span class="text-blue-600 font-black text-sm uppercase tracking-widest mb-4 block">Presencia Nacional</span>
            <h2 class="text-4xl md:text-5xl font-black text-gray-900 mb-8">Cobertura en las principales ciudades</h2>
            <div class="grid grid-cols-2 gap-4">
              <div *ngFor="let city of cities" class="flex items-center gap-3 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors">
                <div class="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span class="font-bold text-gray-700">{{ city }}</span>
              </div>
            </div>
            <div class="mt-12 p-6 bg-blue-600 rounded-3xl text-white shadow-xl shadow-blue-600/20">
              <div class="flex items-center gap-4 mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 9.22a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.82 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17l.92-.08Z"/></svg>
                <span class="text-xl font-bold">Atención 24/7</span>
              </div>
              <p class="opacity-90 font-medium mb-4">¿Necesitas un viaje ahora mismo? Nuestro equipo está listo para atenderte en cualquier momento.</p>
              <a href="tel:+593999216037" class="inline-block text-2xl font-black hover:underline tracking-tight">+593 99 921 6037</a>
            </div>
          </div>
          <div class="relative">
            <!-- Representación visual de mapa o imagen de flota -->
            <div class="aspect-square bg-blue-100 rounded-[3rem] overflow-hidden shadow-inner flex items-center justify-center p-8">
               <div class="text-center">
                 <svg class="text-blue-500 mb-4 mx-auto" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                 <p class="text-blue-900/40 font-black text-2xl uppercase tracking-tighter">Conectando Ecuador</p>
               </div>
            </div>
            <!-- Float badge -->
            <div class="absolute -bottom-6 -left-6 bg-white p-6 rounded-3xl shadow-2xl border border-gray-100">
              <div class="flex items-center gap-4">
                <div class="flex -space-x-3">
                  <div class="w-10 h-10 rounded-full border-2 border-white bg-blue-500"></div>
                  <div class="w-10 h-10 rounded-full border-2 border-white bg-blue-400"></div>
                  <div class="w-10 h-10 rounded-full border-2 border-white bg-blue-300"></div>
                </div>
                <div>
                  <p class="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none mb-1">Clientes Satisfechos</p>
                  <p class="text-lg font-black text-gray-900">+5,000 viajes realizados</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- CTA FINAL -->
      <section class="py-24">
        <div class="container mx-auto px-6">
          <div class="bg-[#0a1628] rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden">
             <div class="absolute inset-0 bg-gradient-to-br from-blue-600/20 to-transparent opacity-50"></div>
             <div class="relative z-10">
               <h2 class="text-4xl md:text-6xl font-black text-white mb-8">¿Listo para iniciar tu viaje?</h2>
               <p class="text-gray-400 text-lg md:text-xl max-w-2xl mx-auto mb-12">
                 Cotiza tu viaje de forma rápida y sencilla. Descubre por qué somos la opción favorita de transporte ejecutivo en Ecuador.
               </p>
               <div class="flex flex-col sm:flex-row items-center justify-center gap-6">
                 <button routerLink="/cliente/cotizar" class="w-full sm:w-auto px-12 py-5 bg-blue-600 text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/40 text-lg">
                   Comenzar Cotización
                 </button>
                 <button routerLink="/contacto" class="w-full sm:w-auto px-12 py-5 bg-white/5 border border-white/10 text-white font-bold rounded-2xl hover:bg-white/10 transition-all text-lg">
                   Saber más
                 </button>
               </div>
             </div>
          </div>
        </div>
      </section>

      <!-- ================= FOOTER ================= -->
      <footer class="bg-[#060c18] border-t border-white/5 pt-16 pb-8 relative overflow-hidden">
        <!-- Subtle background glowing effect -->
        <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/5 rounded-full blur-3xl"></div>

        <div class="container mx-auto px-6 relative z-10">
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            
            <!-- Column 1: Brand & Bio -->
            <div class="flex flex-col items-start">
              <div class="mb-6">
                <img src="assets/logo.png" alt="EcuavipTour Logo" class="h-16 w-auto object-contain">
              </div>
              <p class="text-gray-400 text-sm leading-relaxed mb-6">
                Servicio de transporte interprovincial y fletes premium en todo el Ecuador. Viaja con total confort, seguridad y monitoreo satelital en tiempo real.
              </p>
              
              <!-- Redes Sociales -->
              <h4 class="text-white text-xs font-black uppercase tracking-widest mb-4">Síguenos</h4>
              <div class="flex gap-3">
                <a href="https://www.instagram.com/ecuavip.tour?igsh=ODY1aWczNnkzbzlq" target="_blank" 
                   class="w-10 h-10 bg-white/5 hover:bg-[#fd1d1d] text-gray-300 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.981 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
                <a href="https://www.facebook.com/share/1EN4w5BaNY/" target="_blank" 
                   class="w-10 h-10 bg-white/5 hover:bg-[#1877F2] text-gray-300 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
                  <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="https://wa.me/593999216037" target="_blank" 
                   class="w-10 h-10 bg-white/5 hover:bg-[#25D366] text-gray-300 hover:text-white rounded-xl flex items-center justify-center transition-all duration-300">
                  <svg class="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 9.22a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.82 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17l.92-.08Z"/></svg>
                </a>
              </div>
            </div>

            <!-- Column 2: Quick Links -->
            <div class="flex flex-col items-start">
              <h4 class="text-white text-xs font-black uppercase tracking-widest mb-6 border-b border-sky-500/20 pb-2 w-full">Enlaces Rápidos</h4>
              <ul class="space-y-3">
                <li><a routerLink="/" class="text-gray-400 hover:text-sky-400 text-sm font-semibold transition-colors duration-200">Inicio</a></li>
                <li><a routerLink="/servicios" class="text-gray-400 hover:text-sky-400 text-sm font-semibold transition-colors duration-200">Servicios</a></li>
                <li><a routerLink="/contacto" class="text-gray-400 hover:text-sky-400 text-sm font-semibold transition-colors duration-200">Contactos</a></li>
                <li><a routerLink="/cliente/cotizar" class="text-gray-400 hover:text-sky-400 text-sm font-semibold transition-colors duration-200">Cotizar Viaje</a></li>
                <li>
                  <button (click)="handleChatAction()" class="text-left text-gray-400 hover:text-sky-400 text-sm font-semibold transition-colors duration-200 flex items-center gap-1.5">
                    <span>Chat en Vivo</span>
                    <span class="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                  </button>
                </li>
              </ul>
            </div>

            <!-- Column 3: Contact Info -->
            <div class="flex flex-col items-start">
              <h4 class="text-white text-xs font-black uppercase tracking-widest mb-6 border-b border-sky-500/20 pb-2 w-full">Datos de Contacto</h4>
              <ul class="space-y-4">
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-sky-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.92 9.22a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.82 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l.96-.96a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 17l.92-.08Z"/></svg>
                  <div>
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Llámanos / WhatsApp</p>
                    <a href="https://wa.me/593999216037" class="text-gray-300 hover:text-sky-400 text-sm font-bold transition-colors">099 921 6037</a>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-sky-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                  <div>
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Email</p>
                    <a href="mailto:ecuaviptour@gmail.com" class="text-gray-300 hover:text-sky-400 text-sm font-bold transition-colors">ecuaviptour&#64;gmail.com</a>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-sky-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                  <div>
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Dirección Matriz</p>
                    <p class="text-gray-300 text-sm font-bold">Ambato, Tungurahua, Ecuador</p>
                  </div>
                </li>
              </ul>
            </div>

            <!-- Column 4: Coverage / Schedule -->
            <div class="flex flex-col items-start">
              <h4 class="text-white text-xs font-black uppercase tracking-widest mb-6 border-b border-sky-500/20 pb-2 w-full">Horarios y Cobertura</h4>
              <ul class="space-y-4">
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                  <div>
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Disponibilidad</p>
                    <p class="text-gray-300 text-sm font-bold">Lunes a Domingo · 24 Horas</p>
                  </div>
                </li>
                <li class="flex items-start gap-3">
                  <svg class="w-5 h-5 text-sky-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
                  <div>
                    <p class="text-xs font-bold text-gray-500 uppercase tracking-wider">Destinos Principales</p>
                    <p class="text-gray-400 text-xs font-medium mt-1 leading-relaxed">
                      Quito · Guayaquil · Cuenca · Loja · Santo Domingo · Riobamba · Ambato · Latacunga · Ibarra
                    </p>
                  </div>
                </li>
              </ul>
            </div>

          </div>

          <!-- Bottom bar -->
          <div class="border-t border-white/5 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p class="text-gray-500 text-xs font-semibold text-center md:text-left">
              © {{ currentYear }} EcuavipTour. Todos los derechos reservados.
            </p>
            <p class="text-gray-600 text-[11px] font-medium text-center md:text-right">
              Diseñado para ofrecer el máximo confort, puntualidad y seguridad en las vías ecuatorianas.
            </p>
          </div>
        </div>
      </footer>

      <!-- INTEGRACIÓN CHAT SIDEBAR (SOPORTE) -->
      <app-chat-sidebar 
        [isOpen]="isChatOpen" 
        tipoReceptor="admin" 
        tituloCabecera="Soporte EcuavipTour" 
        (closed)="isChatOpen = false">
      </app-chat-sidebar>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .animate-fade-in {
      animation: fadeIn 0.8s ease-out forwards;
    }
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
  `]
})
export class ServiciosComponent {
  currentYear = new Date().getFullYear();
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

  amenities: Amenity[] = [
    { name: 'Música', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>' },
    { name: 'Confort', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 21v-4a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v4"/><path d="M19 21V9a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v12"/><path d="M15 5H9"/><path d="M12 7V3"/></svg>' },
    { name: 'Wi-Fi', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"/><path d="M1.42 9a16 16 0 0 1 21.16 0"/><path d="M8.53 16.11a6 6 0 0 1 6.95 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>' },
    { name: 'A/C', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>' },
    { name: '24 Horas', icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' }
  ];

  services: ServiceCard[] = [
    {
      title: 'Transporte al Aeropuerto',
      description: 'Traslados puntuales desde y hacia cualquier aeropuerto del país. Te recogemos en la puerta de tu casa.',
      icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></svg>',
      tags: ['Puerta a Puerta', '24/7', 'Equipaje Incluido']
    },
    {
      title: 'Viajes Nacionales',
      description: 'Descubre la belleza de la naturaleza en cada viaje. Tours personalizados a cualquier rincón del Ecuador.',
      icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>',
      tags: ['Turismo', 'Empresarial', 'Grupal']
    },
    {
      title: 'Envío de Encomiendas',
      description: '¿Necesitas enviar un paquete? Lo llevamos de forma segura y rápida a su destino con rastreo real.',
      icon: '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16.5 9.4 7.55 4.24"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.29 7 12 12 20.71 7"/><line x1="12" y1="22" x2="12" y2="12"/></svg>',
      tags: ['Rápido', 'Seguro', 'Rastreo GPS']
    }
  ];

  cities = [
    'Ambato', 'Riobamba', 'Quito', 'Guayaquil', 
    'Guaranda', 'Latacunga', 'Ibarra', 'Cuenca'
  ];
}
