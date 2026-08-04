import { Type } from '@angular/core';
import { HomeDefault } from '../pages/home/views/home-default/home-default';
import { HomeThreadTrimmer } from '../pages/home/views/home-thread-trimmer/home-thread-trimmer';
import { HomeProductionCoordinator } from '../pages/home/views/home-production-coordinator/home-production-coordinator';
import { HomeStampingCoordinator } from '../pages/home/views/home-stamping-coordinator/home-stamping-coordinator';
import { HomeEngineer } from '../pages/home/views/home-engineer/home-engineer';
import { HomeScreenPrinter } from '../pages/home/views/home-screen-printer/home-screen-printer';

// Keys must match component keys in the HOME_ROLE_BASED_VIEWS AppSetting JSON.
// JSON structure: { "ComponentKey": [groupId1, groupId2] }
// Add a new entry here when a new role needs its own home view.
// NOTE: "HomeDethornRemover" key kept as-is (matches the DB config value) even
// though the component/class was renamed to HomeThreadTrimmer — the map key is
// an opaque identifier stored in core_app_setting, not tied to the class name.
export const homeComponentMap: Record<string, Type<any>> = {
  "HomeDethornRemover": HomeThreadTrimmer,
  "HomeProductionCoordinator": HomeProductionCoordinator,
  "HomeStampingCoordinator": HomeStampingCoordinator,
  "HomeEngineer": HomeEngineer,
  "HomeScreenPrinter": HomeScreenPrinter,
};

export { HomeDefault };
