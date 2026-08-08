// Filtros compartidos entre app-stamping-record (crear) y app-stamping-quantity-modal
// (editar): tiempos adicionales y referencias SAM se acotan primero por tipo de
// máquina del módulo activo, y opcionalmente por máquina específica.
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
