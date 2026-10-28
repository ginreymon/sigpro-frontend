import { ChartConfiguration } from 'chart.js';
import { DailyPoint } from '../../common/functions/dashboard-aggregate';

// "2026-08-05" -> "05/08"
function shortDate(isoDate: string): string {
  const [, month, day] = isoDate.split('-');
  return `${day}/${month}`;
}

// Line chart of one value per day; `yTitle` carries the unit (e.g. "Eficiencia (%)").
export function buildDailyTrendConfig(
  points: DailyPoint[],
  seriesLabel: string,
  color: string,
  yTitle: string,
): ChartConfiguration {
  return {
    type: 'line',
    data: {
      labels: points.map((p) => shortDate(p.date)),
      datasets: [
        {
          label: seriesLabel,
          data: points.map((p) => p.value),
          borderColor: color,
          backgroundColor: color,
          tension: 0.25,
          spanGaps: true,
        },
      ],
    },
    options: {
      responsive: true,
      locale: 'es-CO',
      plugins: { legend: { position: 'bottom', labels: { usePointStyle: true } } },
      scales: { y: { beginAtZero: true, title: { display: true, text: yTitle } } },
    },
  };
}
