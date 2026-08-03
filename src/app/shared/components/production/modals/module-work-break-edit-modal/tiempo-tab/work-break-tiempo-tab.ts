import { Component, Input, OnChanges, SimpleChanges, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { UiButton } from '../../../../../elements/ui-button/ui-button';
import { UiRangeSlider, TimeRange } from '../../../../../elements/ui-range-slider/ui-range-slider';
import { UiTextarea } from '../../../../../elements/ui-textarea/ui-textarea';
import { DataTable } from '../../../../table/data-table/data-table';
import { ModuleEfficiencyRow } from '../../../../../../models/production/module-efficiency-row';
import { ModuleWorkBreakRecord } from '../../../../../../models/production/module-work-break-record';
import { WorkShift } from '../../../../../../models/production/work-shift';
import { ModuleWorkBreakRecordService } from '../../../../../../services/production/module-work-break-record-service';
import { WorkShiftService } from '../../../../../../services/production/work-shift-service';
import { DialogService } from '../../../../../../services/common/dialog-service';
import { TableColumn } from '../../../../../../common/interfaces/table-column';
import { TableActions } from '../../../../../../common/interfaces/table-actions';
import { TableActionEvent } from '../../../../../../common/interfaces/table-action-event';

interface EditableBreak {
  id: number | null;
  custom_reason: string;
  startMinutes: number;
  endMinutes: number;
  updatedBy: string;
  updatedAt: string;
}

interface BreakTableRow {
  _source: EditableBreak;
  custom_reason: string;
  startLabel: string;
  endLabel: string;
  updatedBy: string;
  updatedAtLabel: string;
}

type FormMode = 'create' | 'edit' | 'view';

@Component({
  selector: 'app-work-break-tiempo-tab',
  imports: [UiButton, UiRangeSlider, UiTextarea, DataTable, ReactiveFormsModule],
  templateUrl: './work-break-tiempo-tab.html',
})
export class WorkBreakTiempoTab implements OnChanges {
  @Input() visible = false;
  @Input() row: ModuleEfficiencyRow | null = null;

  private moduleWorkBreakRecordService = inject(ModuleWorkBreakRecordService);
  private workShiftService = inject(WorkShiftService);
  private dialogService = inject(DialogService);
  private fb = inject(FormBuilder);

  isLoading = signal(false);
  totalMinutes = signal(0);
  shiftStartUtc = signal<Date | null>(null);
  breaks = signal<EditableBreak[]>([]);

  mode = signal<FormMode>('create');
  editingId = signal<number | null>(null);
  editingUpdatedBy = signal<string>('—');
  saving = signal(false);

  readonly form: FormGroup = this.fb.group({
    custom_reason: ['', Validators.required],
    startMinutes: [0, Validators.required],
    endMinutes: [30, Validators.required],
  });

  readonly tableActions: Partial<TableActions> = {
    view: { enabled: true, iconName: 'eye', toolTip: 'Ver' },
    edit: { enabled: true, iconName: 'pencil', toolTip: 'Editar' },
    delete: { enabled: true, iconName: 'trash', toolTip: 'Eliminar' },
  };

  readonly columns: TableColumn<BreakTableRow>[] = [
    { field: 'startLabel', label: 'Inicio', align: 'center' },
    { field: 'endLabel', label: 'Fin', align: 'center' },
    { field: 'updatedBy', label: 'Editado por' },
    { field: 'updatedAtLabel', label: 'Fecha de edición', align: 'center' },
  ];

  readonly tableRows = computed<BreakTableRow[]>(() =>
    this.breaks().map((b) => ({
      _source: b,
      custom_reason: b.custom_reason || '—',
      startLabel: this.minutesToClock(b.startMinutes),
      endLabel: this.minutesToClock(b.endMinutes),
      updatedBy: b.updatedBy,
      updatedAtLabel: this.formatDateTime(b.updatedAt),
    })),
  );

  readonly pagedRows = computed(() => ({
    count: this.tableRows().length,
    next: null as string | null,
    previous: null as string | null,
    results: this.tableRows(),
  }));

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['visible'] || changes['row']) {
      if (this.visible && this.row) {
        this.loadData();
      } else if (!this.visible) {
        this.reset();
      }
    }
  }

  private resetForm(): void {
    this.form.enable({ emitEvent: false });
    this.form.reset(
      { custom_reason: '', startMinutes: 0, endMinutes: Math.min(30, this.totalMinutes() || 30) },
      { emitEvent: false },
    );
    this.mode.set('create');
    this.editingId.set(null);
    this.editingUpdatedBy.set('—');
  }

  private populateForm(b: EditableBreak, newMode: 'edit' | 'view'): void {
    this.form.enable({ emitEvent: false });
    this.form.patchValue(
      {
        custom_reason: b.custom_reason,
        startMinutes: b.startMinutes,
        endMinutes: b.endMinutes,
      },
      { emitEvent: false },
    );
    this.editingId.set(b.id);
    this.editingUpdatedBy.set(b.updatedBy);
    this.mode.set(newMode);
    if (newMode === 'view') {
      this.form.disable({ emitEvent: false });
    }
  }

  private reset(): void {
    this.breaks.set([]);
    this.totalMinutes.set(0);
    this.shiftStartUtc.set(null);
    this.isLoading.set(false);
    this.saving.set(false);
    this.resetForm();
  }

  private loadData(): void {
    const row = this.row;
    if (!row) return;

    this.isLoading.set(true);

    forkJoin({
      shift: this.workShiftService.getById(row.work_shift_id),
      breakRecords: this.moduleWorkBreakRecordService.all({ module: row.module_id }),
    }).subscribe({
      next: ({ shift, breakRecords }) => {
        const shiftStart = new Date(row.shift_start_utc);
        const shiftEnd = row.ended_at ? new Date(row.ended_at) : new Date();
        this.shiftStartUtc.set(shiftStart);
        this.totalMinutes.set(this.computeShiftDuration(shift));

        const relevant = breakRecords.filter((b) => {
          const bStart = new Date(b.start_time);
          return bStart >= shiftStart && bStart <= shiftEnd;
        });

        this.breaks.set(relevant.map((b) => this.toEditable(b)));
        this.resetForm();
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.dialogService.openToast('Error', 'No se pudo cargar la información del turno.', 'fail');
      },
    });
  }

  private computeShiftDuration(shift: WorkShift): number {
    const [sh, sm] = shift.start_time.split(':').map(Number);
    const [eh, em] = shift.end_time.split(':').map(Number);
    const startTotal = sh * 60 + sm;
    let endTotal = eh * 60 + em;
    if (endTotal <= startTotal) endTotal += 24 * 60;
    return endTotal - startTotal;
  }

  private toEditable(b: ModuleWorkBreakRecord): EditableBreak {
    const shiftStart = this.shiftStartUtc()!;
    return {
      id: b.id,
      custom_reason: b.custom_reason ?? b.name ?? '',
      startMinutes: this.toMinutes(b.start_time, shiftStart),
      endMinutes: b.end_time ? this.toMinutes(b.end_time, shiftStart) : this.toMinutes(b.start_time, shiftStart),
      updatedBy: b.updated_by_username || b.created_by_username || '—',
      updatedAt: b.updated_at,
    };
  }

  private toMinutes(iso: string, shiftStart: Date): number {
    return Math.round((new Date(iso).getTime() - shiftStart.getTime()) / 60000);
  }

  private toIso(minutes: number): string {
    return new Date(this.shiftStartUtc()!.getTime() + minutes * 60000).toISOString();
  }

  private minutesToClock(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  private formatDateTime(iso: string): string {
    const d = new Date(iso);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const hours = d.getHours().toString().padStart(2, '0');
    const minutes = d.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${d.getFullYear()} ${hours}:${minutes}`;
  }

  onRangeChange(range: TimeRange): void {
    this.form.patchValue({ startMinutes: range.startMinutes, endMinutes: range.endMinutes });
    this.form.markAsDirty();
  }

  viewRow(row: BreakTableRow): void {
    this.populateForm(row._source, 'view');
  }

  editRow(row: BreakTableRow): void {
    this.populateForm(row._source, 'edit');
  }

  cancelEdit(): void {
    this.resetForm();
  }

  handleTableAction(event: TableActionEvent<BreakTableRow>): void {
    if (event.type === 'view') this.viewRow(event.obj);
    if (event.type === 'edit') this.editRow(event.obj);
    if (event.type === 'delete') this.confirmDelete(event.obj._source);
  }

  confirmSave(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid || !(this.form.getRawValue().custom_reason as string).trim()) {
      this.dialogService.openToast('Formulario incompleto', 'Completa el motivo del Tiempo Excluido.', 'fail');
      return;
    }

    const isEdit = this.mode() === 'edit';
    this.dialogService.openConfirm(
      isEdit ? 'Actualizar Tiempo Excluido' : 'Crear Tiempo Excluido',
      'Esta acción modifica las métricas de eficiencia de la jornada. ¿Deseas continuar?',
      isEdit ? 'Actualizar' : 'Guardar',
      () => {
        this.dialogService.closeConfirm();
        this.saveBreak();
      },
    );
  }

  confirmDelete(b: EditableBreak): void {
    this.dialogService.openConfirm(
      'Eliminar Tiempo Excluido',
      'Esta acción modifica las métricas de eficiencia de la jornada. ¿Deseas eliminar este registro?',
      'Eliminar',
      () => {
        this.dialogService.closeConfirm();
        this.deleteBreak(b);
      },
    );
  }

  private saveBreak(): void {
    if (!this.shiftStartUtc() || !this.row) return;

    const { custom_reason, startMinutes, endMinutes } = this.form.getRawValue();
    const id = this.editingId();

    const payload: Partial<ModuleWorkBreakRecord> = {
      module: this.row.module_id,
      start_time: this.toIso(startMinutes),
      end_time: this.toIso(endMinutes),
      work_break: null,
      custom_reason: (custom_reason as string).trim(),
    };

    this.saving.set(true);
    const obs = id
      ? this.moduleWorkBreakRecordService.update(id, payload)
      : this.moduleWorkBreakRecordService.create(payload);

    obs.subscribe({
      next: (saved) => {
        const savedEditable: EditableBreak = {
          id: saved.id,
          custom_reason: payload.custom_reason!,
          startMinutes,
          endMinutes,
          updatedBy: saved.updated_by_username || saved.created_by_username || '—',
          updatedAt: saved.updated_at,
        };
        this.breaks.update((arr) => {
          const exists = arr.some((x) => x.id === savedEditable.id);
          return exists
            ? arr.map((x) => (x.id === savedEditable.id ? savedEditable : x))
            : [...arr, savedEditable];
        });
        this.saving.set(false);
        this.resetForm();
        this.dialogService.openToast('Guardado', 'Registro de Tiempo Excluido actualizado.', 'check');
      },
      error: () => {
        this.saving.set(false);
        this.dialogService.openToast('No se pudo guardar', 'Error al guardar el registro de Tiempo Excluido.', 'fail');
      },
    });
  }

  deleteBreak(b: EditableBreak): void {
    if (!b.id) {
      this.breaks.update((arr) => arr.filter((x) => x !== b));
      return;
    }
    this.moduleWorkBreakRecordService.delete(b.id).subscribe({
      next: () => {
        this.breaks.update((arr) => arr.filter((x) => x.id !== b.id));
        if (this.editingId() === b.id) {
          this.resetForm();
        }
        this.dialogService.openToast('Eliminado', 'Registro de Tiempo Excluido eliminado.', 'check');
      },
      error: () => this.dialogService.openToast('No se pudo eliminar', 'Error al eliminar el registro de Tiempo Excluido.', 'fail'),
    });
  }
}
