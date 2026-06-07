import { Type } from '@angular/core';
import { Roles } from '../options/admin/roles/roles';
import { Users } from '../options/admin/users/users';
import { DayOperation } from '../options/production/day-operation/day-operation';
import { WorkShifts } from '../options/admin/work-shifts/work-shifts';
import { Modules } from '../options/admin/modules/modules';
import { WorkBreaks } from '../options/admin/work-breaks/work-breaks';
import { ShiftCycles } from '../options/production/shift-cycles/shift-cycles';
import { SewingSAM } from '../options/production/sewing-sam/sewing-sam';
import { AppSettings } from '../options/configuration/app-settings/app-settings';
import { ModulePanel } from '../options/production/module-panel/module-panel';
import { OrderDetail } from '../options/production/order-detail/order-detail';
import { DataExport } from '../options/production/data-export/data-export';

export const componentMap: Record<string, Type<any>> = {
  'admin/roles': Roles,
  'admin/users': Users,
  'admin/work-shifts': WorkShifts,
  'admin/modules': Modules,
  'admin/work-breaks': WorkBreaks,
  'production/day-operation': DayOperation,
  'production/shift-cycles': ShiftCycles,
  'production/sewing-sam': SewingSAM,
  'production/data-export': DataExport,
  'production/module-panel': ModulePanel,
  'production/order-detail': OrderDetail,
  'configuration/app-settings': AppSettings,
};
