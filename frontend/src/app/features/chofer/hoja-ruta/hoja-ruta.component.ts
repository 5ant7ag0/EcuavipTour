import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ChoferService } from '../../../core/services/chofer.service';
import { 
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexTooltip,
  ApexStroke,
  ApexYAxis,
  ApexFill,
  ApexGrid,
  ApexLegend,
  ApexNonAxisChartSeries,
  ApexTheme
} from "ng-apexcharts";

export type ChartOptions = {
  series: ApexAxisChartSeries | ApexNonAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  grid: ApexGrid;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  fill: ApexFill;
  labels: string[];
  legend: ApexLegend;
  theme: ApexTheme;
  colors: string[];
};

@Component({
  selector: 'app-hoja-ruta',
  standalone: true,
  imports: [CommonModule, RouterModule, NgApexchartsModule],
  templateUrl: './hoja-ruta.component.html',
  styleUrl: './hoja-ruta.component.css'
})
export class HojaRutaComponent implements OnInit {
  viajesOriginales: any[] = [];
  viajesFiltrados: any[] = [];
  cargando: boolean = true;
  errorMsg: string | null = null;

  // Filtros reactivos
  periodoActivo: 'dia' | 'semana' | 'mes' | 'año' = 'mes';
  filtroEstado: 'todos' | 'finalizado' | 'cancelado' = 'todos';

  // Métricas calculadas
  gananciasFiltradas: number = 0;
  viajesFiltradosConteo: number = 0;
  calificacionFija: number = 4.95;
  tasaAceptacion: string = '98.6%';

  // Opciones de Gráficos (ApexCharts)
  public areaChartOptions!: Partial<ChartOptions> | any;
  public donutChartOptions!: Partial<ChartOptions> | any;

  constructor(private choferService: ChoferService) {}

  ngOnInit() {
    this.cargarHistorial();
  }

  cargarHistorial() {
    this.cargando = true;
    this.errorMsg = null;
    this.choferService.getMisViajes().subscribe({
      next: (res: any[]) => {
        this.viajesOriginales = (res || []).map(v => ({
          ...v,
          monto: Number(v.monto) || 0,
          distancia_km: Number(v.distancia_km) || 0,
          fechaParsed: v.fecha ? new Date(v.fecha.replace(' ', 'T')) : new Date()
        }));
        
        this.initChartOptions();
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (err) => {
        console.error("Error cargando el historial del chofer:", err);
        this.errorMsg = 'No se pudo cargar el historial. Por favor, reintenta más tarde.';
        this.cargando = false;
      }
    });
  }

  cambiarPeriodo(periodo: 'dia' | 'semana' | 'mes' | 'año') {
    this.periodoActivo = periodo;
    this.aplicarFiltros();
  }

  cambiarFiltroEstado(estado: 'todos' | 'finalizado' | 'cancelado') {
    this.filtroEstado = estado;
    this.aplicarFiltros();
  }

  initChartOptions() {
    // 1. Opciones Iniciales del Gráfico de Área (Ganancias)
    this.areaChartOptions = {
      series: [{
        name: "Ganancias",
        data: []
      }],
      chart: {
        type: "area",
        height: 280,
        toolbar: { show: false },
        zoom: { enabled: false },
        fontFamily: 'Inter, system-ui, sans-serif',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800,
          animateGradually: { enabled: true, delay: 150 },
          dynamicAnimation: { enabled: true, speed: 350 }
        }
      },
      dataLabels: { enabled: false },
      stroke: {
        curve: "smooth",
        width: 3.5,
        colors: ['#10b981'] // Verde brillante
      },
      fill: {
        type: "gradient",
        gradient: {
          shadeIntensity: 1,
          opacityFrom: 0.45,
          opacityTo: 0.05,
          stops: [0, 90, 100],
          colorStops: [
            { offset: 0, color: '#10b981', opacity: 0.4 },
            { offset: 100, color: '#10b981', opacity: 0 }
          ]
        }
      },
      xaxis: {
        categories: [],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: {
          style: { colors: '#64748b', fontWeight: 600, fontSize: '10px' }
        }
      },
      yaxis: {
        labels: {
          style: { colors: '#64748b', fontWeight: 600, fontSize: '10px' },
          formatter: (val: number) => `$${val.toFixed(2)}`
        }
      },
      grid: {
        borderColor: '#f1f5f9',
        strokeDashArray: 5,
        padding: { left: 10, right: 10 }
      },
      tooltip: {
        theme: 'light',
        x: { show: true },
        y: {
          formatter: (val: number) => `$${val.toFixed(2)}`
        }
      },
      colors: ['#10b981']
    };

    // 2. Opciones Iniciales del Gráfico de Dona (Distribución)
    this.donutChartOptions = {
      series: [],
      chart: {
        type: "donut",
        height: 280,
        fontFamily: 'Inter, system-ui, sans-serif',
        animations: {
          enabled: true,
          easing: 'easeinout',
          speed: 800
        }
      },
      labels: ['Pasajes VIP / Regular', 'Encomiendas / Carga'],
      colors: ['#3b82f6', '#818cf8'], // Azules corporativos Ecuavip
      dataLabels: { enabled: false },
      legend: {
        position: 'bottom',
        fontWeight: 600,
        labels: { colors: '#475569' }
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'TOTAL',
                color: '#64748b',
                fontWeight: 700,
                fontSize: '11px',
                formatter: (w: any) => {
                  return w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0) + ' serv';
                }
              }
            }
          }
        }
      },
      tooltip: {
        y: {
          formatter: (val: number) => `${val} viajes`
        }
      }
    };
  }

  aplicarFiltros() {
    const ahora = new Date();
    
    // 1. Filtrar viajes para el panel basándose en el período de tiempo
    const viajesPeriodo = this.viajesOriginales.filter(v => {
      if (v.estado_logistico !== 'finalizado') return false;

      const diffTime = Math.abs(ahora.getTime() - v.fechaParsed.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (this.periodoActivo === 'dia') {
        return diffDays <= 1 && v.fechaParsed.toDateString() === ahora.toDateString();
      } else if (this.periodoActivo === 'semana') {
        return diffDays <= 7;
      } else if (this.periodoActivo === 'mes') {
        return diffDays <= 30;
      } else if (this.periodoActivo === 'año') {
        return diffDays <= 365;
      }
      return true;
    });

    // Calcular KPI rápidos
    this.gananciasFiltradas = viajesPeriodo.reduce((acc, curr) => acc + curr.monto, 0);
    this.viajesFiltradosConteo = viajesPeriodo.length;

    // 2. Generar datos para Area Chart (Rendimiento de Ganancias)
    this.generarDatosAreaChart(viajesPeriodo);

    // 3. Generar datos para Donut Chart (Distribución Pasajes vs Encomiendas)
    this.generarDatosDonutChart(viajesPeriodo);

    // 4. Filtrar el listado histórico inferior
    this.viajesFiltrados = this.viajesOriginales.filter(v => {
      if (this.filtroEstado === 'todos') {
        return true;
      } else if (this.filtroEstado === 'finalizado') {
        return v.estado_logistico === 'finalizado';
      } else if (this.filtroEstado === 'cancelado') {
        return v.estado_logistico === 'cancelado';
      }
      return true;
    });
  }

  generarDatosAreaChart(viajes: any[]) {
    let categories: string[] = [];
    let seriesData: number[] = [];

    if (this.periodoActivo === 'dia') {
      // Por horas del día actual
      categories = ['06:00', '09:00', '12:00', '15:00', '18:00', '21:00'];
      seriesData = [0, 0, 0, 0, 0, 0];
      
      viajes.forEach(v => {
        const hour = v.fechaParsed.getHours();
        if (hour < 9) seriesData[0] += v.monto;
        else if (hour < 12) seriesData[1] += v.monto;
        else if (hour < 15) seriesData[2] += v.monto;
        else if (hour < 18) seriesData[3] += v.monto;
        else if (hour < 21) seriesData[4] += v.monto;
        else seriesData[5] += v.monto;
      });

    } else if (this.periodoActivo === 'semana') {
      // Por días de la semana
      categories = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
      seriesData = [0, 0, 0, 0, 0, 0, 0];

      viajes.forEach(v => {
        // getDay() retorna 0 para Domingo, 1 para Lunes, etc.
        const day = v.fechaParsed.getDay();
        const index = day === 0 ? 6 : day - 1; // Mapear Lun=0 a Dom=6
        seriesData[index] += v.monto;
      });

    } else if (this.periodoActivo === 'mes') {
      // Agrupado por semanas del mes
      categories = ['Semana 1', 'Semana 2', 'Semana 3', 'Semana 4'];
      seriesData = [0, 0, 0, 0];

      viajes.forEach(v => {
        const date = v.fechaParsed.getDate();
        if (date <= 7) seriesData[0] += v.monto;
        else if (date <= 14) seriesData[1] += v.monto;
        else if (date <= 21) seriesData[2] += v.monto;
        else seriesData[3] += v.monto;
      });

    } else if (this.periodoActivo === 'año') {
      // Agrupado por trimestres para simplificar el gráfico
      categories = ['Trim. 1', 'Trim. 2', 'Trim. 3', 'Trim. 4'];
      seriesData = [0, 0, 0, 0];

      viajes.forEach(v => {
        const month = v.fechaParsed.getMonth(); // 0-11
        if (month < 3) seriesData[0] += v.monto;
        else if (month < 6) seriesData[1] += v.monto;
        else if (month < 9) seriesData[2] += v.monto;
        else seriesData[3] += v.monto;
      });
    }

    // Actualizar reactivamente las opciones del gráfico
    if (this.areaChartOptions) {
      this.areaChartOptions = {
        ...this.areaChartOptions,
        series: [{
          name: "Ganancias",
          data: seriesData.map(v => Number(v.toFixed(2)))
        }],
        xaxis: {
          ...this.areaChartOptions.xaxis,
          categories: categories
        }
      };
    }
  }

  generarDatosDonutChart(viajes: any[]) {
    let pasajeros = 0;
    let encomiendas = 0;

    viajes.forEach(v => {
      const tipo = (v.tipo_servicio || '').toLowerCase();
      if (tipo.includes('encomienda') || tipo.includes('carga') || tipo.includes('paquete')) {
        encomiendas++;
      } else {
        pasajeros++;
      }
    });

    // Actualizar reactivamente las series del gráfico
    if (this.donutChartOptions) {
      this.donutChartOptions = {
        ...this.donutChartOptions,
        series: [pasajeros, encomiendas]
      };
    }
  }

  getIconoServicio(tipo: string): string {
    const t = (tipo || '').toLowerCase();
    if (t.includes('encomienda') || t.includes('carga') || t.includes('paquete')) {
      return 'package';
    }
    return 'car';
  }
}
