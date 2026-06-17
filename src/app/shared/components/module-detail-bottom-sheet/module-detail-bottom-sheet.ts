import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, inject, signal, computed } from '@angular/core';
import { finalize, switchMap } from 'rxjs';
import { DecimalPipe, DatePipe, formatDate, UpperCasePipe } from '@angular/common';
import { BottomSheetShell } from '../bottom-sheet-shell/bottom-sheet-shell';
import { UiIcon } from '../../elements/ui-icon/ui-icon';
import { DataTable } from '../data-table/data-table';
import { TableTemplate } from '../../../directives/table-template';
import { DateRangeForm, DateRangeValue } from '../date-range-form/date-range-form';
import { ModuleEfficiencyStatus } from '../../../models/production/module-efficiency-status';
import { ModuleEfficiencyRow } from '../../../models/production/module-efficiency-row';
import { ProductivityService } from '../../../services/production/productivity-service';
import { AppConfigService } from '../../../services/core/app-config-service';
import { TableColumn } from '../../../common/interfaces/table-column';
import { efficiencyTextColor } from '../../../common/functions/efficiency-color';

@Component({
  selector: 'app-module-detail-bottom-sheet',
  imports: [BottomSheetShell, UiIcon, DataTable, TableTemplate, DateRangeForm, DecimalPipe, DatePipe, UpperCasePipe],
  templateUrl: './module-detail-bottom-sheet.html',
})
export class ModuleDetailBottomSheet implements OnChanges {

  @ViewChild(DateRangeForm) private dateRangeForm!: DateRangeForm;

  @Input() visible: boolean = false;
  @Input() module: ModuleEfficiencyStatus | null = null;
  @Output() onClose = new EventEmitter<void>();

  private productivityService = inject(ProductivityService);
  private appConfig = inject(AppConfigService);

  isLoading = signal(false);
  hasSearched = signal(false);
  rows = signal<ModuleEfficiencyRow[]>([]);
  private moduleId = signal<number | null>(null);

  readonly skeletonRows = Array(4).fill(0);

  readonly pagedRows = computed(() => ({
    count: this.rows().length,
    next: null as string | null,
    previous: null as string | null,
    results: this.rows(),
  }));

  readonly columns = computed<TableColumn<ModuleEfficiencyRow>[]>(() => {
    const isGeneral = !this.moduleId();
    return [
      ...(isGeneral ? [{ type: 'template' as const, field: 'module_name' as const, label: 'Módulo', templateName: 'moduleNameTemplate' }] : []),
      { type: 'template' as const, label: 'Inicio jornada', templateName: 'shiftStartTemplate', field: 'shift_start_utc' as const },
      { type: 'template' as const, label: 'Fin jornada',    templateName: 'endedAtTemplate',    field: 'ended_at' as const },
      { field: 'total_registers' as const, label: 'Registros', align: 'center' as const },
      { type: 'template' as const, label: 'Meta',        templateName: 'unitTargetTemplate',  field: 'unit_target' as const,     align: 'right' as const, footerFormat: '1.0-0' },
      { type: 'template' as const, label: 'Completadas', templateName: 'completedTemplate',   field: 'total_completed' as const, align: 'right' as const, footerFormat: '1.0-0' },
      { type: 'template' as const, label: 'Saldos',      templateName: 'rejectedTemplate',    field: 'total_rejected' as const,  align: 'right' as const, footerFormat: '1.0-0' },
      { type: 'template' as const, label: 'Bajas',       templateName: 'scrapTemplate',       field: 'total_scrap' as const,     align: 'right' as const, footerFormat: '1.0-0' },
      { type: 'template' as const, label: 'Eficiencia',  templateName: 'efficiencyTemplate',  field: 'efficiency' as const,      align: 'right' as const, footerFormat: '1.2-2', footerSuffix: '%' },
    ];
  });

  readonly tableFooter = computed<ModuleEfficiencyRow[]>(() => {
    const data = this.rows();
    if (!data.length) return [];

    const fmt = (iso: string) => formatDate(iso, 'dd/MM/yyyy HH:mm', 'en-US');
    const numSum = (field: keyof ModuleEfficiencyRow) =>
      data.reduce((acc, r) => acc + ((r[field] as number) ?? 0), 0);

    const minStart = [...data].sort((a, b) =>
      a.shift_start_utc.localeCompare(b.shift_start_utc),
    )[0].shift_start_utc;

    const endedDates = data.map(r => r.ended_at).filter((d): d is string => d !== null);
    const maxEnd = endedDates.length ? endedDates.sort().at(-1)! : null;

    const withEff = data.filter(r => r.efficiency > 0);
    const avgEff = withEff.length
      ? withEff.reduce((acc, r) => acc + r.efficiency, 0) / withEff.length
      : 0;

    return [{
      module_id: 0,
      module_name: '',
      module_number: 0,
      module_operator_count: 0,
      module_location: '',
      work_center_id: 0,
      work_center_code: '',
      work_center_name: '',
      work_shift_id: 0,
      shift_id: 0,
      period_start: '',
      period_end: '',
      shift_start_utc: fmt(minStart),
      ended_at: maxEnd ? fmt(maxEnd) : null,
      total_registers: numSum('total_registers'),
      total_ordered: numSum('total_ordered'),
      total_planned: numSum('total_planned'),
      total_produced: numSum('total_produced'),
      unit_target: Math.round(numSum('unit_target') as number),
      total_completed: numSum('total_completed'),
      total_rejected: numSum('total_rejected'),
      total_scrap: numSum('total_scrap'),
      efficiency: Math.round(avgEff * 100) / 100,
    }];
  });

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['module']) {
      this.moduleId.set(this.module?.module_id ?? null);
    }
    if (changes['visible'] && !changes['visible'].currentValue) {
      this.rows.set([]);
      this.hasSearched.set(false);
      this.isLoading.set(false);
      this.dateRangeForm?.form.reset();
    }
  }

  title(): string {
    if (!this.module?.module_id) return 'PLANTA GENERAL';
    return `MÓDULO ${this.module?.number} / ${this.module?.name.toLocaleUpperCase()}`;
  }

  onSearch(value: DateRangeValue): void {
    if (!this.module) return;
    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.rows.set([]);

    const moduleId = this.module.module_id || undefined;

    this.appConfig.load().pipe(
      switchMap(() => this.productivityService.getModuleEfficiency(
        value.startDate,
        value.endDate,
        moduleId,
      )),
      finalize(() => this.isLoading.set(false)),
    ).subscribe({ next: (data) => this.rows.set(data) });
  }

  efficiencyClass(row: ModuleEfficiencyRow): string {
    return efficiencyTextColor(
      row.efficiency,
      this.appConfig.highEfficiencyLimit,
      this.appConfig.lowEfficiencyLimit,
    );
  }

  close(): void {
    this.onClose.emit();
  }

  padNumber(n: number): string {
    return n.toString().padStart(2, '0');
  }
}
