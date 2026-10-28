import { ChartConfiguration } from 'chart.js';
import { CHART_COLORS } from '../chart-palette';

const SCALE_STEP = 20;

// Efficiency is not capped at 100 in the backend, so the scale grows to the next step
// when a module exceeds it instead of clipping the point.
function scaleMax(values: (number | null)[], target: number | null): number {
  const highest = Math.max(100, target ?? 0, ...values.map((v) => v ?? 0));
  return Math.ceil(highest / SCALE_STEP) * SCALE_STEP;
}

// Radar with one axis per label. `target` (optional) is drawn as a dashed ring for comparison.
export function buildEfficiencyRadarConfig(
  labels: string[],
  values: (number | null)[],
  seriesLabel: string,
  color: string,
  target: number | null,
  targetLabel: string,
): ChartConfiguration {
  const formatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
  const datasets: ChartConfiguration['data']['datasets'] = [
    {
      label: seriesLabel,
      data: values,
      borderColor: color,
      backgroundColor: `${color}33`,
      pointBackgroundColor: color,
      fill: true,
      spanGaps: true,
    },
  ];
  if (target !== null) {
    datasets.push({
      label: targetLabel,
      data: labels.map(() => target),
      borderColor: CHART_COLORS.text,
      borderDash: [4, 4],
      borderWidth: 1,
      pointRadius: 0,
      fill: false,
    });
  }

  return {
    type: 'radar',
    data: { labels, datasets },
    options: {
      responsive: true,
      locale: 'es-CO',
      plugins: {
        legend: { position: 'bottom', labels: { usePointStyle: true } },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ${ctx.parsed.r === null ? 'No disponible' : `${formatter.format(ctx.parsed.r)} %`}`,
          },
        },
      },
      scales: {
        r: {
          min: 0,
          max: scaleMax(values, target),
          ticks: { stepSize: SCALE_STEP, callback: (v) => `${v}%`, backdropColor: 'rgba(255, 255, 255, 0.8)' },
        },
      },
    },
  };
}
