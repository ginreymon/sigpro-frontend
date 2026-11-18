import { Type } from '@angular/core';

// Each page is loaded on demand (own chunk) the first time its route is visited.
export type ComponentLoader = () => Promise<Type<any>>;

export const componentMap: Record<string, ComponentLoader> = {
  'configuration/app-settings': () => import('../options/configuration/app-settings/app-settings').then((m) => m.AppSettings),
  'admin/roles': () => import('../options/admin/roles/roles').then((m) => m.Roles),
  'admin/users': () => import('../options/admin/users/users').then((m) => m.Users),
  'admin/work-shifts': () => import('../options/admin/work-shifts/work-shifts').then((m) => m.WorkShifts),
  'admin/modules': () => import('../options/admin/modules/modules').then((m) => m.Modules),
  'admin/work-breaks': () => import('../options/admin/work-breaks/work-breaks').then((m) => m.WorkBreaks),
  'admin/restricted-work-time': () => import('../options/admin/restricted-work-time/restricted-work-time').then((m) => m.RestrictedWorkTime),
  'admin/general-config': () => import('../options/admin/general-config/general-config').then((m) => m.GeneralConfig),
  'admin/sewing-sam': () => import('../options/admin/sewing-sam/sewing-sam').then((m) => m.SewingSAM),
  'admin/stamping-sam': () => import('../options/admin/stamping-sam/stamping-sam').then((m) => m.StampingSam),
  'stamping/stamping-sam': () => import('../options/admin/stamping-sam/stamping-sam').then((m) => m.StampingSam),
  'production/sewing-sam': () => import('../options/admin/sewing-sam/sewing-sam').then((m) => m.SewingSAM),
  'production/day-operation': () => import('../shared/pages/shift-workflow/day-operation/day-operation').then((m) => m.DayOperation),
  'production/shift-cycles': () => import('../shared/pages/shift-workflow/shift-cycles-entry/shift-cycles-entry').then((m) => m.ShiftCyclesEntry),
  'production/data-export': () => import('../shared/pages/shift-workflow/data-export/data-export').then((m) => m.DataExport),
  'stamping/data-export': () => import('../shared/pages/shift-workflow/data-export/data-export').then((m) => m.DataExport),
  'production/module-panel': () => import('../options/production/module-panel/module-panel').then((m) => m.ModulePanel),
  'production/sewing-config': () => import('../options/production/sewing-config/sewing-config').then((m) => m.SewingConfig),
  'production/order-detail': () => import('../options/production/order-detail/order-detail').then((m) => m.OrderDetail),
  'stamping/processes': () => import('../options/stamping/processes/processes').then((m) => m.Processes),
  'stamping/machine-types': () => import('../options/stamping/machine-types/machine-types').then((m) => m.MachineTypes),
  'stamping/machines': () => import('../options/stamping/machines/machines').then((m) => m.Machines),
  'stamping/additional-times': () => import('../options/stamping/additional-times/additional-times').then((m) => m.AdditionalTimes),
  'stamping/machines-config': () => import('../options/stamping/machines-config/machines-config').then((m) => m.MachinesConfig),
  'stamping/day-operation': () => import('../shared/pages/shift-workflow/day-operation/day-operation').then((m) => m.DayOperation),
  'stamping/shift-cycles': () => import('../shared/pages/shift-workflow/shift-cycles-entry/shift-cycles-entry').then((m) => m.ShiftCyclesEntry),
  'stamping/machine-panel': () => import('../options/stamping/machine-panel/machine-panel').then((m) => m.MachinePanel),
  'stamping/auditory': () => import('../options/stamping/auditory/auditory').then((m) => m.StampingAuditory),
  'integration/siesa-outbound': () => import('../options/integration/siesa-outbound/siesa-outbound').then((m) => m.SiesaOutbound),
  'integration/manual-integration': () => import('../shared/pages/integration/manual-integration/manual-integration').then((m) => m.ManualIntegration),
};
