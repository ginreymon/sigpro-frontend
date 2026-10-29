// Chart.js draws on a canvas and cannot read Tailwind classes, so the values mirror
// the `@theme` tokens in styles.css (brand) and the Tailwind slate palette.
export const CHART_COLORS = {
  brand: '#180393',
  grid: '#e2e8f0',
  text: '#64748b',
  // Efficiency target line (amber, chosen by the product owner).
  target: '#FFB000',
} as const;

// Categorical series colors (Okabe-Ito based, color-blind safe) for one line per module. Assigned
// by module position and cycled; dash/marker styles below repeat on a different cycle so two
// lines that share a color still differ without relying on color alone.
export const SERIES_COLORS = [
  '#0072B2',
  '#D55E00',
  '#009E73',
  '#CC79A7',
  '#56B4E9',
  '#E69F00',
  '#6A3D9A',
  '#525252',
] as const;
export const SERIES_DASHES: number[][] = [[], [6, 3], [2, 3]];
export const SERIES_POINT_STYLES = ['circle', 'rect', 'triangle', 'rectRot'] as const;
