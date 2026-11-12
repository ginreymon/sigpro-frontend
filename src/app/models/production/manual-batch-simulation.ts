// Response of the manual-duration-batch/simulate/ endpoints (production and
// stamping): allowed duration range for the batch, the estimated efficiency
// for the simulated duration and the efficiency cap (%) enforced on save.
// Response of stamping-records/simulate/ (regular, non-manual record): `message`
// explains why the quantity cannot be saved (null when allowed).
export interface SingleRecordSimulation {
  efficiency: number | null;
  max_efficiency: number;
  max_quantity: number;
  duration_seconds: number;
  allowed: boolean;
  message: string | null;
}

export interface ManualBatchSimulation {
  min_duration_seconds: number;
  max_duration_seconds: number | null;
  efficiency: number | null;
  max_efficiency: number;
}
