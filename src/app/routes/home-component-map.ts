import { Type } from '@angular/core';
import { HomeDefault } from '../pages/home/views/home-default/home-default';
import { HomeDethornRemover } from '../pages/home/views/home-dethorn-remover/home-dethorn-remover';

// Keys must match exact group names in the database.
// Add a new entry here when a new role needs its own home view.
export const homeComponentMap: Record<string, Type<any>> = {
  "HomeDethornRemover": HomeDethornRemover,
};

export { HomeDefault };
