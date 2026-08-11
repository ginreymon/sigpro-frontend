import { Type } from '@angular/core';
import { Roles } from '../options/admin/roles/roles';
import { Users } from '../options/admin/users/users';
import { DayOperation } from '../shared/pages/day-operation/day-operation';
import { WorkShifts } from '../options/admin/work-shifts/work-shifts';
import { Modules } from '../options/admin/modules/modules';
import { WorkBreaks } from '../options/admin/work-breaks/work-breaks';
import { ShiftCycles } from '../shared/pages/shift-cycles/shift-cycles';
import { SewingSAM } from '../options/admin/sewing-sam/sewing-sam';
import { AppSettings } from '../options/configuration/app-settings/app-settings';
import { ModulePanel } from '../options/production/module-panel/module-panel';
import { OrderDetail } from '../options/production/order-detail/order-detail';
import { DataExport } from '../shared/pages/data-export/data-export';
import { TechnicalSheetPage } from '../options/catalog/technical-sheet/technical-sheet';
import { Processes } from '../options/stamping/processes/processes';
import { MachineTypes } from '../options/stamping/machine-types/machine-types';
import { Machines } from '../options/stamping/machines/machines';
import { StampingSam } from '../options/admin/stamping-sam/stamping-sam';
import { AdditionalTimes } from '../options/stamping/additional-times/additional-times';
import { MachinesConfig } from '../options/stamping/machines-config/machines-config';
import { SewingConfig } from '../options/production/sewing-config/sewing-config';
import { MachinePanel } from '../options/stamping/machine-panel/machine-panel';
import { StampingAuditory } from '../options/stamping/auditory/auditory';

export const componentMap: Record<string, Type<any>> = {
  'configuration/app-settings': AppSettings,
  'admin/roles': Roles,
  'admin/users': Users,
  'admin/work-shifts': WorkShifts,
  'admin/modules': Modules,
  'admin/work-breaks': WorkBreaks,
  'admin/sewing-sam': SewingSAM,
  'admin/stamping-sam': StampingSam,
  'stamping/stamping-sam': StampingSam,
  'production/sewing-sam': SewingSAM,
  'production/day-operation': DayOperation,
  'production/shift-cycles': ShiftCycles,
  'production/data-export': DataExport,
  'production/module-panel': ModulePanel,
  'production/sewing-config': SewingConfig,
  'production/order-detail': OrderDetail,
  'catalog/technical-sheet': TechnicalSheetPage,
  'stamping/processes': Processes,
  'stamping/machine-types': MachineTypes,
  'stamping/machines': Machines,
  'stamping/additional-times': AdditionalTimes,
  'stamping/machines-config': MachinesConfig,
  'stamping/day-operation': DayOperation,
  'stamping/shift-cycles': ShiftCycles,
  'stamping/machine-panel': MachinePanel,
  'stamping/auditory': StampingAuditory,
};
