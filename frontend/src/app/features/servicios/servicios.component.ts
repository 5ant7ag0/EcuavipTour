import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

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
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen bg-white">
      <!-- HERO SECTION -->
      <section class="relative h-[60vh] flex items-center justify-center overflow-hidden bg-[#0a1628]">
        <div class="absolute inset-0 z-0">
          <div class="absolute inset-0 bg-gradient-to-r from-[#0a1628] to-transparent z-10"></div>
          <!-- Imagen de fondo decorativa (puede ser una de los recursos si tuviéramos URL directa, sino usamos gradiente) -->
          <div class="absolute inset-0 opacity-30 bg-[url('https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&q=80')] bg-cover bg-center"></div>
        </div>

        <div class="container mx-auto px-6 relative z-20 text-center md:text-left">
          <div class="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full text-blue-400 text-sm font-bold uppercase tracking-widest mb-6 animate-fade-in">
            <span class="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></span>
            Nuestros Servicios
          </div>
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

      <!-- FOOTER INFO -->
      <footer class="bg-gray-50 py-12 border-t border-gray-100">
        <div class="container mx-auto px-6 text-center">
          <p class="text-gray-400 font-medium mb-2">EcuavipTour · Servicio de transporte y flete</p>
          <p class="text-gray-500 font-bold">Ambato · Riobamba · Quito · Guayaquil</p>
        </div>
      </footer>
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
