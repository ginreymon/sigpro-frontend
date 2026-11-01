import { Component, inject } from '@angular/core';
import { ValidatorFn, Validators } from '@angular/forms';
import { Observable } from 'rxjs';
import { exceedsMaxValidator, integerValidator } from '../../../../../common/functions/quantity-validators';
import { apiErrorDetail } from '../../../../../common/functions/api-error';
import { ProductionRecordService } from '../../../../../services/production/production-record-service';
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { ProductionOrderService } from '../../../../../services/production/production-order-service';
import { BaseRecordForm, COMPLETED, END, Field, Group, ORDERED, RECORD_FORM_IMPORTS, START, TEP } from './base-record-form';

const QUANTITIES = ['completed_quantity', 'scrap_quantity', 'rejected_quantity'];

// Edit form of a confección record: whole-unit quantities capped by what the OP still allows for the SKU
// (sku-detail totals, same rules as app-quantity-modal), saved with PUT.
@Component({
  selector: 'app-production-record-form',
  imports: RECORD_FORM_IMPORTS,
  templateUrl: './base-record-form.html',
})
export class ProductionRecordForm extends BaseRecordForm {
  private orderService = inject(ProductionOrderService);
  private appConfig = inject(AppConfigService);
  protected service = inject(ProductionRecordService);

  protected groups: Group[] = [
    { legend: 'Tiempos', fields: [START, END] },
    {
      legend: 'Cantidades',
      fields: [
        ORDERED,
        { name: 'planned_quantity', label: 'Cantidad planificada', type: 'decimal', readonly: true },
        COMPLETED,
        { name: 'scrap_quantity', label: 'Cantidad de desecho', type: 'decimal' },
        { name: 'rejected_quantity', label: 'Cantidad rechazada', type: 'decimal' },
      ],
    },
    TEP,
  ];

  // Units still available for this SKU (sku-detail totals, this record's own units added back); null until loaded.
  private maxAvailable: number | null = null;

  protected get summary(): string {
    const d = this.data;
    const size = d['sku']?.size;
    return [`OP ${d['op_number'] ?? ''}`, d['sku']?.reference, d['sku']?.color, size && `Talla ${size}`].filter(Boolean).join(' · ');
  }

  protected override validatorsFor(f: Field): ValidatorFn[] {
    const validators = super.validatorsFor(f);
    return !f.readonly && QUANTITIES.includes(f.name) ? [...validators, Validators.required, integerValidator] : validators;
  }

  protected override afterInit(): void {
    this.appConfig.load().subscribe(() => this.applyDatetimePolicy());
    const d = this.data;
    if (!d['op_type'] || !d['op_number'] || !d['sku_rowid']) return;
    const own = QUANTITIES.reduce((sum, q) => sum + Number(d[q] ?? 0), 0);
    this.form.addValidators(exceedsMaxValidator(() => this.maxAvailable));
    this.orderService.getSkuDetail(String(d['op_type']).trim(), d['op_number'], d['sku_rowid']).subscribe({
      next: (sku) => {
        this.maxAvailable = Number(sku.orderedQty) - (Number(sku.completedQty) + Number(sku.wasteQty) + Number(sku.rejectedQty)) + own;
        this.form.updateValueAndValidity();
      },
      error: (err) =>
        this.dialogService.openToast('Error', apiErrorDetail(err, 'No se pudo consultar el estado del SKU en la OP.'), 'error'),
    });
  }

  // ALLOW_PRODUCTION_RECORD_DATETIME_EDIT off: the start time is locked and follows the end time (the end
  // time stays editable, inside the session interval).
  private applyDatetimePolicy(): void {
    if (this.appConfig.allowProductionRecordDatetimeEdit) return;
    const start = this.form.get('start_time');
    const end = this.form.get('end_time');
    if (!start || !end) return;
    if (end.value) start.setValue(end.value);
    start.disable();
    end.valueChanges.subscribe((v) => v && start.setValue(v));
  }

  // The locked start time is not part of the form value: send it equal to the end time.
  protected override payload(): Record<string, any> {
    const payload = super.payload();
    if (this.form.get('start_time')?.disabled && payload['end_time']) payload['start_time'] = payload['end_time'];
    return payload;
  }

  // Wait for the sku-detail limit so the sum is always checked before saving.
  protected override canSave(): boolean {
    return super.canSave() && this.maxAvailable !== null;
  }

  // PUT needs the whole record. The explorer JSON carries DB columns (work_session_activity_id) while the
  // serializer expects FK names (work_session_activity): strip "_id" and drop nested objects such as `sku`.
  protected override request(payload: Record<string, any>): Observable<unknown> {
    const base = Object.fromEntries(
      Object.entries(this.data)
        .filter(([, v]) => v === null || typeof v !== 'object')
        .map(([k, v]) => [k !== 'id' && k.endsWith('_id') ? k.slice(0, -3) : k, v]),
    );
    return this.service.update(this.data['id'], { ...base, ...payload });
  }
}
