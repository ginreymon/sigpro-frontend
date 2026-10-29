import { DecimalPipe } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OpProgressRow } from '../../../../models/common/op-progress-row';
import { groupOpProgress, OpProgressAreaGroup } from '../../../../common/functions/op-progress-group';
import { CHART_COLORS } from '../../../../charts/chart-palette';
import { UiAccordionItem } from '../../../elements/ui-accordion-item/ui-accordion-item';
import { UiBadge } from '../../../elements/ui-badge/ui-badge';
import { UiButton } from '../../../elements/ui-button/ui-button';
import { UiDatePicker } from '../../../elements/ui-date-picker/ui-date-picker';
import { UiErrorMessage } from '../../../elements/ui-error-message/ui-error-message';
import { UiFormField } from '../../../elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../elements/ui-input/ui-input';
import { UiSelect } from '../../../elements/ui-select/ui-select';
import { DashboardSection, DashboardSectionState } from '../dashboard-section/dashboard-section';
import { ProgressBar } from '../progress-bar/progress-bar';

type StatusFilter = 'all' | 'inProgress' | 'done' | 'noData';

const STATUS_OPTIONS: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: 'Todas' },
  { key: 'inProgress', label: 'En curso' },
  { key: 'done', label: 'Completadas' },
  { key: 'noData', label: 'Sin datos' },
];

function toggled<T>(set: ReadonlySet<T>, value: T): ReadonlySet<T> {
  const next = new Set(set);
  if (!next.delete(value)) next.add(value);
  return next;
}

function statusOf(row: OpProgressRow): Exclude<StatusFilter, 'all'> {
  if (row.progress_pct === null || row.progress_pct === undefined) return 'noData';
  return row.progress_pct >= 100 ? 'done' : 'inProgress';
}

export interface OpProgressAreaOption {
  id: number;
  label: string;
}

export interface OpProgressFilters {
  areaId: number | null;
  startDate: string;
  endDate: string;
}

// OP progress grouped by area and module. Area and date range are server-side filters: the parent
// owns their values and reloads the rows when `filtersChange` fires. Search and status are local.
@Component({
  selector: 'app-op-progress-by-module',
  imports: [
    DecimalPipe,
    FormsModule,
    DashboardSection,
    ProgressBar,
    UiAccordionItem,
    UiBadge,
    UiButton,
    UiDatePicker,
    UiErrorMessage,
    UiFormField,
    UiInput,
    UiSelect,
  ],
  templateUrl: './op-progress-by-module.html',
})
export class OpProgressByModule {
  readonly title = input.required<string>();
  readonly rows = input<OpProgressRow[]>([]);
  readonly state = input<DashboardSectionState>('ready');
  readonly areaOptions = input<OpProgressAreaOption[]>([]);
  readonly areaId = input<number | null>(null);
  readonly startDate = input.required<string>();
  readonly endDate = input.required<string>();
  readonly filtersChange = output<OpProgressFilters>();

  protected readonly barColor = CHART_COLORS.brand;
  protected readonly statusOptions = STATUS_OPTIONS;
  protected readonly search = signal('');
  protected readonly status = signal<StatusFilter>('all');
  protected readonly rangeError = signal<string | null>(null);
  // Areas start expanded and modules collapsed, so the page opens as an overview per area.
  private readonly closedAreas = signal<ReadonlySet<number>>(new Set());
  private readonly openModules = signal<ReadonlySet<string>>(new Set());

  protected readonly groups = computed<OpProgressAreaGroup[]>(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.status();
    const filtered = this.rows().filter(
      (r) =>
        (status === 'all' || statusOf(r) === status) &&
        (!term ||
          `${r.op_number} ${r.op_type} ${r.reference_code ?? ''} ${r.reference_description ?? ''}`
            .toLowerCase()
            .includes(term)),
    );
    return groupOpProgress(filtered);
  });

  protected readonly hasRows = computed(() => this.groups().length > 0);

  protected onArea(areaId: number | null): void {
    this.emitFilters({ areaId });
  }

  protected onStartDate(startDate: string | null): void {
    this.emitFilters({ startDate: startDate ?? '' });
  }

  protected onEndDate(endDate: string | null): void {
    this.emitFilters({ endDate: endDate ?? '' });
  }

  // Emits only valid ranges; an incomplete or inverted range keeps the previous results.
  private emitFilters(change: Partial<OpProgressFilters>): void {
    const next: OpProgressFilters = {
      areaId: this.areaId(),
      startDate: this.startDate(),
      endDate: this.endDate(),
      ...change,
    };
    if (!next.startDate || !next.endDate) return;
    if (next.startDate > next.endDate) {
      this.rangeError.set('La fecha de inicio no puede ser posterior a la fecha de fin.');
      return;
    }
    this.rangeError.set(null);
    this.filtersChange.emit(next);
  }

  protected clearFilters(): void {
    this.search.set('');
    this.status.set('all');
  }

  protected isAreaOpen(areaId: number): boolean {
    return !this.closedAreas().has(areaId);
  }

  protected toggleArea(areaId: number): void {
    this.closedAreas.update((set) => toggled(set, areaId));
  }

  protected isModuleOpen(areaId: number, moduleId: number): boolean {
    return this.openModules().has(`${areaId}-${moduleId}`);
  }

  protected toggleModule(areaId: number, moduleId: number): void {
    this.openModules.update((set) => toggled(set, `${areaId}-${moduleId}`));
  }

  protected opCount(area: OpProgressAreaGroup): number {
    return area.modules.reduce((sum, mod) => sum + mod.rows.length, 0);
  }

  protected pending(row: OpProgressRow): number | null {
    return row.pending_qty === null ? null : Math.max(0, row.pending_qty);
  }

  protected isOver(row: OpProgressRow): boolean {
    return row.pending_qty !== null && row.pending_qty < 0;
  }
}
