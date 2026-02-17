import { Type } from '@angular/core';
import { Roles } from '../options/admin/roles/roles';
import { Users } from '../options/admin/users/users';
import { DayOperation } from '../options/production/day-operation/day-operation';
import { WorkShifts } from '../options/admin/work-shifts/work-shifts';

export const componentMap: Record<string, Type<any>> = {
  'admin/roles': Roles,
  'admin/users': Users,
  'admin/work-shifts': WorkShifts,
  'production/day-operation': DayOperation,
};
