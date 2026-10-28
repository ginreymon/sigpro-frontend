import { describe, expect, it } from 'vitest';
import { ModuleEfficiencyRow } from '../../models/production/module-efficiency-row';
import { aggregateEfficiencyByModule } from './dashboard-aggregate';

const row = (moduleId: number, number: number, efficiency: number, name = `M${number}`) =>
  ({ module_id: moduleId, module_number: number, module_name: name, efficiency }) as ModuleEfficiencyRow;

describe('aggregateEfficiencyByModule', () => {
  it('averages only rows with efficiency above 0 and rounds to 2 decimals', () => {
    const result = aggregateEfficiencyByModule([row(1, 1, 80), row(1, 1, 0), row(1, 1, 85.555)]);
    expect(result).toEqual([{ moduleId: 1, label: 'M1', value: 82.78 }]);
  });

  it('returns null for a module without efficiency above 0', () => {
    expect(aggregateEfficiencyByModule([row(1, 1, 0)])[0].value).toBeNull();
  });

  it('sorts by module number and groups one entry per module', () => {
    const result = aggregateEfficiencyByModule([row(2, 5, 70), row(1, 2, 90), row(2, 5, 50)]);
    expect(result.map((p) => [p.moduleId, p.value])).toEqual([[1, 90], [2, 60]]);
  });

  it('falls back to the module number when the name is empty', () => {
    expect(aggregateEfficiencyByModule([row(1, 7, 50, '')])[0].label).toBe('Módulo 7');
  });

  it('returns an empty list without rows', () => {
    expect(aggregateEfficiencyByModule([])).toEqual([]);
  });
});
