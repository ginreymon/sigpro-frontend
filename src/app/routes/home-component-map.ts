import { Type } from '@angular/core';
import { HomeDefault } from '../pages/home/views/home-default/home-default';
import { HomeDethornRemover } from '../pages/home/views/home-dethorn-remover/home-dethorn-remover';
import { HomeProductionCoordinator } from '../pages/home/views/home-production-coordinator/home-production-coordinator';

// Keys must match component keys in the HOME_GRUPOS_VISTA_PERSONALIZADA AppSetting JSON.
// JSON structure: { "ComponentKey": [groupId1, groupId2] }
// Add a new entry here when a new role needs its own home view.
export const homeComponentMap: Record<string, Type<any>> = {
  "HomeDethornRemover": HomeDethornRemover,
  "HomeProductionCoordinator": HomeProductionCoordinator,
};

export { HomeDefault };
