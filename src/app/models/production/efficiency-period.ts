export interface EfficiencyPeriod {
  period_start:      string;
  period_end:        string;
  module_id:         number;
  shift_id:          number;
  total_ordered:     number;
  total_planned:     number;
  total_completed:   number;
  total_scrap:       number;
  total_rejected:    number;
  total_produced:    number;
  unit_target:       number;
  efficiency:        number;
  weighted_avg_sam?: number;
  total_available_minutes?: number;
}
