import { StampingReferenceSam } from '../../models/stamping/stamping-reference-sam';

// Machine types (StampingMachineType.name) whose orders are read through
// production-orders/processes and measured in kg. Add a name here to support another type.
const PROCESSES_MACHINE_TYPE_NAMES = ['CALANDRA'];

// An order belongs to a processes machine when any SAM candidate of its reference has such a machine type.
export function isProcessesOrder(referenceSams?: Pick<StampingReferenceSam, 'machine_type_name'>[] | null): boolean {
  return (referenceSams ?? []).some(
    (sam) => !!sam.machine_type_name && PROCESSES_MACHINE_TYPE_NAMES.includes(sam.machine_type_name.trim().toUpperCase()),
  );
}

// Single place that decides the unit quantities are shown in: 'kg' for processes machines, null (the
// existing unit) otherwise. Quantities from production-orders/processes already arrive in kg: never convert.
export function getQuantityUnit(referenceSams?: Pick<StampingReferenceSam, 'machine_type_name'>[] | null): string | null {
  return isProcessesOrder(referenceSams) ? 'kg' : null;
}
