// Response of the manual-duration-batch/simulate/ endpoints (production and
// stamping): allowed duration range for the batch, the estimated efficiency
// for the simulated duration and the efficiency cap (%) enforced on save.
export interface ManualBatchSimulation {
  min_duration_seconds: number;
  max_duration_seconds: number | null;
  efficiency: number | null;
  max_efficiency: number;
}
