import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { DataTable } from '../../../../shared/components/table/data-table/data-table';
import { UiFormField } from '../../../../shared/elements/ui-form-field/ui-form-field';
import { UiInput } from '../../../../shared/elements/ui-input/ui-input';
import { UiSelect } from '../../../../shared/elements/ui-select/ui-select';
import { UiButton } from '../../../../shared/elements/ui-button/ui-button';
import { UiErrorMessage } from '../../../../shared/elements/ui-error-message/ui-error-message';
import { PaginatedResponse } from '../../../../common/interfaces/paginated-response';
import { TableColumn } from '../../../../common/interfaces/table-column';
import { ProductionRecord } from '../../../../models/production/production-record';
import { StampingRecord } from '../../../../models/stamping/stamping-record';
import { ProductionRecordService } from '../../../../services/production/production-record-service';
import { StampingRecordService } from '../../../../services/stamping/stamping-record-service';
import { BaseCrudService } from '../../../../services/common/base-crud-service';
import { LoaderService } from '../../../../services/common/loader-service';

// Records of both areas share the same table columns, so they are handled as one union.
type OrderRecord = ProductionRecord | StampingRecord;

interface AreaOption {
  name: string;
  value: 'production' | 'stamping';
}

// Lists the records of an OP (by area, OP type and number) so an administrator can review them.
@Component({
  selector: 'app-edit-records',
  imports: [
    DataTable,
    ReactiveFormsModule,
    UiFormField,
    UiInput,
    UiSelect,
    UiErrorMessage,
    UiButton,
  ],
  templateUrl: './edit-records.html',
})
export class EditRecords {
  private fb = inject(FormBuilder);
  private productionRecordService = inject(ProductionRecordService);
  private stampingRecordService = inject(StampingRecordService);
  private loader = inject(LoaderService);

  // One entry per area: adding a future area means adding its option and service here.
  protected readonly areas: AreaOption[] = [
    { name: 'Confección', value: 'production' },
    { name: 'Estampación', value: 'stamping' },
  ];

  protected readonly columns: TableColumn<OrderRecord>[] = [
    { field: 'id', label: 'Registro' },
    { field: 'op_number', label: 'OP' },
    { field: 'op_type', label: 'Tipo' },
    { field: 'start_time', label: 'Inicio', type: 'date' },
    { field: 'end_time', label: 'Fin', type: 'date' },
    { field: 'ordered_quantity', label: 'Ordenada (und)', type: 'number', align: 'right' },
    { field: 'completed_quantity', label: 'Completada (und)', type: 'number', align: 'right' },
  ];

  protected readonly searchForm = this.fb.group({
    area: ['production' as AreaOption['value'], Validators.required],
    op_type: ['', Validators.required],
    op_number: [null as number | null, Validators.required],
  });

  // `searched` separates "no search yet" from "search returned no records" in the template.
  protected records = signal<PaginatedResponse<OrderRecord> | null>(null);
  protected searched = signal(false);
  protected errorMessage = signal('');

  get area() {
    return this.searchForm.get('area');
  }

  get opType() {
    return this.searchForm.get('op_type');
  }

  get opNumber() {
    return this.searchForm.get('op_number');
  }

  search(): void {
    if (this.searchForm.invalid) {
      this.searchForm.markAllAsTouched();
      return;
    }
    const { area, op_type, op_number } = this.searchForm.getRawValue();
    // Pick the record service of the selected area.
    const service: BaseCrudService<OrderRecord> = area === 'stamping' ? this.stampingRecordService : this.productionRecordService;

    this.errorMessage.set('');
    this.loader.showLoader();
    service
      .getAll({ filters: { op_type: op_type!.trim().toUpperCase(), op_number: op_number! } })
      .subscribe({
        next: (res) => {
          this.records.set(res);
          this.searched.set(true);
          this.loader.hideLoader();
        },
        error: () => {
          this.errorMessage.set('No se pudieron consultar los registros. Intenta de nuevo.');
          this.loader.hideLoader();
        },
      });
  }
}
