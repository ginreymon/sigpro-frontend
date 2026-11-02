// Filters shared by app-stamping-record (create) and app-stamping-quantity-modal (edit): SAM references are
// narrowed client-side by the active module's machine type; additional times are filtered by the backend.
export function filterByMachineType<T extends { machine_type?: number | null }>(
  items: T[],
  moduleMachineTypeId: number | null,
): T[] {
  if (!moduleMachineTypeId) return items;
  return items.filter((item) => item.machine_type == null || item.machine_type === moduleMachineTypeId);
}

// Query params for additional-times/all/: the backend keeps the times of the module's machine type and either
// no specific machine or its own machine.
export function moduleMachineParams(
  machine: { id?: number | null; machine_type_id?: number | null } | null | undefined,
): Record<string, number> {
  return {
    ...(machine?.machine_type_id ? { module_machine_type: machine.machine_type_id } : {}),
    ...(machine?.id ? { module_machine: machine.id } : {}),
  };
}
