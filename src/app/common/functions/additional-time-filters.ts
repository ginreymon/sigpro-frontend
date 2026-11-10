// Filters shared by app-stamping-record: additional times and SAM references are
// narrowed first by the active module's machine type, and optionally by a specific machine.
export function filterByMachineType<T extends { machine_type?: number | null }>(
  items: T[],
  moduleMachineTypeId: number | null,
): T[] {
  if (!moduleMachineTypeId) return items;
  return items.filter((item) => item.machine_type == null || item.machine_type === moduleMachineTypeId);
}

export function filterByMachine<T extends { machine?: number | null }>(
  items: T[],
  moduleMachineId: number | null,
): T[] {
  if (!moduleMachineId) return items;
  return items.filter((item) => item.machine == null || item.machine === moduleMachineId);
}
