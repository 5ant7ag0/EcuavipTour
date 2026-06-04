import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
  imports: [CommonModule, NgApexchartsModule, FormsModule],
  template: `
    <div class="space-y-6 pb-6 animate-in fade-in duration-700">
      <!-- Header / Toolbar Única Alineada con Bordes -->
      <div class="mb-6 flex items-center justify-between gap-4 w-full">
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

      <!-- Controles de Fecha Personalizada -->
      <div *ngIf="selectedPeriod === 'custom'" class="flex items-center gap-4 bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm animate-in fade-in slide-in-from-top-2 mb-6">
        <div class="flex items-center gap-2">
          <label class="text-[10px] font-black uppercase text-slate-400">Desde</label>
          <input 
            type="date" 
            [(ngModel)]="customStartDate"
            (change)="filterStats()"
            class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
        </div>
        <div class="flex items-center gap-2">
          <label class="text-[10px] font-black uppercase text-slate-400">Hasta</label>
          <input 
            type="date" 
            [(ngModel)]="customEndDate"
            (change)="filterStats()"
            class="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          >
        </div>
      </div>

      <!-- Fila 1: KPI Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Ingresos -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:scale-[1.01] transition-all duration-500 group">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="12" x="2" y="6" rx="2"/><circle cx="12" cy="12" r="2"/><path d="M6 12h.01M18 12h.01"/></svg>
            </div>
            <span class="text-[10px] font-bold text-green-500 bg-green-50 px-2 py-0.5 rounded-full">+12.5%</span>
          </div>
          <div class="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Ingresos Totales</div>
          <div class="text-2xl font-bold text-slate-900 tracking-tight">{{ stats?.kpis?.ingresos_totales | currency:'USD':'symbol-narrow':'1.2-2' }}</div>
        </div>

        <!-- Viajes Activos -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:scale-[1.01] transition-all duration-500 group">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.5 2.6C2.1 10.3 2 10.6 2 11v5c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>
            </div>
            <span class="flex h-2 w-2 relative">
              <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span class="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
          </div>
          <div class="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Viajes Activos</div>
          <div class="text-2xl font-bold text-slate-900 tracking-tight">{{ stats?.kpis?.viajes_activos }}</div>
        </div>

        <!-- Pagos Pendientes -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:scale-[1.01] transition-all duration-500 group">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors duration-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/><path d="m9 12 2 2 4-4"/></svg>
            </div>
            <div class="text-[10px] font-bold text-rose-500 animate-pulse">Urgente</div>
          </div>
          <div class="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Pagos Pendientes</div>
          <div class="text-2xl font-bold text-slate-900 tracking-tight">{{ stats?.kpis?.pagos_pendientes }}</div>
        </div>

        <!-- Choferes Online -->
        <div class="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:scale-[1.01] transition-all duration-500 group">
          <div class="flex items-center justify-between mb-3">
            <div class="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-500">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            </div>
            <div class="flex -space-x-1.5">
              <div class="w-5 h-5 rounded-full bg-slate-200 border border-white"></div>
              <div class="w-5 h-5 rounded-full bg-slate-300 border border-white"></div>
            </div>
          </div>
          <div class="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Choferes Online</div>
          <div class="text-2xl font-bold text-slate-900 tracking-tight">{{ stats?.kpis?.choferes_online }}</div>
        </div>
      </div>

      <!-- Fila 2: Gráfico de Ingresos (Dos columnas) y Columna Derecha (Dos Gráficos: Top Rutas y Servicios) -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
        <!-- Gráfico de Ingresos (Area) -->
        <div class="lg:col-span-2 bg-white rounded-3xl p-5 shadow-sm border border-slate-100 flex flex-col justify-between h-[520px]">
          <div class="flex items-center justify-between mb-4">
            <div>
              <h3 class="text-lg font-bold text-slate-900 tracking-tight">Rendimiento Financiero</h3>
              <p class="text-xs text-slate-400">Ingresos generados (USD) vs Tiempo</p>
            </div>
          </div>
          <div *ngIf="revenueChartOptions" class="flex-1 min-h-0 flex items-center justify-center">
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
              class="w-full"
            ></apx-chart>
          </div>
        </div>

        <!-- Columna Derecha: Estados de Viaje y Servicios -->
        <div class="lg:col-span-1 flex flex-col gap-6 h-[520px]">
          <!-- Estados de Viaje (Donut) -->
          <div class="flex-1 h-0 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-900 tracking-tight">Estados de Viaje</h3>
              <p class="text-[10px] text-slate-400">Distribución porcentual operativa</p>
            </div>
            <div *ngIf="donutChartOptions" class="flex-1 flex items-center justify-center min-h-0">
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

          <!-- Distribución de Servicios (Donut NEW) -->
          <div class="flex-1 h-0 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 class="text-sm font-bold text-slate-900 tracking-tight">Distribución de Servicios</h3>
              <p class="text-[10px] text-slate-400">VIP vs Encomiendas</p>
            </div>
            <div *ngIf="serviceChartOptions" class="flex-1 flex items-center justify-center min-h-0">
              <apx-chart
                [series]="serviceChartOptions.series"
                [chart]="serviceChartOptions.chart"
                [labels]="serviceChartOptions.labels"
                [dataLabels]="serviceChartOptions.dataLabels"
                [legend]="serviceChartOptions.legend"
                [colors]="serviceChartOptions.colors"
                [tooltip]="serviceChartOptions.tooltip"
                [stroke]="serviceChartOptions.stroke"
                [plotOptions]="serviceChartOptions.plotOptions"
                class="w-full"
              ></apx-chart>
            </div>
          </div>
        </div>
      </div>

      <!-- Fila 3: Top Rutas y Últimos Movimientos -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Top Rutas (Bar Horiz) -->
        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-[340px]">
          <div>
            <h3 class="text-base font-bold text-slate-900 tracking-tight">Top Rutas Estratégicas</h3>
            <p class="text-xs text-slate-400">Conexiones con mayor demanda</p>
          </div>
          <div *ngIf="barChartOptions" class="no-legend-chart flex-1 flex items-center justify-center min-h-0 mt-2">
            <apx-chart
              [series]="barChartOptions.series"
              [chart]="barChartOptions.chart"
              [xaxis]="barChartOptions.xaxis"
              [plotOptions]="barChartOptions.plotOptions"
              [dataLabels]="barChartOptions.dataLabels"
              [colors]="barChartOptions.colors"
              [grid]="barChartOptions.grid"
              [legend]="barChartOptions.legend"
              [tooltip]="barChartOptions.tooltip"
              class="w-full"
            ></apx-chart>
          </div>
        </div>

        <!-- Últimos Movimientos -->
        <div class="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between h-[340px]">
          <div class="flex items-center justify-between mb-2">
            <div>
              <h3 class="text-base font-bold text-slate-900 tracking-tight">Últimos Movimientos</h3>
              <p class="text-xs text-slate-400">Actividad reciente del sistema</p>
            </div>
            <button class="text-blue-600 text-xs font-bold hover:underline">Ver todo</button>
          </div>
          <div class="flex-1 overflow-y-auto space-y-3 pr-1">
            <div *ngFor="let item of stats?.movements" class="flex items-center justify-between group cursor-pointer py-1.5 border-b border-slate-50 last:border-b-0">
              <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10"/></svg>
                </div>
                <div class="min-w-0">
                  <div class="text-xs font-bold text-slate-700 truncate max-w-[150px] sm:max-w-[200px]">{{ item.cliente }}</div>
                  <div class="text-[10px] text-slate-400">{{ item.fecha | date:'shortTime' }} • {{ item.estado | uppercase }}</div>
                </div>
              </div>
              <div class="text-xs font-black text-slate-800">{{ item.monto | currency:'USD':'symbol-narrow':'1.2-2' }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; background-color: transparent; }
    apx-chart { width: 100%; }
    .no-legend-chart ::ng-deep .apexcharts-legend {
      display: none !important;
    }
  `]
})
export class MonitorFlotaComponent implements OnInit {
  stats: any;
  rawStats: any;
  selectedPeriod: string = 'month';
  customStartDate: string = '';
  customEndDate: string = '';
  periods = [
    { id: 'today', label: 'Hoy' },
    { id: 'week', label: 'Esta Semana' },
    { id: 'month', label: 'Este Mes' },
    { id: 'year', label: 'Este Año' },
    { id: 'custom', label: 'Personalizado' }
  ];

  public revenueChartOptions: Partial<ChartOptions> | any;
  public donutChartOptions: Partial<ChartOptions> | any;
  public barChartOptions: Partial<ChartOptions> | any;
  public serviceChartOptions: Partial<ChartOptions> | any;

  constructor(private adminService: AdminService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  setPeriod(period: string) {
    this.selectedPeriod = period;
    if (period !== 'custom') {
      this.loadStats();
    }
  }

  loadStats() {
    this.adminService.getStats(this.selectedPeriod, this.customStartDate, this.customEndDate).subscribe({
      next: (res) => {
        this.stats = res;
        this.initCharts();
      },
      error: (err) => console.error('Error loading stats:', err)
    });
  }

  // Se ejecuta al cambiar los selectores de fecha personalizada
  filterStats() {
    this.loadStats();
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
        height: 380,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: "smooth",
        width: 3,
        colors: ['#0046D5']
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.4,
          opacityTo: 0,
          stops: [20, 100, 100],
          colorStops: [
            { offset: 0, color: '#0046D5', opacity: 0.4 },
            { offset: 100, color: '#0046D5', opacity: 0 }
          ]
        }
      },
      xaxis: {
        type: 'datetime',
        categories: this.stats.charts.revenue.labels,
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          rotate: -45,
          hideOverlappingLabels: true,
          datetimeFormatter: {
            year: 'yyyy',
            month: 'MMM',
            day: 'dd MMM',
            hour: 'HH:mm'
          },
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
        marker: {
          show: true
        },
        x: {
          show: true,
          format: 'dd MMM yyyy'
        },
        y: {
          formatter: (val: number) => `$${val.toFixed(2)}`
        }
      },
      colors: ['#0046D5']
    };

    // 2. Chart de Distribución (Donut - Estados de Viaje)
    this.donutChartOptions = {
      series: this.stats.charts.distribution.data,
      chart: {
        type: "donut",
        height: 150,
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      labels: this.stats.charts.distribution.labels.map((l: string) => l.toUpperCase()),
      colors: ['#0046D5', '#3B82F6', '#1E3A8A', '#94A3B8', '#CBD5E1'],
      dataLabels: { enabled: false },
      legend: {
        position: 'right',
        fontWeight: 600,
        fontSize: '9px',
        labels: { colors: '#64748b' },
        markers: {
          width: 6,
          height: 6,
          radius: 12
        },
        itemMargin: {
          vertical: 1
        }
      },
      tooltip: {
        theme: 'dark',
        style: {
          fontSize: '11px',
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        },
        marker: {
          show: true
        },
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
        height: 240,
        toolbar: { show: false },
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      plotOptions: {
        bar: {
          horizontal: true,
          borderRadius: 8,
          borderRadiusApplication: 'end',
          barHeight: '55%',
          distributed: true
        }
      },
      colors: ['#0046D5', '#3B82F6', '#1E3A8A', '#94A3B8', '#CBD5E1'],
      dataLabels: { enabled: false },
      xaxis: {
        categories: this.stats.charts.routes.map((r: any) => r.ruta),
        labels: { show: false },
        axisBorder: { show: false }
      },
      grid: {
        show: false
      },
      legend: {
        show: false,
        showForSingleSeries: false
      },
      tooltip: {
        theme: 'dark',
        style: {
          fontSize: '12px',
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        },
        marker: {
          show: true
        },
        y: {
          formatter: (val: number) => `${val} viajes`
        }
      }
    };

    // 4. Chart de Servicios (Donut NEW - Semi-Dona)
    const serviceLabels = this.stats.charts.services?.labels || [];
    const serviceData = this.stats.charts.services?.data || [];
    
    this.serviceChartOptions = {
      series: serviceData.length ? serviceData : [0, 0],
      chart: {
        type: "donut",
        height: 150,
        offsetY: 15,
        fontFamily: 'Plus Jakarta Sans, sans-serif',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: {
            enabled: true,
            delay: 150
          },
          dynamicAnimation: {
            enabled: true,
            speed: 350
          }
        }
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
                fontSize: '24px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 700,
                color: '#0F172A',
                offsetY: 5,
                formatter: (val: string) => val
              },
              total: {
                show: true,
                label: 'Total Servicios',
                color: '#64748b',
                fontSize: '10px',
                fontWeight: 600,
                formatter: (w: any) => {
                  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0).toString();
                }
              }
            }
          }
        }
      },
      labels: serviceLabels.map((l: string) => {
        if (l.toLowerCase() === 'vip') return 'PASAJES VIP';
        if (l.toLowerCase() === 'encomienda') return 'ENCOMIENDAS';
        return l.toUpperCase();
      }),
      colors: ['#0046D5', '#3B82F6', '#1E3A8A', '#94A3B8', '#CBD5E1'],
      dataLabels: { enabled: false },
      stroke: {
        show: true,
        width: 3,
        colors: ['#ffffff'],
        lineCap: 'round'
      },
      legend: {
        show: true,
        position: 'right',
        fontSize: '10px',
        fontWeight: 600,
        labels: { colors: '#64748b' },
        markers: {
          width: 8,
          height: 8,
          radius: 12
        },
        itemMargin: {
          vertical: 2
        },
        offsetY: 15
      },
      tooltip: {
        theme: 'dark',
        style: {
          fontSize: '11px',
          fontFamily: 'Plus Jakarta Sans, sans-serif'
        },
        marker: {
          show: true
        },
        y: {
          formatter: (val: number) => `${val} servicios`
        }
      }
    };
  }
}
