import { Injectable } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { interval, startWith } from 'rxjs';
import { shiftTimeToUtcIso } from '../../../common/functions/date-utils';
import { employeeWeight } from '../../../common/functions/employee-weight';
import { WorkSession } from '../../../models/production/work-session';
import { sewingForecast } from './sewing-forecast-strategy';
import { stampingForecast } from './stamping-forecast-strategy';
import { ForecastBaseline, ForecastStrategy } from './forecast.types';

// core_module.id -> strategy. Unknown ids yield no forecast (safe default).
// shortcut: the stamping id is not seeded in the repo — confirm it against core_module.
export const CORE_MODULE_SEWING = 3;
export const CORE_MODULE_STAMPING = 4;

const STRATEGIES: Record<number, ForecastStrategy> = {
  [CORE_MODULE_SEWING]: sewingForecast,
  [CORE_MODULE_STAMPING]: stampingForecast,
};

export interface ForecastRequest {
  session: WorkSession | null | undefined;
  baseline: ForecastBaseline | null | undefined;
  newUnits: number;
  sam: number;
  tasksPerHour?: number;
  additionalMinutes?: number;
  // Editing an existing record does not open a new interval.
  noNewInterval?: boolean;
}

const EMPTY_BASELINE: ForecastBaseline = { total_produced: 0, total_completed: 0, unit_target: 0 };

// Fallback interval when there is no previous record: one hourly window.
const FALLBACK_INTERVAL_SECONDS = 3600;

@Injectable({ providedIn: 'root' })
export class ProductivityForecastService {
  // Wall-clock tick: forecast() reads it, so any computed() that calls forecast() is re-evaluated as time passes
  // (Date.now() alone is not reactive) without reloading the page or typing again.
  private readonly clock = toSignal(interval(1000).pipe(startWith(0)), { requireSync: true });

  // Projected efficiency (%) after registering `req.newUnits`, or null when it cannot be estimated.
  forecast(coreModuleId: number | null | undefined, req: ForecastRequest): number | null {
    this.clock();
    const strategy = coreModuleId == null ? undefined : STRATEGIES[coreModuleId];
    if (!strategy || !req.session) return null;

    // No shift row yet (no records): same condition app-work-shift-summary uses for its approximate target.
    // The whole shift so far is the new interval, counted from the shift start against zero totals.
    const noRecords = !req.baseline?.unit_target;
    const baseline = noRecords ? EMPTY_BASELINE : req.baseline!;

    return strategy({
      baseline,
      newUnits: req.newUnits,
      elapsedSeconds: req.noNewInterval ? 0 : noRecords ? this.secondsSinceShiftStart(req.session) : this.elapsedSeconds(req.session),
      employees: (req.session.employees_snapshot ?? []).reduce((sum, e) => sum + employeeWeight(e), 0),
      sam: req.sam,
      tasksPerHour: req.tasksPerHour,
      additionalMinutes: req.additionalMinutes,
    });
  }

  // Wall-clock seconds from the shift start (start_time is local, converted to UTC epoch like the summary card).
  // shortcut: breaks and downtime are not subtracted — slightly underestimates efficiency until the first record.
  private secondsSinceShiftStart(session: WorkSession): number {
    const now = Date.now();
    let start = Date.parse(shiftTimeToUtcIso(session.work_shift.start_time));
    if (start > now) start -= 24 * 3600 * 1000; // overnight shift started yesterday
    return Math.max(0, (now - start) / 1000);
  }

  // Seconds since the last record ended (the baseline already counts everything before it, so
  // using the shift start would count productive time twice). Date.parse/Date.now are UTC epoch.
  // shortcut: pauses inside this gap are not subtracted (not exposed to the client) — slightly
  // underestimates efficiency; upgrade if the API returns the gap's pause seconds.
  private elapsedSeconds(session: WorkSession): number {
    const now = Date.now();
    const activity = session.active_activity;
    const lastEnd = activity?.last_production_record?.end_time;
    const since = lastEnd
      ? Date.parse(lastEnd)
      : Math.max(Date.parse(activity?.started_at ?? '') || now, now - FALLBACK_INTERVAL_SECONDS * 1000);
    return Math.max(0, (now - since) / 1000);
  }
}
