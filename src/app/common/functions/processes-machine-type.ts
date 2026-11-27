import { StampingReferenceSam } from '../../models/stamping/stamping-reference-sam';

// Machine types (StampingMachineType.id) whose orders are read through production-orders/processes.
// Add an id here to support another type.
const PROCESSES_MACHINE_TYPE_IDS = [4]; // CALANDRA

interface MachineTypeSource {
  machineTypeId?: number | null;
  referenceSams?: Pick<StampingReferenceSam, 'machine_type'>[] | null;
}

// Uses the order's machineTypeId (production-orders/processes) when present; otherwise any SAM candidate
// of its reference (stamping-orders/detail) with such a machine type.
export function isProcessesOrder(order?: MachineTypeSource | null): boolean {
  if (order?.machineTypeId != null) return PROCESSES_MACHINE_TYPE_IDS.includes(order.machineTypeId);
  return (order?.referenceSams ?? []).some((sam) => PROCESSES_MACHINE_TYPE_IDS.includes(sam.machine_type));
}

// Single place that decides the unit quantities are shown in: 'kg' for processes machines, null (the
// existing unit) otherwise. Quantities from production-orders/processes are shown as returned: never convert.
export function getQuantityUnit(order?: MachineTypeSource | null): string | null {
  return isProcessesOrder(order) ? 'kg' : null;
}
