import { Type } from '@angular/core';
import { HomeDefault } from '../pages/home/views/home-default/home-default';
import { HomeThreadTrimmer } from '../pages/home/views/home-thread-trimmer/home-thread-trimmer';
import { HomeProductionCoordinator } from '../pages/home/views/home-production-coordinator/home-production-coordinator';
import { HomeStampingCoordinator } from '../pages/home/views/home-stamping-coordinator/home-stamping-coordinator';
import { HomeEngineer } from '../pages/home/views/home-engineer/home-engineer';
import { HomeScreenPrinter } from '../pages/home/views/home-screen-printer/home-screen-printer';

// Keys must match core.HomeView.key rows (assigned per role via core.RoleHomeView).
// Add a new entry here when a new role needs its own home view.
export const homeComponentMap: Record<string, Type<any>> = {
  "HomeThreadTrimmer": HomeThreadTrimmer,
  "HomeProductionCoordinator": HomeProductionCoordinator,
  "HomeStampingCoordinator": HomeStampingCoordinator,
  "HomeEngineer": HomeEngineer,
  "HomeScreenPrinter": HomeScreenPrinter,
};

export { HomeDefault };
