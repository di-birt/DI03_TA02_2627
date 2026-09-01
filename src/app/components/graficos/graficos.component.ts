import { Component, input, effect, viewChild, ElementRef, OnDestroy } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { Chart, registerables } from 'chart.js';
import { Seleccion } from '../../interface/seleccion';

// Registra todos los tipos de gráfica y componentes de Chart.js de una vez.
Chart.register(...registerables);

@Component({
  selector: 'app-graficos',
  standalone: true,
  imports: [IonicModule],
  templateUrl: './graficos.component.html',
  styleUrls: ['./graficos.component.scss']
})
export class GraficosComponent implements OnDestroy {

  // input<T>() recibe datos del componente padre mediante un Signal.
  // El padre lo usa así: <app-graficos [selecciones]="selecciones">
  selecciones = input<Seleccion[]>([]);

  // viewChild apunta al <canvas #canvasGoles> del template.
  // Es undefined hasta que Angular construye la vista.
  private canvasLinea = viewChild<ElementRef<HTMLCanvasElement>>('canvasLinea');

  // Guarda la instancia de Chart para destruirla antes de redibujar.
  // Sin esto Chart.js lanzaría el error "Canvas is already in use".
  private charts = new Map<string, Chart>();

  // effect() se re-ejecuta automáticamente cada vez que cambia selecciones()
  // o canvasGoles(). La primera vez los canvas aún no existen (undefined) →
  // el guard los detiene. Cuando Angular los crea, el effect vuelve a dispararse.
  constructor() {
    effect(() => {
      const data      = this.selecciones();
      const canvasLin = this.canvasLinea();
      if (!canvasLin) return;
      this.renderMedia(data, canvasLin.nativeElement);
    });
  }

  // Destruye la instancia anterior para liberar el canvas antes de redibujar.
  private destroyChart(key: string) {
    this.charts.get(key)?.destroy();
    this.charts.delete(key);
  }

  // Gráfico de líneas: media de goles por partido por selección
  private renderMedia(data: Seleccion[], canvas: HTMLCanvasElement) {
    this.destroyChart('media');

    //Si quisieramos ordenarlo descendentemente:
    //const sorted = [...data].sort((a, b) => (b.goles / b.partidos) - (a.goles / a.partidos));
    //Si quisieramos ordenarlo ascendentemente:
    //const sorted = [...data].sort((a, b) => (a.goles / a.partidos) - (b.goles / b.partidos));

    this.charts.set('media', new Chart(canvas, {
      type: 'line',
      data: {
        //labels: sorted.map(s => s.seleccion),
        labels: data.map(s => s.seleccion),
        datasets: [{
          label: 'Media de goles por partido',
          //data: sorted.map(s => parseFloat((s.goles / s.partidos).toFixed(2))),
          data: data.map(s => parseFloat((s.goles / s.partidos).toFixed(2))),
          borderColor: '#eb445a',
          backgroundColor: 'rgba(235, 68, 90, 0.12)',
          borderWidth: 2,
          //El color que le damos al punto.
          pointBackgroundColor: '#eb445a',
          //El tamaño de los puntos de la línea, por defecto 1.
          pointRadius: 5,
          // 0 = línea recta, 1 = máxima curvatura Bézier.
          // Con 0.3 la línea tendrá una ligera suavidad, no es recta del todo pero tampoco muy curvada.
          tension: 0.3,
          fill: true
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          title: {
            display: true,
            text: 'Media de goles por partido — UEFA Euro 2024',
            font: { size: 15, weight: 'bold' },
            color: '#333',
            padding: { bottom: 14 }
          },
          tooltip: {
            callbacks: {
              //label: ctx => ` ${ctx.parsed.y} goles/partido (${sorted[ctx.dataIndex].partidos} partidos)`
              label: ctx => ` ${ctx.parsed.y} goles/partido (${data[ctx.dataIndex].partidos} partidos)`
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: { color: '#555' },
            grid: { color: 'rgba(0,0,0,0.06)' }
          },
          x: {
            ticks: { color: '#555', maxRotation: 45 },
            grid: { display: false }
          }
        }
      }
    }));
  }

  // Angular llama a ngOnDestroy antes de destruir el componente.
  // Destruimos todas las instancias de Chart para liberar memoria y
  // evitar memory leaks si el usuario navega varias veces.
  ngOnDestroy() {
    this.charts.forEach(c => c.destroy());
    this.charts.clear();
  }
}
