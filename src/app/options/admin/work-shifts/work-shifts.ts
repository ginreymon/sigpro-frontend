import { Component, signal } from '@angular/core';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { WorkShift } from '../../../models/production/work-shift';
import { WorkShiftService } from '../../../services/production/work-shift-service';
import { ProductionArea } from '../../../models/production/production-area';
import { ProductionAreaService } from '../../../services/production/production-area-service';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { SideModalLayout } from '../../../shared/components/side-modal-layout/side-modal-layout';
import { ModalLayout } from '../../../shared/components/modal-layout/modal-layout';
import { AbstractControl, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { UiErrorMessage } from '../../../shared/elements/ui-error-message/ui-error-message';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../shared/elements/ui-input/ui-input';
import { UiSelect } from '../../../shared/elements/ui-select/ui-select';
import { UiHourInput } from '../../../shared/elements/ui-hour-input/ui-hour-input';
import { FormFieldConfig } from '../../../common/interfaces/form-field-config';
import { TableActionEvent } from '../../../common/interfaces/table-action-event';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { TableTemplate } from '../../../directives/table-template';
import { UiCheckbox } from '../../../shared/elements/ui-checkbox/ui-checkbox';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response';
import { CharSquare } from "../../../shared/components/char-square/char-square";
import { Metadata } from "../../../shared/components/metadata/metadata";
import { TableColumn } from '../../../common/interfaces/table-column';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-work-shifts',
  imports: [
    WorkSpaceLayout,
    DataTable,
    SideModalLayout,
    ModalLayout,
    ReactiveFormsModule,
    UiErrorMessage,    
    UiFormField,
    UiInput,
    UiSelect,
    UiHourInput,
    UiBadge,
    TableTemplate,
    UiCheckbox,
    CharSquare,
    Metadata, 
    TitleCasePipe   
],
  templateUrl: './work-shifts.html',
  styleUrl: './work-shifts.css',
})
export class WorkShifts extends BaseCrudPage<WorkShift> {
  protected override entityName: string = 'Turno';
  productionAreas = signal<ProductionArea[]>([]);

  constructor(
    private workShiftService: WorkShiftService,
    private productionAreaService: ProductionAreaService,
  ) {
    super(workShiftService);
    this.getProductionAreas();
  }

  protected override get columns(): TableColumn<WorkShift>[] {
    return [
      { field: 'name', label: 'Nombre' },
      { field: 'start_time', label: 'Hora inicio' },
      { field: 'end_time', label: 'Hora finalización' },
      { type: 'template', label: 'Tiempo total', templateName: 'totalTimeTemplate' },
      { type: 'template', label: 'Estado', templateName: 'statusTemplate' },
    ];
  }

  protected override initializeModelForm(): void {
    const hourValidators = [Validators.required, Validators.min(0), Validators.max(23)];
    const minutesValidators = [Validators.required, Validators.min(0), Validators.max(59)];
    this.modelForm = this.fb.group({
      name: [null, [Validators.required, Validators.minLength(4)]],
      startHour: [0, hourValidators],
      endHour: [0, hourValidators],
      startMinutes: [0, minutesValidators],
      endMinutes: [0, minutesValidators],
      location_id: [null],
      is_active: [true],
    }, { validators: WorkShifts.timeOrderValidator });
  }

  get locationId() {
    return this.modelForm.get('location_id');
  }

  getProductionAreas() {
    this.loadList(this.productionAreaService, this.productionAreas, true,
      items => items.sort((a, b) => a.name.localeCompare(b.name))
    );
  }

  private static timeOrderValidator(group: AbstractControl): ValidationErrors | null {
    const sh = Number(group.get('startHour')?.value ?? 0);
    const sm = Number(group.get('startMinutes')?.value ?? 0);
    const eh = Number(group.get('endHour')?.value ?? 0);
    const em = Number(group.get('endMinutes')?.value ?? 0);
    return sh * 60 + sm >= eh * 60 + em ? { timeOrder: true } : null;
  }

  get timeOrderInvalid(): boolean {
    if (!this.modelForm.hasError('timeOrder')) return false;
    return !!(this.startHour?.touched || this.startMinutes?.touched ||
              this.endHour?.touched   || this.endMinutes?.touched);
  }

  get name() {
    return this.modelForm.get('name');
  }

  get startHour() {
    return this.modelForm.get('startHour');
  }

  get endHour() {
    return this.modelForm.get('endHour');
  }

  get startMinutes() {
    return this.modelForm.get('startMinutes');
  }

  get endMinutes() {
    return this.modelForm.get('endMinutes');
  }

  get isActive() {
    return this.modelForm.get('is_active');
  }

  get timeControls(): FormFieldConfig[] {
    return [
      { label: 'Hora inicio', controlName: 'startHour' },
      { label: 'Minutos inicio', controlName: 'startMinutes' },
      { label: 'Hora finalización', controlName: 'endHour' },
      { label: 'Minutos finalización', controlName: 'endMinutes' },
    ];
  }

  computeTime(sh: number, sm: number, eh: number, em: number) {
    const startTotal = sh * 60 + sm;
    const endTotal = eh * 60 + em;

    let diff = endTotal - startTotal;

    if (diff < 0) {
      diff += 24 * 60; // handles overnight shifts
    }

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;

    return `${hours} horas ${minutes.toString().padStart(2, '0')} minutos`;
  }

  get totalTime(): string {
    const sh = Number(this.startHour?.value ?? 0);
    const sm = Number(this.startMinutes?.value ?? 0);
    const eh = Number(this.endHour?.value ?? 0);
    const em = Number(this.endMinutes?.value ?? 0);
    return this.computeTime(sh, sm, eh, em);
  }

  protected override submit(): void {
    const pad = (v: number | null) => String(v ?? 0).padStart(2, '0');
    const workshift: Partial<WorkShift> = {
      ...this.modelForm.value,
      start_time: `${pad(this.startHour?.value)}:${pad(this.startMinutes?.value)}`,
      end_time: `${pad(this.endHour?.value)}:${pad(this.endMinutes?.value)}`,
    };
    super.submit(workshift);
  }

  protected override mapResponse(res: PaginatedResponse<WorkShift>) {
    return {
      ...res,
      results: res.results.map((ws) => {
        const [sh, sm] = ws.start_time.split(':').map(Number);
        const [eh, em] = ws.end_time.split(':').map(Number);
        ws.totalTime = this.computeTime(sh, sm, eh, em);      
        return ws;
      }),
    };
  }

  protected override actionHandler(event: TableActionEvent<WorkShift>): void {
    super.actionHandler(event);
    if (event.type == 'edit') {
      const [startHour, startMinutes] = event.obj.start_time.split(':').map(Number);
      const [endHour, endMinutes] = event.obj.end_time.split(':').map(Number);
      this.modelForm.patchValue({ ...event.obj, startHour, startMinutes, endHour, endMinutes });
      this.locationId?.setValue(event.obj.location?.id ?? null);
    }
  }
}
