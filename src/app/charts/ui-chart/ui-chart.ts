import { Component, DestroyRef, ElementRef, effect, inject, input, signal, viewChild } from '@angular/core';
import type { Chart, ChartConfiguration } from 'chart.js';
import { CHART_COLORS } from '../chart-palette';

// Chart.js is loaded on first use so it stays out of the initial bundle. Only the
// pieces used by the dashboard are registered to keep that chunk small.
let chartJs: Promise<typeof import('chart.js')> | undefined;

function loadChartJs(): Promise<typeof import('chart.js')> {
  chartJs ??= import('chart.js').then((lib) => {
    lib.Chart.register(
      lib.BarController,
      lib.BarElement,
      lib.CategoryScale,
      lib.Legend,
      lib.LinearScale,
      lib.LineController,
      lib.LineElement,
      lib.PointElement,
      lib.RadarController,
      lib.RadialLinearScale,
      lib.Filler,
      lib.Tooltip,
    );
    lib.Chart.defaults.maintainAspectRatio = false;
    // Same font as the UI (--font-display in styles.css); the literal is only a fallback.
    const uiFont = getComputedStyle(document.documentElement).getPropertyValue('--font-display').trim();
    lib.Chart.defaults.font.family = uiFont || "'Hanken Grotesk', sans-serif";
    lib.Chart.defaults.color = CHART_COLORS.text;
    lib.Chart.defaults.borderColor = CHART_COLORS.grid;
    return lib;
  });
  return chartJs;
}

@Component({
  selector: 'app-ui-chart',
  template: `
    <div class="relative w-full h-full">
      <canvas #canvas role="img" [attr.aria-label]="ariaLabel()"></canvas>
    </div>
    @if (failed()) {
      <p class="absolute inset-0 flex items-center justify-center text-center text-sm text-slate-500" role="alert">
        No se pudo mostrar el gráfico.
      </p>
    }
  `,
  host: { class: 'relative block' },
})
export class UiChart {
  readonly config = input.required<ChartConfiguration>();
  readonly ariaLabel = input.required<string>();

  private readonly canvas = viewChild<ElementRef<HTMLCanvasElement>>('canvas');
  private chart?: Chart;
  private destroyed = false;
  protected readonly failed = signal(false);

  constructor() {
    effect(() => {
      const el = this.canvas()?.nativeElement;
      const config = this.config();
      if (!el) return;

      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      loadChartJs().then((lib) => {
        // The component may have been destroyed while the library was loading.
        if (this.destroyed) return;
        this.chart?.destroy();
        this.chart = new lib.Chart(el, {
          ...config,
          options: {
            ...config.options,
            animation: reduceMotion ? false : config.options?.animation,
          },
        });
      }).catch(() => this.failed.set(true));
    });

    // Chart.js resizes with its container (responsive); destroy releases canvas and listeners.
    inject(DestroyRef).onDestroy(() => {
      this.destroyed = true;
      this.chart?.destroy();
    });
  }
}
