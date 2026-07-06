import { Component, OnInit, ViewChild, inject, signal, computed } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiFormField } from '../../../shared/elements/ui-form-field/ui-form-field';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { OperationCarousel } from '../../../shared/components/operation-carousel/operation-carousel';
import { ModuleOptionCard } from '../../../shared/components/module-option-card/module-option-card';
import { WorkShiftOptionCard } from '../../../shared/components/work-shift-option-card/work-shift-option-card';
import { DateRangeFields } from '../../../shared/components/date-range-fields/date-range-fields';
import { EmployeePicker } from '../../../shared/components/employee-picker/employee-picker';
import { DataTable } from '../../../shared/components/data-table/data-table';
import { EmployeeService } from '../../../services/production/employee-service';
import { ModuleService } from '../../../services/production/module-service';
import { WorkShiftService } from '../../../services/production/work-shift-service';
import { WorkSpaceLoaderService } from '../../../services/common/work-space-loader-service';
import { LoaderService } from '../../../services/common/loader-service';
import { ProductivityService } from '../../../services/production/productivity-service';
import { RouteContextService } from '../../../services/core/route-context-service';
import { Employee } from '../../../models/production/employee';
import { Module } from '../../../models/production/module';
import { WorkShift } from '../../../models/production/work-shift';
import { EfficiencyReportRow } from '../../../models/production/efficiency-report-row';

import { TableColumn } from '../../../common/interfaces/table-column';

@Component({
  selector: 'app-data-export',
  imports: [
    WorkSpaceLayout,
    ReactiveFormsModule,
    UiFormField,
    UiButton,
    UiIcon,
    OperationCarousel,
    ModuleOptionCard,
    WorkShiftOptionCard,
    DateRangeFields,
    EmployeePicker,
    DataTable,  
  ],
  templateUrl: './data-export.html',
  styleUrl: './data-export.css',
})
export class DataExport implements OnInit {
  @ViewChild('moduleCarousel') moduleCarousel!: OperationCarousel;
  @ViewChild('workshiftCarousel') workshiftCarousel!: OperationCarousel;

  private fb = inject(FormBuilder);
  private employeeService = inject(EmployeeService);
  private moduleService = inject(ModuleService);
  private workShiftService = inject(WorkShiftService);
  private wslService = inject(WorkSpaceLoaderService);
  private loaderService = inject(LoaderService);
  private productivityService = inject(ProductivityService);
  private routeContextService = inject(RouteContextService);

  filterForm: FormGroup = this.fb.group({
    fecha_inicio: [null, Validators.required],
    fecha_fin: [null, Validators.required],
    modulo_id: [null],
    turno_id: [null],
    empleado_id: [null],
  });

  modules    = signal<Module[]>([]);
  workShifts = signal<WorkShift[]>([]);
  employees  = signal<Employee[]>([]);

  efficiencyRows = signal<EfficiencyReportRow[]>([]);

  pagedRows = computed(() => ({
    count:    this.efficiencyRows().length,
    next:     null as string | null,
    previous: null as string | null,
    results:  this.efficiencyRows(),
  }));

  readonly columns: TableColumn<EfficiencyReportRow>[] = [
    { field: 'shift_start_utc',    label: 'Jornada' },
    { field: 'module_number',      label: 'Módulo' },
    { field: 'module_name',        label: 'Nombre Módulo' },
    { field: 'shift_name',         label: 'Turno' },
    { field: 'shift_start_time',   label: 'Inicio Turno' },
    { field: 'shift_end_time',     label: 'Fin Turno' },
    { field: 'total_employees',    label: 'Operarios (ef.)',    align: 'right' },
    { field: 'total_ordered',      label: 'Ordenadas',    align: 'right' },
    { field: 'total_planned',      label: 'Planeadas',    align: 'right' },
    { field: 'total_completed',    label: 'Completadas',  align: 'right' },
    { field: 'total_scrap',        label: 'Desechos',     align: 'right' },
    { field: 'total_rejected',     label: 'Rechazos',     align: 'right' },
    { field: 'total_produced',     label: 'Producción',   align: 'right' },
    { field: 'unit_target',        label: 'Meta',         align: 'right' },
    { field: 'efficiency',         label: 'Eficiencia %', align: 'right' },
    { field: 'total_break_minutes',label: 'Min. Pausa',   align: 'right' },
    { field: 'pause_count',        label: 'N° Pausas',    align: 'right' },
  ];

  ngOnInit() {
    this.wslService.start();
    forkJoin({
      modules:    this.moduleService.all(),
      workShifts: this.workShiftService.all(),
      employees:  this.employeeService.all(),
    })
      .pipe(finalize(() => this.wslService.end()))
      .subscribe(({ modules, workShifts, employees }) => {
        const currentModuleUrl = this.routeContextService.currentModule?.url;
        const scopedShifts = workShifts.filter((w) => w.app_module_detail?.url === currentModuleUrl);
        this.modules.set(modules);
        this.workShifts.set(scopedShifts.filter((e) => (e?.is_active ?? true) && !e?.is_deleted));
        this.employees.set(this.sortEmployees(employees));
      });
  }

  private sortEmployees(list: Employee[]): Employee[] {
    return [...list].sort((a, b) => a.first_name.localeCompare(b.first_name));
  }

  get moduloId()   { return this.filterForm.get('modulo_id'); }
  get turnoId()    { return this.filterForm.get('turno_id'); }
  get empleadoId() { return this.filterForm.get('empleado_id'); }

  isAllModulesSelected(): boolean { return this.moduloId?.value === null; }
  selectAllModules(): void { this.moduloId?.setValue(null); }
  isSelectedModule(mod: Module): boolean { return this.moduloId?.value === mod.id; }
  selectModule(id: number) { this.moduloId?.setValue(this.moduloId?.value === id ? null : id); }

  isSelectedShift(shift: WorkShift): boolean { return this.turnoId?.value === shift.id; }
  selectShift(id: number) { this.turnoId?.setValue(this.turnoId?.value === id ? null : id); }

  isSelectedEmployee(emp: Employee): boolean { return this.empleadoId?.value === emp.id; }
  selectEmployee(id: number) { this.empleadoId?.setValue(this.empleadoId?.value === id ? null : id); }

  allFieldsFilled(): boolean { return this.filterForm.valid; }

  prevModule() { this.moduleCarousel?.prev(); }
  nextModule() { this.moduleCarousel?.next(); }
  prevShift()  { this.workshiftCarousel?.prev(); }
  nextShift()  { this.workshiftCarousel?.next(); }

  generateReport(): void {
    const { fecha_inicio, fecha_fin, modulo_id, turno_id, empleado_id } = this.filterForm.value;

    this.loaderService.showLoader();
    this.productivityService.getEfficiencyReport({
      startDate:  fecha_inicio,
      endDate:    fecha_fin,
      moduleId:   modulo_id   ?? undefined,
      shiftId:    turno_id    ?? undefined,
      employeeId: empleado_id ?? undefined,
    })
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe(rows => this.efficiencyRows.set(rows));
  }

  downloadReport(): void {
    const { fecha_inicio, fecha_fin, modulo_id, turno_id, empleado_id } = this.filterForm.value;

    this.loaderService.showLoader();
    this.productivityService.downloadEfficiencyReport({
      startDate:  fecha_inicio,
      endDate:    fecha_fin,
      moduleId:   modulo_id   ?? undefined,
      shiftId:    turno_id    ?? undefined,
      employeeId: empleado_id ?? undefined,
    })
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe(blob => {
        const url = URL.createObjectURL(blob);
        const a   = document.createElement('a');
        a.href     = url;
        a.download = `eficiencia_${fecha_inicio}_${fecha_fin}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
      });
  }
}
