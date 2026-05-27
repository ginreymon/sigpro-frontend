import { Component, OnInit, ViewChild, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { TitleCasePipe } from '@angular/common';
import { forkJoin, finalize } from 'rxjs';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { UiOptionCard } from '../../../shared/elements/ui-option-card/ui-option-card';
import { OperationCarousel } from '../../../shared/components/operation-carousel/operation-carousel';
import { UiDatePicker } from '../../../shared/elements/ui-date-picker/ui-date-picker';
import { EllipsisPipe } from '../../../pipes/ellipsis-pipe';
import { Searcher } from '../../../shared/components/searcher/searcher';
import { EmployeeService } from '../../../services/production/employee-service';
import { ModuleService } from '../../../services/production/module-service';
import { WorkShiftService } from '../../../services/production/work-shift-service';
import { WorkSpaceLoaderService } from '../../../services/common/work-space-loader-service';
import { LoaderService } from '../../../services/common/loader-service';
import { ProductivityService } from '../../../services/production/productivity-service';
import { localDateToUtcIso } from '../../../common/functions/date-utils';
import { Employee } from '../../../models/production/employee';
import { Module } from '../../../models/production/module';
import { WorkShift } from '../../../models/production/work-shift';

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
    Searcher,
  ],
  templateUrl: './module-efficiency.html',
  styleUrl: './module-efficiency.css',
})
export class ModuleEfficiency implements OnInit {
  @ViewChild('moduleCarousel') moduleCarousel!: OperationCarousel;
  @ViewChild('workshiftCarousel') workshiftCarousel!: OperationCarousel;
  @ViewChild('searcher') private searcher!: Searcher;

  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private moduleService = inject(ModuleService);
  private workShiftService = inject(WorkShiftService);
  private wslService = inject(WorkSpaceLoaderService);
  private loaderService = inject(LoaderService);
  private productivityService = inject(ProductivityService);

  filterForm: FormGroup = this.fb.group({
    fecha_inicio: [null, Validators.required],
    fecha_fin: [null, Validators.required],
    modulo_id: [null, Validators.required],
    turno_id: [null],
    empleado_id: [null],
  });

  modules = signal<Module[]>([]);
  workShifts = signal<WorkShift[]>([]);
  employees = signal<Employee[]>([]);
  filteredEmployees = signal<Employee[]>([]);

  ngOnInit() {
    this.filterForm.get('fecha_inicio')!.valueChanges.subscribe(() => this.validateDateRange(false));
    this.filterForm.get('fecha_fin')!.valueChanges.subscribe(() => this.validateDateRange(true));

    this.wslService.start();
    forkJoin({
      modules: this.moduleService.all(),
      workShifts: this.workShiftService.all(),
      employees: this.employeeService.all(),
    })
      .pipe(finalize(() => this.wslService.end()))
      .subscribe(({ modules, workShifts, employees }) => {
        this.modules.set(modules);
        this.workShifts.set(workShifts);
        const sorted = this.sortEmployees(employees);
        this.employees.set(sorted);
        this.filteredEmployees.set(sorted);
      });
  }

  private validateDateRange(markTouched: boolean): void {
    const inicio     = this.filterForm.get('fecha_inicio')?.value;
    const fin        = this.filterForm.get('fecha_fin')?.value;
    const finControl = this.filterForm.get('fecha_fin')!;

    if (inicio && fin && fin < inicio) {
      const current = finControl.errors ?? {};
      finControl.setErrors({ ...current, fechaFinMenor: true });
      if (markTouched) finControl.markAsTouched();
    } else {
      if (finControl.errors?.['fechaFinMenor']) {
        const { fechaFinMenor, ...rest } = finControl.errors;
        finControl.setErrors(Object.keys(rest).length ? rest : null);
      }
    }
  }

  private sortEmployees(list: Employee[]): Employee[] {
    return [...list].sort((a, b) => a.first_name.localeCompare(b.first_name));
  }

  search(text: string): void {
    const words = text?.toLowerCase().trim();
    this.filteredEmployees.set(
      !words
        ? this.sortEmployees(this.employees())
        : this.employees().filter(
            (emp) =>
              emp.first_name.toLowerCase().includes(words) ||
              emp.last_name1.toLowerCase().includes(words) ||
              emp.last_name2?.toLowerCase().includes(words) ||
              emp.id_number.includes(words),
          ),
    );
  }

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

  exportFile(): void {
    const { fecha_inicio, fecha_fin, modulo_id, turno_id, empleado_id } = this.filterForm.value;

    this.loaderService.showLoader();
    this.productivityService.exportSummaryExcel({
      startDate:        localDateToUtcIso(fecha_inicio),
      endDate:          localDateToUtcIso(fecha_fin, 1),
      clientNow:        new Date().toISOString(),
      moduleId:         modulo_id   ?? undefined,
      shiftId:          turno_id    ?? undefined,
      employeeId:       empleado_id ?? undefined,
      utcOffsetMinutes: -new Date().getTimezoneOffset(),
    })
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe(blob => {
        const url  = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href  = url;
        const modName  = this.modules().find(m => m.id === modulo_id)?.name ?? 'modulo';
        link.download = `${modName.replace(/\s+/g, '_')}_${fecha_inicio}_${fecha_fin}.xlsx`;
        link.click();
        URL.revokeObjectURL(url);
      });
  }

}
