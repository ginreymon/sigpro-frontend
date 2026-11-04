export interface TepTime {
  hours: number;
  minutes: number;
}

export interface TepTimeParams {
  // Units picked in the OP.
  units: number;
  // seconds_by_unit + additional_seconds_by_unit of the OP.
  secondsPerUnit: number;
  // Extra seconds for the whole selection (not per unit).
  extraSeconds: number;
  // MAX(Cantidad_Base_Ruta) of the OP (base_route_quantity of the document); null when it has none.
  baseRouteQuantity: number | null;
}

// Fixed amount subtracted from base_route_quantity in the recorded time mode.
const BASE_ROUTE_QUANTITY_OFFSET = 10;

// Seconds per unit of an OP: seconds_by_unit plus additional_seconds_by_unit (either may be null).
export function opSecondsPerUnit(op: {
  seconds_by_unit?: number | string | null;
  additional_seconds_by_unit?: number | string | null;
}): number {
  return Number(op.seconds_by_unit ?? 0) + Number(op.additional_seconds_by_unit ?? 0);
}

function secondsToTepTime(seconds: number): TepTime {
  const totalMinutes = Math.round(seconds / 60);
  return { hours: Math.floor(totalMinutes / 60), minutes: totalMinutes % 60 };
}

// Base quantity mode (TEP_TIME_CALCULATION_MODE = true): units x seconds per unit + the extra seconds.
export function calculateTimeByBaseQuantity({ units, secondsPerUnit, extraSeconds }: TepTimeParams): TepTime {
  return secondsToTepTime(units * secondsPerUnit + extraSeconds);
}

// Recorded time mode (TEP_TIME_CALCULATION_MODE = false): (base_route_quantity - 10) / units, in hours,
// shown as HH:MM. 0:00 without units or without base_route_quantity.
export function calculateTimeByRecordedTime({ units, baseRouteQuantity }: TepTimeParams): TepTime {
  if (!units || baseRouteQuantity == null) return { hours: 0, minutes: 0 };
  return secondsToTepTime((units / (baseRouteQuantity - BASE_ROUTE_QUANTITY_OFFSET)) * 3600);
}

// Single entry point of the "Tiempo (HH:MM)" of the integrate modal: picks the calculation by the
// TEP_TIME_CALCULATION_MODE setting (`useRecordedTime`).
export function calculateTepTime(useRecordedTime: boolean, params: TepTimeParams): TepTime {
  return useRecordedTime ? calculateTimeByBaseQuantity(params) : calculateTimeByRecordedTime(params);
}
