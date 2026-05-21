import { Type } from '@angular/core';
import { Roles } from '../options/admin/roles/roles';
import { Users } from '../options/admin/users/users';
import { DayOperation } from '../options/production/day-operation/day-operation';
import { WorkShifts } from '../options/admin/work-shifts/work-shifts';
import { Modules } from '../options/admin/modules/modules';
import { WorkBreaks } from '../options/admin/work-breaks/work-breaks';
import { Orders } from '../options/production/orders/orders';
import { SewingSAM } from '../options/production/sewing-sam/sewing-sam';
import { ModuleEfficiencyPage } from '../options/production/module-efficiency/module-efficiency';

export const componentMap: Record<string, Type<any>> = {
  'admin/roles': Roles,
  'admin/users': Users,
  'admin/work-shifts': WorkShifts,
  'admin/modules': Modules,
  'admin/work-breaks': WorkBreaks,
  'production/day-operation': DayOperation,
  'production/orders': Orders,
  'production/sewing-sam': SewingSAM,
  'production/module-efficiency': ModuleEfficiencyPage
};
