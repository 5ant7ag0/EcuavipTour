import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
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
  ApexTitleSubtitle,
  ApexFill,
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
  fill: ApexFill;
  plotOptions: ApexPlotOptions;
  labels: string[];
  legend: ApexLegend;
  title: ApexTitleSubtitle;
  theme: ApexTheme;
  colors: string[];
};

@Component({
  selector: 'app-monitor-flota',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  template: `
    <div class="space-y-8 pb-8 animate-in fade-in duration-700">
      <!-- Header / Toolbar Única Alineada con Bordes -->
      <div class="mb-10 flex items-center justify-between gap-4 w-full">
        <!-- Título Limpio -->
        <h1 class="text-xl font-black text-slate-900 tracking-tight uppercase">Dashboard</h1>
        
        <!-- Cápsula de Periodos -->
        <div class="flex items-center gap-1 bg-white p-1 rounded-2xl shadow-sm border border-slate-100 flex-shrink-0">
          <button 
            *ngFor="let p of periods" 
            (click)="setPeriod(p.id)"
            [class.bg-blue-600]="selectedPeriod === p.id"
            [class.text-white]="selectedPeriod === p.id"
            [class.text-slate-500]="selectedPeriod !== p.id"
            class="px-5 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all duration-300"
          >
            {{ p.label }}
          </button>
        </div>
      </div>

      <!-- Fila 1: KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <!-- Ingresos -->
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:scale-[1.02] transition-all duration-500 group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
            </div>
            <span class="text-xs font-bold text-green-500 bg-green-50 px-2.5 py-1 rounded-full">+12.5%</span>
          </div>
          <div class="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Ingresos Totales</div>
          <div class="text-3xl font-black text-slate-800 tracking-tight">{{ stats?.kpis?.ingresos_totales | currency }}</div>
        </div>

        <!-- Viajes Activos -->
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:scale-[1.02] transition-all duration-500 group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C2.1 10.3 2 10.6 2 11v5c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
            <span class="flex h-2 w-2 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          </div>
          <div class="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Viajes Activos</div>
          <div class="text-3xl font-black text-slate-800 tracking-tight">{{ stats?.kpis?.viajes_activos }}</div>
        </div>

        <!-- Pagos Pendientes -->
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:scale-[1.02] transition-all duration-500 group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div class="text-xs font-bold text-rose-500 animate-pulse">Urgente</div>
          </div>
          <div class="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Pagos Pendientes</div>
          <div class="text-3xl font-black text-slate-800 tracking-tight">{{ stats?.kpis?.pagos_pendientes }}</div>
        </div>

        <!-- Choferes Online -->
        <div class="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:scale-[1.02] transition-all duration-500 group">
          <div class="flex items-center justify-between mb-4">
            <div class="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="flex -space-x-2">
              <div class="w-6 h-6 rounded-full bg-slate-200 border-2 border-white"></div>
              <div class="w-6 h-6 rounded-full bg-slate-300 border-2 border-white"></div>
            </div>
          </div>
          <div class="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">Choferes Online</div>
          <div class="text-3xl font-black text-slate-800 tracking-tight">{{ stats?.kpis?.choferes_online }}</div>
        </div>
      </div>

      <!-- Fila 2: Gráfico de Ingresos y Distribución -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Gráfico de Ingresos (Area) -->
        <div class="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h3 class="text-xl font-black text-slate-800 tracking-tight">Rendimiento Financiero</h3>
              <p class="text-sm text-slate-400">Ingresos generados (USD) vs Tiempo</p>
            </div>
          </div>
          <div *ngIf="revenueChartOptions" class="min-h-[350px]">
            <apx-chart
              [series]="revenueChartOptions.series"
              [chart]="revenueChartOptions.chart"
              [xaxis]="revenueChartOptions.xaxis"
              [dataLabels]="revenueChartOptions.dataLabels"
              [grid]="revenueChartOptions.grid"
              [stroke]="revenueChartOptions.stroke"
              [tooltip]="revenueChartOptions.tooltip"
              [fill]="revenueChartOptions.fill"
              [colors]="revenueChartOptions.colors"
            ></apx-chart>
          </div>
        </div>

        <!-- Distribución de Estados (Donut) -->
        <div class="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col">
          <div class="mb-8">
            <h3 class="text-xl font-black text-slate-800 tracking-tight">Estados de Viaje</h3>
            <p class="text-sm text-slate-400">Distribución porcentual operativa</p>
          </div>
          <div *ngIf="donutChartOptions" class="flex-1 flex items-center justify-center">
            <apx-chart
              [series]="donutChartOptions.series"
              [chart]="donutChartOptions.chart"
              [labels]="donutChartOptions.labels"
              [dataLabels]="donutChartOptions.dataLabels"
              [legend]="donutChartOptions.legend"
              [colors]="donutChartOptions.colors"
              [tooltip]="donutChartOptions.tooltip"
              class="w-full"
            ></apx-chart>
          </div>
        </div>
      </div>

      <!-- Fila 3: Top Rutas y Últimos Movimientos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Rutas (Bar Horiz) -->
        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div class="mb-8">
            <h3 class="text-xl font-black text-slate-800 tracking-tight">Top Rutas Estratégicas</h3>
            <p class="text-sm text-slate-400">Conexiones con mayor demanda</p>
          </div>
          <div *ngIf="barChartOptions">
            <apx-chart
              [series]="barChartOptions.series"
              [chart]="barChartOptions.chart"
              [xaxis]="barChartOptions.xaxis"
              [plotOptions]="barChartOptions.plotOptions"
              [dataLabels]="barChartOptions.dataLabels"
              [colors]="barChartOptions.colors"
              [grid]="barChartOptions.grid"
            ></apx-chart>
          </div>
        </div>

        <!-- Últimos Movimientos -->
        <div class="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <div class="flex items-center justify-between mb-8">
            <div>
              <h3 class="text-xl font-black text-slate-800 tracking-tight">Últimos Movimientos</h3>
              <p class="text-sm text-slate-400">Actividad reciente del sistema</p>
            </div>
            <button class="text-blue-600 text-xs font-bold hover:underline">Ver todo</button>
          </div>
          <div class="space-y-6">
            <div *ngFor="let item of stats?.movements" class="flex items-center justify-between group cursor-pointer">
              <div class="flex items-center gap-4">
                <div class="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                </div>
                <div>
                  <div class="text-sm font-bold text-slate-700">{{ item.cliente }}</div>
                  <div class="text-xs text-slate-400">{{ item.fecha | date:'shortTime' }} • {{ item.estado | uppercase }}</div>
                </div>
              </div>
              <div class="text-sm font-black text-slate-800">{{ item.monto | currency }}</div>
            </div>
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
export class MonitorFlotaComponent implements OnInit {
  stats: any;
  selectedPeriod: string = 'month';
  periods = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'month', label: 'Este Mes' }
  ];

  public revenueChartOptions: Partial<ChartOptions> | any;
  public donutChartOptions: Partial<ChartOptions> | any;
  public barChartOptions: Partial<ChartOptions> | any;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  setPeriod(period: string) {
    this.selectedPeriod = period;
    this.loadStats();
  }

  loadStats() {
    this.adminService.getStats(this.selectedPeriod).subscribe({
      next: (res) => {
        this.stats = res;
        this.initCharts();
      },
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  initCharts() {
    // 1. Chart de Ingresos (Area)
    this.revenueChartOptions = {
      series: [
        {
          name: "Ingresos",
          data: this.stats.charts.revenue.data
        }
      ],
      chart: {
        type: "area",
        height: 350,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: "smooth",
        width: 3,
        colors: ['#2563eb']
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [20, 100, 100],
          colorStops: [
            { offset: 0, color: '#3b82f6', opacity: 0.4 },
            { offset: 100, color: '#3b82f6', opacity: 0 }
          ]
        }
      },
      xaxis: {
        categories: this.stats.charts.revenue.labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { colors: '#94a3b8', fontWeight: 600 }
        }
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 4,
        padding: { left: 0, right: 0 }
      },
      tooltip: {
        theme: 'light',
        x: { show: true },
        y: {
          formatter: (val: number) => `$${val.toFixed(2)}`
        }
      },
      colors: ['#2563eb']
    };

    // 2. Chart de Distribución (Donut)
    this.donutChartOptions = {
      series: this.stats.charts.distribution.data,
      chart: {
        type: "donut",
        height: 350,
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      labels: this.stats.charts.distribution.labels.map((l: string) => l.toUpperCase()),
      colors: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#6366f1'],
      dataLabels: { enabled: false },
      legend: {
        position: 'bottom',
        fontWeight: 600,
        labels: { colors: '#64748b' }
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} viajes`
        }
      }
    };

    // 3. Chart de Top Rutas (Bar Horiz)
    this.barChartOptions = {
      series: [
        {
          name: "Viajes",
          data: this.stats.charts.routes.map((r: any) => r.cantidad)
        }
      ],
      chart: {
        type: "bar",
        height: 300,
        toolbar: { show: false },
        fontFamily: 'Inter, system-ui, sans-serif'
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          barHeight: '40%'
        }
      },
      colors: ['#2563eb'],
      dataLabels: { enabled: false },
      xaxis: {
        categories: this.stats.charts.routes.map((r: any) => r.ruta),
        labels: { show: false },
        axisBorder: { show: false }
      },
      grid: {
        show: false
      }
    };
  }
}
