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
