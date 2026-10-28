// Chart.js draws on a canvas and cannot read Tailwind classes, so the values mirror
// the `@theme` tokens in styles.css (brand) and the Tailwind slate palette.
export const CHART_COLORS = {
  brand: '#180393',
  grid: '#e2e8f0',
  text: '#64748b',
} as const;
