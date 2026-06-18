import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GastoService } from '../../../core/services/gasto.service';
import { AdminService } from '../../../core/services/admin.service';
import { 
  NgApexchartsModule,
  ChartComponent,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexYAxis,
  ApexGrid,
  ApexPlotOptions,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexTheme
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis | ApexYAxis[];
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  labels: string[];
  legend: ApexLegend;
  theme: ApexTheme;
  colors: string[];
};

@Component({
  selector: 'app-gastos',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule, FormsModule],
  template: `
    <div class="space-y-6 pb-6 animate-in fade-in duration-700">
      
      <!-- Cabecera / Toolbar Principal -->
      <div class="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
        <div class="flex items-center gap-3">
          <div>
            <h1 class="text-xl font-black text-slate-900 tracking-tight uppercase">Gastos Financieros (ERP)</h1>
            <p class="text-xs text-slate-400">Control de flujo de caja y egresos corporativos</p>
          </div>
          <button (click)="descargarReporteGastos()" class="p-2 bg-white hover:bg-slate-50 text-slate-500 hover:text-blue-600 rounded-xl border border-slate-200/60 shadow-sm transition-all flex items-center justify-center shrink-0" title="Descargar Reporte de Gastos (CSV)">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><polyline points="6 9 6 2 18 2 18 9"/><rect width="12" height="8" x="6" y="14"/></svg>
          </button>
        </div>

        <!-- Pestañas Principales (Tabs) -->
        <div class="flex bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex-shrink-0 self-start sm:self-center">
          <button 
            (click)="activeTab = 'dashboard'"
            [class.bg-blue-600]="activeTab === 'dashboard'"
            [class.text-white]="activeTab === 'dashboard'"
            [class.text-slate-500]="activeTab !== 'dashboard'"
            class="px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300"
          >
            Dashboard Analítico
          </button>
          <button 
            (click)="activeTab = 'gestion'"
            [class.bg-blue-600]="activeTab === 'gestion'"
            [class.text-white]="activeTab === 'gestion'"
            [class.text-slate-500]="activeTab !== 'gestion'"
            class="px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300"
          >
            Gestión de Gastos
          </button>
        </div>
      </div>

      <!-- ===== PESTAÑA: DASHBOARD ANALÍTICO ===== -->
      <div *ngIf="activeTab === 'dashboard'" class="space-y-6 animate-in fade-in duration-500">
        
        <!-- Fila de Controles de Filtro -->
        <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
          <div class="flex items-center gap-2">
            <span class="text-xs font-bold text-slate-700">Período de Análisis:</span>
            <div class="flex items-center gap-1 bg-slate-100 p-0.5 rounded-xl">
              <button 
                *ngFor="let p of periods" 
                (click)="setPeriod(p.id)"
                [class.bg-white]="selectedPeriod === p.id"
                [class.text-blue-600]="selectedPeriod === p.id"
                [class.shadow-sm]="selectedPeriod === p.id"
                [class.text-slate-500]="selectedPeriod !== p.id"
                class="px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider transition-all duration-300"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <!-- Fechas Personalizadas -->
          <div *ngIf="selectedPeriod === 'custom'" class="flex items-center gap-3 animate-in slide-in-from-left-2">
            <div class="flex items-center gap-1.5">
              <label class="text-[9px] font-black uppercase text-slate-400">Desde</label>
              <input 
                type="date" 
                [(ngModel)]="customStartDate"
                (change)="loadStats()"
                class="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
            </div>
            <div class="flex items-center gap-1.5">
              <label class="text-[9px] font-black uppercase text-slate-400">Hasta</label>
              <input 
                type="date" 
                [(ngModel)]="customEndDate"
                (change)="loadStats()"
                class="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              >
            </div>
          </div>
        </div>

        <!-- KPIs de Gastos -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <!-- Gasto Total -->
          <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:scale-[1.01] transition-all duration-500 group">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/><path d="M18 12a2 2 0 0 0-2 2H2"/></svg>
              </div>
              <span class="text-[9px] font-bold text-rose-500 bg-rose-50 px-2 py-0.5 rounded-full">Salida de Caja</span>
            </div>
            <div class="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Gasto Total Acumulado</div>
            <div class="text-2xl font-bold text-slate-900 tracking-tight">{{ stats?.kpis?.gasto_total | currency:'USD':'symbol-narrow':'1.2-2' }}</div>
          </div>

          <!-- Gasto Promedio -->
          <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:scale-[1.01] transition-all duration-500 group">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </div>
              <span class="text-[9px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Por Transacción</span>
            </div>
            <div class="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Gasto Promedio Diario</div>
            <div class="text-2xl font-bold text-slate-900 tracking-tight">{{ stats?.kpis?.gasto_promedio | currency:'USD':'symbol-narrow':'1.2-2' }}</div>
          </div>

          <!-- Cantidad de Gastos -->
          <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:scale-[1.01] transition-all duration-500 group">
            <div class="flex items-center justify-between mb-3">
              <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
              </div>
              <span class="text-[9px] font-bold text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-full">Registros</span>
            </div>
            <div class="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Total Movimientos</div>
            <div class="text-2xl font-bold text-slate-900 tracking-tight">{{ stats?.kpis?.cantidad_gastos }} transacciones</div>
          </div>
        </div>

        <!-- Fila de Gráficas de ApexCharts -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
          
          <!-- Gráfica 1: Evolución Temporal del Gasto -->
          <div class="lg:col-span-2 bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-[450px]">
            <div>
              <h3 class="text-base font-bold text-slate-900 tracking-tight">Evolución de Egresos</h3>
              <p class="text-xs text-slate-400">Distribución de salidas de caja en el tiempo</p>
            </div>
            <div *ngIf="evolutionChartOptions" class="flex-1 min-h-0 flex items-center justify-center">
              <apx-chart
                [series]="evolutionChartOptions.series"
                [chart]="evolutionChartOptions.chart"
                [xaxis]="evolutionChartOptions.xaxis"
                [yaxis]="evolutionChartOptions.yaxis"
                [dataLabels]="evolutionChartOptions.dataLabels"
                [grid]="evolutionChartOptions.grid"
                [stroke]="evolutionChartOptions.stroke"
                [tooltip]="evolutionChartOptions.tooltip"
                [colors]="evolutionChartOptions.colors"
                class="w-full"
              ></apx-chart>
            </div>
          </div>

          <!-- Gráfica 2: Distribución por Categorías (Semi-Dona) -->
          <div class="lg:col-span-1 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-[450px]">
            <div>
              <h3 class="text-base font-bold text-slate-900 tracking-tight">Distribución por Categorías</h3>
              <p class="text-xs text-slate-400">Porcentaje de gastos acumulado por rubro</p>
            </div>
            <div *ngIf="distributionChartOptions" class="flex-1 flex items-center justify-center min-h-0">
              <apx-chart
                [series]="distributionChartOptions.series"
                [chart]="distributionChartOptions.chart"
                [labels]="distributionChartOptions.labels"
                [dataLabels]="distributionChartOptions.dataLabels"
                [legend]="distributionChartOptions.legend"
                [colors]="distributionChartOptions.colors"
                [tooltip]="distributionChartOptions.tooltip"
                [stroke]="distributionChartOptions.stroke"
                [plotOptions]="distributionChartOptions.plotOptions"
                class="w-full"
              ></apx-chart>
            </div>
          </div>
        </div>

        <!-- Fila de Movimientos Recientes -->
        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
          <h3 class="text-base font-bold text-slate-900 tracking-tight mb-4">Egresos Recientes de Caja</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th class="pb-3 pl-4">ID</th>
                  <th class="pb-3">Fecha</th>
                  <th class="pb-3">Categoría</th>
                  <th class="pb-3">Descripción</th>
                  <th class="pb-3 text-right pr-4">Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let item of stats?.movements" class="border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors text-xs text-slate-700">
                  <td class="py-3 pl-4 font-bold text-slate-400">#{{ item.id }}</td>
                  <td class="py-3">{{ item.fecha | date:'medium' }}</td>
                  <td class="py-3">
                    <span 
                      [ngClass]="{
                        'bg-red-50 text-red-600': item.categoria === 'Nomina',
                        'bg-blue-50 text-blue-600': item.categoria === 'Talleres',
                        'bg-purple-50 text-purple-600': item.categoria === 'Mantenimiento',
                        'bg-amber-50 text-amber-600': item.categoria === 'Combustible',
                        'bg-slate-50 text-slate-600': item.categoria === 'Otros'
                      }"
                      class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                    >
                      {{ item.categoria }}
                    </span>
                  </td>
                  <td class="py-3 max-w-[200px] truncate">{{ item.descripcion }}</td>
                  <td class="py-3 text-right font-black text-rose-600 pr-4">-{{ item.monto | currency:'USD':'symbol-narrow':'1.2-2' }}</td>
                </tr>
                <tr *ngIf="!stats?.movements?.length">
                  <td colspan="5" class="py-8 text-center text-slate-400 font-bold">No se encontraron movimientos registrados en este período.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

      <!-- ===== PESTAÑA: GESTIÓN DE GASTOS (REGISTRO E HISTORIAL) ===== -->
      <div *ngIf="activeTab === 'gestion'" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start animate-in fade-in duration-500">
        
        <!-- Formulario de Registro -->
        <div class="lg:col-span-1 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div>
            <h3 class="text-base font-bold text-slate-900 tracking-tight">Registrar Salida</h3>
            <p class="text-xs text-slate-400">Ingresa una nueva transacción de egreso</p>
          </div>

          <form (submit)="saveGasto()" class="space-y-4 text-xs">
            <!-- Alerta de Estado -->
            <div *ngIf="formMessage" 
                 [class.bg-green-50]="formSuccess" [class.text-green-700]="formSuccess"
                 [class.bg-red-50]="!formSuccess" [class.text-red-700]="!formSuccess"
                 class="p-3 rounded-2xl font-bold animate-in fade-in duration-300">
              {{ formMessage }}
            </div>

            <!-- Campo Monto -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-slate-400">Monto (USD) *</label>
              <div class="relative rounded-xl shadow-sm">
                <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <span class="text-slate-400 font-bold">$</span>
                </div>
                <input 
                  type="number" 
                  step="0.01" 
                  required
                  [(ngModel)]="newGasto.monto" 
                  name="monto"
                  placeholder="0.00" 
                  class="w-full pl-8 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-bold"
                >
              </div>
            </div>

            <!-- Campo Categoría -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-slate-400">Categoría *</label>
              <select 
                required
                [(ngModel)]="newGasto.categoria" 
                name="categoria"
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
              >
                <option value="" disabled selected>Selecciona una categoría</option>
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
            </div>

            <!-- Campo Descripción -->
            <div class="space-y-1">
              <label class="text-[10px] font-black uppercase text-slate-400">Descripción *</label>
              <textarea 
                required
                rows="3"
                [(ngModel)]="newGasto.descripcion" 
                name="descripcion"
                placeholder="Escribe el detalle de la salida de dinero..." 
                class="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
              ></textarea>
            </div>

            <button 
              type="submit" 
              [disabled]="formLoading"
              class="w-full bg-blue-600 text-white font-black uppercase tracking-wider py-3 rounded-2xl shadow-lg shadow-blue-600/10 hover:shadow-blue-600/20 transition-all hover:bg-blue-700 disabled:bg-slate-300 disabled:shadow-none flex items-center justify-center gap-2"
            >
              <span *ngIf="formLoading" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              {{ formLoading ? 'Registrando...' : 'Registrar Gasto' }}
            </button>
          </form>
        </div>

        <!-- Tabla Completa / Historial -->
        <div class="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 class="text-base font-bold text-slate-900 tracking-tight">Historial de Transacciones</h3>
              <p class="text-xs text-slate-400">Listado histórico completo de gastos registrados</p>
            </div>

            <!-- Filtro de Categoría -->
            <div class="flex items-center gap-2">
              <label class="text-[10px] font-black uppercase text-slate-400 whitespace-nowrap">Filtrar:</label>
              <select 
                [(ngModel)]="filterCategory" 
                (change)="loadGastos()"
                class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700"
              >
                <option value="">Todas las categorías</option>
                <option *ngFor="let cat of categories" [value]="cat">{{ cat }}</option>
              </select>
            </div>
          </div>

          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-400">
                  <th class="pb-3 pl-4">ID</th>
                  <th class="pb-3">Fecha</th>
                  <th class="pb-3">Categoría</th>
                  <th class="pb-3">Descripción</th>
                  <th class="pb-3">Registrado Por</th>
                  <th class="pb-3 text-right pr-4">Monto</th>
                </tr>
              </thead>
              <tbody class="text-xs text-slate-700">
                <tr *ngFor="let g of gastos" class="border-b border-slate-50 last:border-b-0 hover:bg-slate-50 transition-colors">
                  <td class="py-3 pl-4 font-bold text-slate-400">#{{ g.id }}</td>
                  <td class="py-3">{{ g.fecha | date:'short' }}</td>
                  <td class="py-3">
                    <span 
                      [ngClass]="{
                        'bg-red-50 text-red-600': g.categoria === 'Nomina',
                        'bg-blue-50 text-blue-600': g.categoria === 'Talleres',
                        'bg-purple-50 text-purple-600': g.categoria === 'Mantenimiento',
                        'bg-amber-50 text-amber-600': g.categoria === 'Combustible',
                        'bg-slate-50 text-slate-600': g.categoria === 'Otros'
                      }"
                      class="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                    >
                      {{ g.categoria }}
                    </span>
                  </td>
                  <td class="py-3 max-w-[150px] truncate" [title]="g.descripcion">{{ g.descripcion }}</td>
                  <td class="py-3 font-semibold text-slate-500">{{ g.adminNombre }}</td>
                  <td class="py-3 text-right font-black text-rose-600 pr-4">-{{ g.monto | currency:'USD':'symbol-narrow':'1.2-2' }}</td>
                </tr>
                <tr *ngIf="!gastos.length">
                  <td colspan="6" class="py-8 text-center text-slate-400 font-bold">No se encontraron gastos registrados.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

      </div>

    </div>
  `,
  styles: [`
    :host { display: block; background-color: transparent; }
    apx-chart { width: 100%; }
  `]
})
export class GastosComponent implements OnInit {
  activeTab: 'dashboard' | 'gestion' = 'dashboard';
  selectedPeriod: string = 'month';
  customStartDate: string = '';
  customEndDate: string = '';
  filterCategory: string = '';
  
  periods = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Semana' },
    { id: 'month', label: 'Mes' },
    { id: 'year', label: 'Año' },
    { id: 'custom', label: 'Personalizado' }
  ];

  categories = ['Nomina', 'Talleres', 'Mantenimiento', 'Combustible', 'Otros'];

  // Modelo de estadísticas
  stats: any = {
    kpis: { gasto_total: 0, gasto_promedio: 0, cantidad_gastos: 0 },
    charts: { evolution: { labels: [], data: [] }, distribution: { labels: [], data: [] } },
    movements: []
  };

  // Listado histórico completo
  gastos: any[] = [];

  // Formulario nuevo gasto
  newGasto = { monto: null, categoria: '', descripcion: '' };
  formLoading = false;
  formSuccess = false;
  formMessage = '';

  // Gráficas de ApexCharts
  public evolutionChartOptions: Partial<ChartOptions> | any;
  public distributionChartOptions: Partial<ChartOptions> | any;

  constructor(private gastoService: GastoService, private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadGastos();
  }

  descargarReporteGastos() {
    this.adminService.descargarReporteGastos(this.selectedPeriod, this.customStartDate, this.customEndDate).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_gastos_${this.selectedPeriod}_${new Date().toISOString().slice(0, 10)}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err) => console.error('Error al descargar reporte de gastos:', err)
    });
  }

  setPeriod(period: string) {
    this.selectedPeriod = period;
    if (period !== 'custom') {
      this.loadStats();
    }
  }

  loadStats() {
    this.gastoService.getGastoStats(this.selectedPeriod, this.customStartDate, this.customEndDate).subscribe({
      next: (res) => {
        this.stats = res;
        this.initCharts();
      },
      error: (err) => console.error('Error cargando analíticas de gastos:', err)
    });
  }

  loadGastos() {
    this.gastoService.getGastos(this.filterCategory || undefined).subscribe({
      next: (res) => {
        this.gastos = res;
      },
      error: (err) => console.error('Error cargando lista de gastos:', err)
    });
  }

  saveGasto() {
    if (!this.newGasto.monto || !this.newGasto.categoria || !this.newGasto.descripcion) {
      this.formSuccess = false;
      this.formMessage = 'Por favor complete todos los campos obligatorios.';
      return;
    }

    this.formLoading = true;
    this.formMessage = '';

    this.gastoService.registrarGasto(
      Number(this.newGasto.monto),
      this.newGasto.descripcion,
      this.newGasto.categoria
    ).subscribe({
      next: (res) => {
        this.formLoading = false;
        if (res && res.success) {
          this.formSuccess = true;
          this.formMessage = 'El gasto ha sido registrado exitosamente.';
          this.newGasto = { monto: null, categoria: '', descripcion: '' };
          this.loadGastos();
          this.loadStats();
          // Limpiar mensaje de éxito después de unos segundos
          setTimeout(() => this.formMessage = '', 4000);
        } else {
          this.formSuccess = false;
          this.formMessage = res.mensaje || 'Error al procesar la solicitud.';
        }
      },
      error: (err) => {
        this.formLoading = false;
        this.formSuccess = false;
        this.formMessage = err?.error?.error || 'No se pudo conectar con el servidor SOAP.';
      }
    });
  }

  initCharts() {
    const labels = this.stats.charts?.evolution?.labels || [];
    const data = this.stats.charts?.evolution?.data || [];

    // 1. Configuración Gráfico de Líneas/Áreas (Evolución de egresos)
    this.evolutionChartOptions = {
      series: [
        {
          name: "Egresos",
          data: data
        }
      ],
      chart: {
        type: "area",
        height: 350,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: "smooth",
        width: 3,
        colors: ['#EF4444'] // Rojo para egresos
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.3,
          opacityTo: 0,
          stops: [20, 100, 100],
          colorStops: [
            { offset: 0, color: '#EF4444', opacity: 0.3 },
            { offset: 100, color: '#EF4444', opacity: 0 }
          ]
        }
      },
      xaxis: {
        type: 'datetime',
        categories: labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          rotate: -45,
          hideOverlappingLabels: true,
          style: { colors: '#94a3b8', fontWeight: 600 }
        }
      },
      yaxis: {
        labels: {
          formatter: (val: number) => `$${val.toFixed(2)}`,
          style: { colors: '#94a3b8', fontWeight: 600 }
        }
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 4,
        padding: { left: 10, right: 10 }
      },
      tooltip: {
        theme: 'dark',
        style: {
          fontSize: '12px',
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        },
        y: {
          formatter: (val: number) => `$${val.toFixed(2)}`
        }
      },
      colors: ['#EF4444']
    };

    // 2. Configuración Gráfico de Distribución (Semi-Dona)
    const distLabels = this.stats.charts?.distribution?.labels || [];
    const distData = this.stats.charts?.distribution?.data || [];

    this.distributionChartOptions = {
      series: distData.length ? distData : [0, 0],
      chart: {
        type: "donut",
        height: 250,
        offsetY: 15,
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      plotOptions: {
        pie: {
          startAngle: -90,
          endAngle: 90,
          offsetY: 10,
          donut: {
            size: '75%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '10px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                color: '#64748b',
                offsetY: -5
              },
              value: {
                show: true,
                fontSize: '20px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 700,
                color: '#0F172A',
                offsetY: 5,
                formatter: (val: string) => `$${Number(val).toFixed(2)}`
              },
              total: {
                show: true,
                label: 'Total Gastos',
                color: '#64748b',
                fontSize: '10px',
                fontWeight: 600,
                formatter: (w: any) => {
                  const sum = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                  return `$${sum.toFixed(2)}`;
                }
              }
            }
          }
        }
      },
      labels: distLabels.map((l: string) => l.toUpperCase()),
      colors: ['#EF4444', '#3B82F6', '#8B5CF6', '#F59E0B', '#64748B'],
      dataLabels: { enabled: false },
      stroke: {
        show: true,
        width: 3,
        colors: ['#ffffff'],
        lineCap: 'round'
      },
      legend: {
        show: true,
        position: 'bottom',
        fontSize: '10px',
        fontWeight: 600,
        labels: { colors: '#64748b' },
        markers: {
          width: 8,
          height: 8,
          radius: 12
        }
      },
      tooltip: {
        theme: 'dark',
        style: {
          fontSize: '11px',
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        },
        y: {
          formatter: (val: number) => `$${val.toFixed(2)}`
        }
      }
    };
  }
}
