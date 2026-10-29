import { ChartConfiguration } from 'chart.js';
import { CHART_COLORS } from '../chart-palette';

const SCALE_STEP = 20;
// Axis labels longer than this are cut so neighbouring labels do not overlap; the tooltip keeps the full name.
const MAX_AXIS_LABEL_LENGTH = 16;
// Target line thickness (px): thick enough to stand out over the series.
const TARGET_LINE_WIDTH = 3;

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
      borderColor: CHART_COLORS.target,
      borderDash: [6, 4],
      borderWidth: TARGET_LINE_WIDTH,
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
          pointLabels: {
            font: { size: 11 },
            callback: (label) =>
              label.length > MAX_AXIS_LABEL_LENGTH ? `${label.slice(0, MAX_AXIS_LABEL_LENGTH - 1)}…` : label,
          },
          ticks: { stepSize: SCALE_STEP, callback: (v) => `${v}%`, backdropColor: 'rgba(255, 255, 255, 0.8)' },
        },
      },
    },
  };
}

// Horizontal bars, one per label: readable with any number of axes (the radar needs 3+).
// `target` (optional) is drawn as a dashed vertical line with its label.
export function buildEfficiencyBarConfig(
  labels: string[],
  values: (number | null)[],
  seriesLabel: string,
  color: string,
  target: number | null,
  targetLabel: string,
): ChartConfiguration {
  const formatter = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 2 });
  return {
    type: 'bar',
    data: {
      labels,
      datasets: [{ label: seriesLabel, data: values, backgroundColor: color, borderRadius: 3 }],
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      locale: 'es-CO',
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) =>
              `${ctx.dataset.label}: ${ctx.parsed.x === null ? 'No disponible' : `${formatter.format(ctx.parsed.x)} %`}`,
          },
        },
      },
      scales: {
        x: {
          min: 0,
          max: scaleMax(values, target),
          ticks: { stepSize: SCALE_STEP, callback: (v) => `${v}%` },
        },
      },
    },
    plugins:
      target === null
        ? []
        : [
            {
              id: 'targetLine',
              afterDatasetsDraw: (chart) => {
                const { ctx, chartArea, scales } = chart;
                const x = scales['x'].getPixelForValue(target);
                ctx.save();
                ctx.strokeStyle = CHART_COLORS.target;
                ctx.fillStyle = CHART_COLORS.target;
                ctx.setLineDash([6, 4]);
                ctx.lineWidth = TARGET_LINE_WIDTH;
                ctx.beginPath();
                ctx.moveTo(x, chartArea.top);
                ctx.lineTo(x, chartArea.bottom);
                ctx.stroke();
                ctx.setLineDash([]);
                const text = `${targetLabel}: ${formatter.format(target)} %`;
                // Keep the chart font (set by ui-chart) and only make it bold.
                ctx.font = `bold ${ctx.font}`;
                ctx.textBaseline = 'middle';
                // Centered on the top bar in white when the text fits (contrast on the brand fill);
                // otherwise beside the target line in red.
                const topBar = chart.getDatasetMeta(0).data[0] as unknown as
                  | { x: number; y: number; base: number }
                  | undefined;
                const barWidth = topBar ? topBar.x - topBar.base : 0;
                if (topBar && barWidth > ctx.measureText(text).width + 16) {
                  ctx.fillStyle = '#ffffff';
                  ctx.textAlign = 'center';
                  ctx.fillText(text, (topBar.base + topBar.x) / 2, topBar.y);
                } else {
                  ctx.textAlign = 'right';
                  ctx.fillText(text, x - 4, chartArea.top + 10);
                }
                ctx.restore();
              },
            },
          ],
  };
}
