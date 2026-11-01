import { DatePipe, formatDate } from '@angular/common';
import {
  AccordionItem,
  UiNestedAccordion,
} from '../../../../shared/elements/ui-nested-accordion/ui-nested-accordion';
import { Component, EventEmitter, Input, OnChanges, Output, signal } from '@angular/core';
import { RecordKind } from './record-form/record-form';
import { UiAccordionItem } from '../../../../shared/elements/ui-accordion-item/ui-accordion-item';
import { UiButton } from '../../../../shared/elements/ui-button/ui-button';
import { Metadata } from '../../../../shared/components/widgets/metadata/metadata';
import { UiBadge } from '../../../../shared/elements/ui-badge/ui-badge';
import { CharSquare } from '../../../../shared/components/widgets/char-square/char-square';
import { ExplorerActivity, WorkSessionExplorerRow } from '../../../../models/dashboard/work-session-explorer';
import { SESSION_DETAIL_LABELS } from '../../../../common/const/session-detail-labels';
import { DetailBlock } from './detail-block/detail-block';

// Read-only detail of one work session: summary, activities and audit data. The nested JSON is
// rendered by <app-detail-block>.
// Shifts are shown once in the summary; the JSON repeats them in every activity.
const HIDDEN_KEYS = new Set(['session_activities', 'work_shift_snapshots']);

// Arrays whose elements can be edited, and the form each one opens.
const KIND_BY_KEY: Record<string, RecordKind> = {
  production_records: 'production',
  stamping_records: 'stamping',
  breaks: 'break',
  downtimes: 'downtime',
};

// Title of the edit modal: what the record is, with its id on the right.
const RECORD_LABELS: Record<RecordKind, string> = {
  production: 'Registro de confección',
  stamping: 'Registro de estampación',
  break: 'Pausa',
  downtime: 'Paro',
};

export interface RecordSelection {
  kind: RecordKind;
  data: Record<string, any>;
  title: string;
  // Interval of the session that contains the record (used by the date validators).
  session: { started_at: string; ended_at: string | null };
}

@Component({
  selector: 'app-session-detail',
  imports: [DatePipe, UiBadge, UiButton, UiAccordionItem, Metadata, CharSquare, DetailBlock, UiNestedAccordion],
  templateUrl: './session-detail.html',
})
export class SessionDetail implements OnChanges {
  @Input({ required: true }) session!: WorkSessionExplorerRow;
  @Output() editRecord = new EventEmitter<RecordSelection>();

  // Accordion node id -> the record its "Editar" button opens.
  protected editable = new Map<string | number, RecordSelection>();

  protected sessionDetailOpen = signal(false);
  protected expanded = signal<ReadonlySet<string | number>>(new Set());
  protected items: AccordionItem<ExplorerActivity>[] = [];

  // <app-metadata> reads *_by_username; the explorer JSON may carry *_by_name instead.
  protected audit: Record<string, any> = {};

  protected get activities() {
    return this.session.session_activities ?? [];
  }

  // "# <op_number> · <module>" of the activity's OP; activities without records fall back to their own id.
  protected title(act: ExplorerActivity): string {
    const rec = act.production_records?.[0] ?? act.stamping_records?.[0];
    return `# ${rec?.op_number ?? act.session_activity_id} · ${act.module?.name ?? '—'}`;
  }

  protected get shifts() {
    return this.activities[0]?.work_shift_snapshots ?? [];
  }

  // Open (not yet ended) activities start expanded: they are what the reviewer usually looks for.
  // Also rebuilds the tree when the parent hands in a refreshed session after a record is saved.
  ngOnChanges(): void {
    this.editable.clear();
    const s = this.session as Record<string, any>;
    this.audit = {
      ...s,
      created_by_username: s['created_by_username'] ?? s['created_by_name'],
      updated_by_username: s['updated_by_username'] ?? s['updated_by_name'],
    };
    const fmt = (v?: string | null, f = 'dd/MM/yyyy HH:mm') => (v ? formatDate(v, f, 'en-US') : '');
    this.items = this.activities.map((a) => ({
      id: a.session_activity_id,
      title: this.title(a),
      subtitle: `${fmt(a.started_at)} – ${fmt(a.ended_at, 'HH:mm') || 'En curso'}`,
      badge: { label: a.ended_at ? 'Cerrada' : 'Abierta', intent: a.ended_at ? 'inactive' : 'active' },
      data: a,
      children: this.nested(a, String(a.session_activity_id)),
    }));
    this.expanded.set(
      new Set(this.activities.filter((a) => !a.ended_at).map((a) => a.session_activity_id)),
    );
  }

  // Every nested object/array of `node` becomes a child node (arrays: one node per element).
  // Arrays carry no data: their scalars-only body would be empty.
  // `kind` is set when `node` is an array of editable records: its elements go to `editable`.
  private nested(node: any, path: string, kind?: RecordKind): AccordionItem<any>[] {
    const entries: [string, string, any][] = Array.isArray(node)
      ? node.map((v, i) => [String(i), this.itemTitle(v, i), v])
      : Object.entries(node)
          .filter(([k, v]) => !HIDDEN_KEYS.has(k) && v !== null && typeof v === 'object')
          .map(([k, v]) => [k, this.label(k) + (Array.isArray(v) ? ` (${v.length})` : '') + this.minutes(k, v), v]);
    return entries
      .filter(([, , v]) => v !== null && typeof v === 'object' && (!Array.isArray(v) || v.length))
      .map(([k, title, v]) => {
        const id = `${path}/${k}`;
        if (kind) this.editable.set(id, { kind, data: v, title: `${RECORD_LABELS[kind]} #${v.id}`, session: this.session });
        return {
          id,
          title,
          data: Array.isArray(v) ? undefined : v,
          children: this.nested(v, id, Array.isArray(v) ? KIND_BY_KEY[k] : undefined),
        };
      });
  }

  // " (breaks + downtimes) · N min" next to the "Tiempos improductivos" title.
  private minutes(key: string, value: any): string {
    if (key !== 'unproductive_times') return '';
    const count = (value.breaks?.length ?? 0) + (value.downtimes?.length ?? 0);
    return ` (${count}) · ${Math.round((value.total_time_seconds ?? 0) / 60)} min`;
  }

  private label(key: string): string {
    return SESSION_DETAIL_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, ' ');
  }

  private itemTitle(item: any, i: number): string {
    const name = item?.name ?? [item?.first_name, item?.last_name1, item?.last_name2].filter(Boolean).join(' ');
    return `#${item?.id ?? i + 1}${name ? ' · ' + name : ''}`;
  }

  protected expandAll() {
    this.expanded.set(new Set(this.items.map((i) => i.id)));
  }

  protected collapseAll() {
    this.expanded.set(new Set());
  }
}
