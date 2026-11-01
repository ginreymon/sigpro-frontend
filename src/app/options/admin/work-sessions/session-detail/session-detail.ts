import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, signal } from '@angular/core';
import { UiAccordionItem } from '../../../../shared/elements/ui-accordion-item/ui-accordion-item';
import { UiButton } from '../../../../shared/elements/ui-button/ui-button';
import { TreeNode, UiTreeView } from '../../../../shared/elements/ui-tree-view/ui-tree-view';
import { Metadata } from '../../../../shared/components/widgets/metadata/metadata';
import { UiBadge } from '../../../../shared/elements/ui-badge/ui-badge';
import { CharSquare } from '../../../../shared/components/widgets/char-square/char-square';
import { SESSION_DETAIL_LABELS } from '../../../../common/const/session-detail-labels';
import { EditableKind, EditTarget } from '../record-templates/record-edit-panel';
import { ExplorerActivity, WorkSessionExplorerRow } from '../../../../models/dashboard/work-session-explorer';

// JSON keys whose items are records that can be edited, and the template kind of each.
const EDITABLE_KIND_BY_KEY: Record<string, EditableKind> = {
  production_records: 'production',
  stamping_records: 'stamping',
  breaks: 'break',
  downtimes: 'downtime',
};

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

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T/;

// Read-only detail of one work session. The nested JSON is rendered generically (scalars in an info
// panel, objects/arrays in expandable panels) so every level is visible, including future fields.
@Component({
  selector: 'app-session-detail',
  imports: [DatePipe, NgTemplateOutlet, UiBadge, UiButton, UiAccordionItem, UiTreeView, Metadata, CharSquare],
  providers: [DatePipe],
  templateUrl: './session-detail.html',
})
export class SessionDetail implements OnInit {
  constructor(private datePipe: DatePipe) {}

  @Output() editRecord = new EventEmitter<EditTarget>();

  protected kindOf = (key?: string): EditableKind | null => (key && EDITABLE_KIND_BY_KEY[key]) || null;

  @Input({ required: true }) session!: WorkSessionExplorerRow;

  // The shifts are shown once in the summary and the JSON repeats them in every activity.
  private readonly hidden = new Set(['session_activities', 'work_shift_snapshots']);

  // Open state is keyed by the JSON object itself, so activities and nested records share it.
  private expanded = signal<ReadonlySet<object>>(new Set());
  protected isOpen = (o: object) => this.expanded().has(o);
  protected toggle(o: object) {
    this.expanded.update((s) => {
      const next = new Set(s);
      if (!next.delete(o)) next.add(o);
      return next;
    });
  }

  // Open (not yet ended) activities start expanded: they are what the reviewer usually looks for.
  ngOnInit(): void {
    const s = this.session as Record<string, any>;
    this.audit = {
      ...s,
      created_by_username: s['created_by_username'] ?? s['created_by_name'],
      updated_by_username: s['updated_by_username'] ?? s['updated_by_name'],
    };
    this.expanded.set(new Set(this.activities.filter((a) => !a.ended_at)));
  }

  private get activities() {
    return this.session.session_activities ?? [];
  }

  protected expandAll() {
    this.expanded.set(new Set(this.activities));
  }

  protected collapseAll() {
    this.expanded.set(new Set());
  }

  // <app-metadata> reads *_by_username; the explorer JSON may carry *_by_name instead.
  protected sessionDetailOpen = signal(false);

  protected audit: Record<string, any> = {};

  protected get shifts() {
    return this.session.session_activities?.[0]?.work_shift_snapshots ?? [];
  }

  protected scalars(data: any): { label: string; value: string | number }[] {
    if (!data || Array.isArray(data)) return [];
    return Object.entries(data)
      .filter(([k]) => !(data === this.session && (AUDIT_KEYS.has(k) || SUMMARY_KEYS.has(k))))
      .filter(([k, v]) => !this.hidden.has(k) && (v === null || typeof v !== 'object'))
      .map(([k, v]) => ({
        label: this.label(k),
        value: DURATION_KEYS.has(k) && typeof v === 'number' ? this.formatDuration(v) : this.format(v),
      }));
  }

  protected children(data: any): DetailChild[] {
    if (!data) return [];
    if (Array.isArray(data)) return data.map((v, i) => ({ title: this.itemTitle(v, i), value: v }));
    return Object.entries(data)
      .filter(([k, v]) => !this.hidden.has(k) && v !== null && typeof v === 'object')
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

  protected format(v: unknown): string | number {
    if (v === null || v === undefined || v === '') return '—';
    if (typeof v === 'boolean') return v ? 'Sí' : 'No';
    if (typeof v === 'string' && ISO_DATETIME.test(v)) {
      return this.datePipe.transform(v, 'dd/MM/yyyy HH:mm') ?? v;
    }
    return v as string | number;
  }

  // Cached per employees array: the tree input must keep the same array between change detections.
  private employeeNodes = new WeakMap<object, TreeNode[]>();
  protected employeeTree(employees: NonNullable<ExplorerActivity['employees']>): TreeNode[] {
    let nodes = this.employeeNodes.get(employees);
    if (!nodes) {
      nodes = [
        {
          id: 'employees',
          label: `Empleados (${employees.length})`,
          children: employees.map((e) => ({
            id: e.id,
            label: [e.first_name, e.last_name1, e.last_name2].filter(Boolean).join(' '),
          })),
        },
      ];
      this.employeeNodes.set(employees, nodes);
    }
    return nodes;
  }
}
