import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { SESSION_DETAIL_LABELS } from '../../../../../common/const/session-detail-labels';
import { ExplorerActivity } from '../../../../../models/dashboard/work-session-explorer';

interface DetailChild {
  key?: string;
  title: string;
  value: any;
}

// Audit fields of the session are shown by <app-metadata>, not repeated in the summary.
const AUDIT_KEYS = new Set([
  'created_at',
  'updated_at',
  'created_by',
  'updated_by',
  'created_by_name',
  'updated_by_name',
  'created_by_username',
  'updated_by_username',
  'is_active',
]);

// Shown at a glance in the session section, so excluded from its collapsed detail.
const SUMMARY_KEYS = new Set(['started_at', 'ended_at']);

// DurationField columns come from SQL Server as bigint microseconds (e.g. 20737822381 = 05:45:37).
const DURATION_KEYS = new Set(['total_time', 'duration']);

// The shifts are shown once in the summary and the JSON repeats them in every activity.
const HIDDEN_KEYS = new Set(['session_activities', 'work_shift_snapshots']);

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T/;

// Read-only recursive view of a JSON object: scalars as label/value pairs, nested objects/arrays as
// titled sections, so every level is visible, including future fields.
@Component({
  selector: 'app-detail-block',
  providers: [DatePipe],
  templateUrl: './detail-block.html',
})
export class DetailBlock {
  constructor(private datePipe: DatePipe) {}

  @Input({ required: true }) data: any;
  // The session root hides audit/summary keys (shown elsewhere); activities and records show all.
  @Input() isRoot = false;
  // Nested objects/arrays are rendered elsewhere (accordion nodes): show only this level's scalars.
  @Input() scalarsOnly = false;

  protected get scalars(): { label: string; value: string | number }[] {
    const data = this.data;
    if (!data || Array.isArray(data)) return [];
    return Object.entries(data)
      .filter(([k]) => !(this.isRoot && (AUDIT_KEYS.has(k) || SUMMARY_KEYS.has(k))))
      .filter(([k, v]) => !HIDDEN_KEYS.has(k) && (v === null || typeof v !== 'object'))
      .map(([k, v]) => ({
        label: this.label(k),
        value: DURATION_KEYS.has(k) && typeof v === 'number' ? this.formatDuration(v) : this.format(v),
      }));
  }

  protected get children(): DetailChild[] {
    const data = this.data;
    if (!data || this.scalarsOnly) return [];
    if (Array.isArray(data)) return data.map((v, i) => ({ title: this.itemTitle(v, i), value: v }));
    return Object.entries(data)
      .filter(([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && typeof v === 'object')
      .filter(([, v]) => !Array.isArray(v) || v.length)
      .map(([k, v]) => ({
        key: k,
        title: this.label(k) + (Array.isArray(v) ? ` (${v.length})` : ''),
        value: v,
      }));
  }

  private label(key: string) {
    if (SESSION_DETAIL_LABELS[key]) return SESSION_DETAIL_LABELS[key];
    const words = key.replace(/_/g, ' ');
    return words.charAt(0).toUpperCase() + words.slice(1);
  }

  private itemTitle(item: any, i: number) {
    const id = item?.id ?? item?.session_activity_id ?? i + 1;
    return `#${id}${item?.name ? ' · ' + item.name : ''}`;
  }

  private formatDuration(microseconds: number): string {
    const total = Math.floor(microseconds / 1_000_000);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${pad(Math.floor(total / 3600))}:${pad(Math.floor((total % 3600) / 60))}:${pad(total % 60)}`;
  }

  private format(v: unknown): string | number {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    if (typeof v === 'string' && ISO_DATETIME.test(v)) {
      return this.datePipe.transform(v, 'dd/MM/yyyy HH:mm') ?? v;
    }
    return v as string | number;
  }

  protected employeeNames(employees: NonNullable<ExplorerActivity['employees']>): string[] {
    return employees.map((e) => [e.first_name, e.last_name1, e.last_name2].filter(Boolean).join(' '));
  }
}
