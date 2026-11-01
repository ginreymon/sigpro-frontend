import { DatePipe, NgTemplateOutlet } from '@angular/common';
import { Component, Input, OnInit, signal } from '@angular/core';
import { UiAccordionItem } from '../../../../shared/elements/ui-accordion-item/ui-accordion-item';
import { UiButton } from '../../../../shared/elements/ui-button/ui-button';
import { TreeNode, UiTreeView } from '../../../../shared/elements/ui-tree-view/ui-tree-view';
import { UiBadge } from '../../../../shared/elements/ui-badge/ui-badge';
import { UiExpandablePanel } from '../../../../shared/elements/ui-expandable-panel/ui-expandable-panel';
import { InfoPanelLine, UiInfoPanel } from '../../../../shared/elements/ui-info-panel/ui-info-panel';
import { ExplorerActivity, WorkSessionExplorerRow } from '../../../../models/dashboard/work-session-explorer';

interface DetailChild {
  key?: string;
  title: string;
  value: any;
}

const LABELS: Record<string, string> = {
  production_records: 'Confecciones',
  stamping_records: 'Estampaciones',
  break_records: 'Pausas y paros',
  breaks: 'Pausas',
  downtimes: 'Paros',
  employees: 'Empleados',
  module: 'Módulo',
  sku: 'SKU',
  stamping_reference: 'Referencia de estampación',
  started_at: 'Inicio',
  ended_at: 'Fin',
  start_time: 'Inicio',
  end_time: 'Fin',
  tep_processed: 'Procesado en TEP',
  completed_quantity: 'Completada',
  scrap_quantity: 'Desecho',
  rejected_quantity: 'Rechazada',
  created_by_name: 'Creado por',
  updated_by_name: 'Actualizado por',
};

const ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T/;

// Read-only detail of one work session. The nested JSON is rendered generically (scalars in an info
// panel, objects/arrays in expandable panels) so every level is visible, including future fields.
@Component({
  selector: 'app-session-detail',
  imports: [NgTemplateOutlet, UiBadge, UiButton, UiAccordionItem, UiExpandablePanel, UiInfoPanel, UiTreeView],
  providers: [DatePipe],
  templateUrl: './session-detail.html',
})
export class SessionDetail implements OnInit {
  constructor(private datePipe: DatePipe) {}

  @Input({ required: true }) session!: WorkSessionExplorerRow;

  // The shifts are shown once in the summary and the JSON repeats them in every activity.
  private readonly hidden = new Set(['session_activities', 'work_shift_snapshots']);

  private expandedActivities = signal<ReadonlySet<number>>(new Set());

  // Open (not yet ended) activities start expanded: they are what the reviewer usually looks for.
  ngOnInit(): void {
    this.expandedActivities.set(new Set(this.activityIds.filter((id, i) => !this.session.session_activities![i].ended_at)));
  }

  private get activityIds() {
    return (this.session.session_activities ?? []).map((a) => a.session_activity_id);
  }

  protected expandAll() {
    this.expandedActivities.set(new Set(this.activityIds));
  }

  protected collapseAll() {
    this.expandedActivities.set(new Set());
  }

  protected isExpanded = (id: number) => this.expandedActivities().has(id);
  protected toggleExpanded(id: number) {
    this.expandedActivities.update((s) => {
      const next = new Set(s);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  }

  protected get shifts() {
    return this.session.session_activities?.[0]?.work_shift_snapshots ?? [];
  }

  protected scalars(data: any): InfoPanelLine[] {
    if (!data || Array.isArray(data)) return [];
    return Object.entries(data)
      .filter(([k, v]) => !this.hidden.has(k) && (v === null || typeof v !== 'object'))
      .map(([k, v]) => ({ label: this.label(k), value: this.format(v) }));
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
    return LABELS[key] ?? key.replace(/_/g, ' ');
  }

  private itemTitle(item: any, i: number) {
    const id = item?.id ?? item?.session_activity_id ?? i + 1;
    return `#${id}${item?.name ? ' · ' + item.name : ''}`;
  }

  private format(v: unknown): string | number {
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
