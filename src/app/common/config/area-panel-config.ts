import { Type } from '@angular/core';
import { HomeProductionShiftCard } from '../../shared/components/production/cards/home-production-shift-card/home-production-shift-card';
import { HomeStampingShiftCard } from '../../shared/components/production/cards/home-stamping-shift-card/home-stamping-shift-card';

export interface AreaPanelConfig {
  /** Route of the area panel, as `<module.url>/<option.url>` (same key as the user's menu and componentMap). */
  route: string;
  /** Label of the Home button that opens the panel. */
  label: string;
  /** Shift summary card shown on the area's Home view. */
  shiftCard: Type<unknown>;
}

/**
 * Single source of truth linking an area to its panel route and Home card.
 * To add an area: register its route in `component-map.ts` and add one entry here.
 */
export const AREA_PANELS = {
  production: { label: 'Panel de producción', route: 'production/module-panel', shiftCard: HomeProductionShiftCard },
  stamping: { label: 'Panel de estampación', route: 'stamping/machine-panel', shiftCard: HomeStampingShiftCard },
} as const satisfies Record<string, AreaPanelConfig>;

export type AreaKey = keyof typeof AREA_PANELS;
