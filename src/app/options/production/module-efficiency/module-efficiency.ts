import { Component, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { UiOptionCard } from '../../../shared/elements/ui-option-card/ui-option-card';
import { OperationCarousel } from '../../../shared/components/operation-carousel/operation-carousel';
import { UiDatePicker } from '../../../shared/elements/ui-date-picker/ui-date-picker';
import { EllipsisPipe } from '../../../pipes/ellipsis-pipe';

interface Module { id: number; number: string; name: string; }
interface WorkShift { id: number; name: string; start_time: string; end_time: string; }
interface Employee { id: number; first_name: string; last_name1: string; last_name2?: string; }

@Component({
  selector: 'app-module-efficiency',
  imports: [
    WorkSpaceLayout,
    ReactiveFormsModule,
    UiFormField,
    UiButton,
    UiIcon,
    UiOptionCard,
    OperationCarousel,
    UiDatePicker,
    TitleCasePipe,
    EllipsisPipe,
  ],
  templateUrl: './module-efficiency.html',
  styleUrl: './module-efficiency.css',
})
export class ModuleEfficiencyPage {
  @ViewChild('moduleCarousel') moduleCarousel!: OperationCarousel;
  @ViewChild('workshiftCarousel') workshiftCarousel!: OperationCarousel;

  private fb = inject(FormBuilder);

  filterForm: FormGroup = this.fb.group({
    fecha_inicio: [null, Validators.required],
    fecha_fin: [null, Validators.required],
    modulo_id: [null, Validators.required],
    turno_id: [null, Validators.required],
    empleado_id: [null, Validators.required],
  });

  modules = signal<Module[]>([]);
  workShifts = signal<WorkShift[]>([]);
  employees = signal<Employee[]>([]);

  get moduloId() { return this.filterForm.get('modulo_id'); }
  get turnoId() { return this.filterForm.get('turno_id'); }
  get empleadoId() { return this.filterForm.get('empleado_id'); }

  isSelectedModule(mod: Module): boolean {
    return this.moduloId?.value === mod.id;
  }

  selectModule(id: number) {
    this.moduloId?.setValue(this.moduloId?.value === id ? null : id);
  }

  isSelectedShift(shift: WorkShift): boolean {
    return this.turnoId?.value === shift.id;
  }

  selectShift(id: number) {
    this.turnoId?.setValue(this.turnoId?.value === id ? null : id);
  }

  isSelectedEmployee(emp: Employee): boolean {
    return this.empleadoId?.value === emp.id;
  }

  selectEmployee(id: number) {
    this.empleadoId?.setValue(this.empleadoId?.value === id ? null : id);
  }

  allFieldsFilled(): boolean {
    return this.filterForm.valid;
  }

  prevModule() { this.moduleCarousel?.prev(); }
  nextModule() { this.moduleCarousel?.next(); }
  prevShift() { this.workshiftCarousel?.prev(); }
  nextShift() { this.workshiftCarousel?.next(); }
}
