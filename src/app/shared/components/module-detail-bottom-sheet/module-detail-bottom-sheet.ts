import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, inject, signal, computed } from '@angular/core';
import { finalize, switchMap } from 'rxjs';
import { DecimalPipe, DatePipe } from '@angular/common';
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
  imports: [BottomSheetShell, UiIcon, DataTable, TableTemplate, DateRangeForm, DecimalPipe, DatePipe],
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

  readonly skeletonRows = Array(4).fill(0);

  readonly pagedRows = computed(() => ({
    count: this.rows().length,
    next: null as string | null,
    previous: null as string | null,
    results: this.rows(),
  }));

  readonly columns: TableColumn<ModuleEfficiencyRow>[] = [
    { type: 'template', label: 'Inicio jornada', templateName: 'shiftStartTemplate' },
    { type: 'template', label: 'Fin jornada',   templateName: 'endedAtTemplate' },
    { field: 'total_registers', label: 'Registros', align: 'right' },
    { type: 'template', label: 'Meta', templateName: 'unitTargetTemplate', align: 'right' },
    { type: 'template', label: 'Completadas', templateName: 'completedTemplate', align: 'right' },
    { type: 'template', label: 'Saldos', templateName: 'rejectedTemplate', align: 'right' },
    { type: 'template', label: 'Bajas', templateName: 'scrapTemplate', align: 'right' },
    { type: 'template', label: 'Eficiencia', templateName: 'efficiencyTemplate', align: 'right' },
  ];

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] && !changes['visible'].currentValue) {
      this.rows.set([]);
      this.hasSearched.set(false);
      this.isLoading.set(false);
      this.dateRangeForm?.form.reset();
    }
  }

  title(): string {
    return `MÓDULO ${this.module?.number} / ${this.module?.name.toLocaleUpperCase()}`;
  }

  onSearch(value: DateRangeValue): void {
    if (!this.module) return;
    this.isLoading.set(true);
    this.hasSearched.set(true);
    this.rows.set([]);

    this.appConfig.load().pipe(
      switchMap(() => this.productivityService.getModuleEfficiency(
        value.startDate,
        value.endDate,
        this.module!.module_id,
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
