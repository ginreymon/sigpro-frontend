import { describe, expect, it } from 'vitest';
import { buildEfficiencyRadarConfig } from './efficiency-radar-chart.config';

const build = (values: (number | null)[], target: number | null = null) =>
  buildEfficiencyRadarConfig(values.map((_, i) => `M${i}`), values, 'Confección', '#180393', target, 'Meta');

describe('buildEfficiencyRadarConfig', () => {
  it('builds a radar with one dataset and no target ring by default', () => {
    const config = build([80, 90, 70]);
    expect(config.type).toBe('radar');
    expect(config.data.datasets).toHaveLength(1);
    expect(config.data.labels).toEqual(['M0', 'M1', 'M2']);
  });

  it('adds a dashed target dataset with one value per axis', () => {
    const target = build([80, 90, 70], 85).data.datasets[1];
    expect(target.data).toEqual([85, 85, 85]);
    expect((target as { borderDash?: number[] }).borderDash).toBeDefined();
  });

  it('keeps the 0-100 scale and grows it in steps of 20 above 100', () => {
    expect((build([80, 90, 70]).options?.scales as any).r.max).toBe(100);
    expect((build([80, 112, 70]).options?.scales as any).r.max).toBe(120);
  });

  it('keeps null values as gaps', () => {
    expect(build([80, null, 70]).data.datasets[0].data).toEqual([80, null, 70]);
  });
});
