import { ChartConfiguration } from 'chart.js';
import { DailyPoint, ModuleDailySeries } from '../../common/functions/dashboard-aggregate';
import { SERIES_COLORS, SERIES_DASHES, SERIES_POINT_STYLES } from '../chart-palette';

// "2026-08-05" -> "5": the month is already in the chart title, so the axis shows the day only.
function dayOfMonth(isoDate: string): string {
  return String(Number(isoDate.split('-')[2]));
}

// Style of the module at `index`; it depends on the module position (not on which ones are
// visible) so a module keeps its color and dash when others are hidden.
export function moduleSeriesStyle(index: number) {
  return {
    color: SERIES_COLORS[index % SERIES_COLORS.length],
    dash: SERIES_DASHES[index % SERIES_DASHES.length],
    pointStyle: SERIES_POINT_STYLES[index % SERIES_POINT_STYLES.length],
  };
}

// Line chart of one value per day; `yTitle` carries the unit (e.g. "Eficiencia (%)").
// The area line is thick; `modules` adds one thinner line each, aligned to the area's days.
export function buildDailyTrendConfig(
  points: DailyPoint[],
  seriesLabel: string,
  color: string,
  yTitle: string,
  modules: { series: ModuleDailySeries; index: number }[] = [],
  hasModuleSeries = false,
): ChartConfiguration {
  const moduleDatasets = modules.map(({ series, index }) => {
    const style = moduleSeriesStyle(index);
    const byDate = new Map(series.points.map((p) => [p.date, p.value]));
    return {
      label: series.label,
      data: points.map((p) => byDate.get(p.date) ?? null),
      borderColor: style.color,
      backgroundColor: style.color,
      borderDash: style.dash,
      pointStyle: style.pointStyle,
      borderWidth: 2,
      pointRadius: 3,
      tension: 0.25,
      spanGaps: true,
    };
  });
  return {
    type: 'line',
    data: {
      labels: points.map((p) => dayOfMonth(p.date)),
      datasets: [
        {
          label: seriesLabel,
          data: points.map((p) => p.value),
          borderColor: color,
          backgroundColor: color,
          borderWidth: hasModuleSeries ? 4 : 3,
          tension: 0.25,
          spanGaps: true,
        },
        ...moduleDatasets,
      ],
    },
    options: {
      responsive: true,
      locale: 'es-CO',
      // With module lines available, the selector chips act as the legend.
      plugins: {
        legend: { display: !hasModuleSeries, position: 'bottom', labels: { usePointStyle: true } },
      },
      scales: { y: { beginAtZero: true, title: { display: true, text: yTitle } } },
    },
  };
}
