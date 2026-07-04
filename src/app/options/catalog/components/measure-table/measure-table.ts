import { Component, Input, OnChanges, signal } from '@angular/core';
import { UiIcon } from '../../../../shared/elements/ui-icon/ui-icon';
import { MeasureCellInput } from '../measure-cell-input/measure-cell-input';
import { SheetMeasurement } from '../../../../models/catalog/sheet-measurement';
import { SheetElasticCut } from '../../../../models/catalog/sheet-elastic-cut';
import { UiTooltipFixed } from '../../../../shared/elements/ui-tooltip-fixed/ui-tooltip-fixed';
import { EllipsisPipe } from '../../../../pipes/ellipsis-pipe';

export interface MeasureTableRow {
  measurement: string;
  tolerance: string;
  values: Record<string, string>;
  editing: boolean;
}

@Component({
  selector: 'app-measure-table',
  imports: [UiIcon, UiTooltipFixed, MeasureCellInput, EllipsisPipe],
  templateUrl: './measure-table.html',
  styleUrl: './measure-table.css',
  host: { class: 'block min-w-full max-w-full' },
})
export class MeasureTable implements OnChanges {
  @Input() measurements: SheetMeasurement[] | null = null;
  @Input() elasticCuts: SheetElasticCut[] | null = null;
  @Input() hideActions: boolean = false;

  @Input()
  set sizes(value: string[]) {
    this._inputSizes = (value ?? []).map(s => s.trim());
    this.updateSizes();
  }

  private _inputSizes: string[] = [];
  private _sizes = signal<string[]>([]);

  get sizes(): string[] {
    return this._sizes();
  }

  rows = signal<MeasureTableRow[]>([]);

  private lastSignature = '';

  get showTolerance(): boolean {
    return !!this.measurements;
  }

  ngOnChanges(): void {
    this.updateSizes();  
      
    const source: (SheetMeasurement | SheetElasticCut)[] = [
      ...(this.measurements ?? this.elasticCuts ?? [])
    ].sort((a, b) =>
      (a.measurement ?? '').localeCompare(
        b.measurement ?? '',
        undefined,
        { sensitivity: 'base' }
      )
    );

    const signature = JSON.stringify({
      mode: this.measurements ? 'measurements' : 'elasticCuts',
      rows: source.map((item) => [item.measurement, (item as SheetMeasurement).tolerance ?? null]),
      sizes: this.sizes,
    });

    if (signature === this.lastSignature) {
      return;
    }
    this.lastSignature = signature;

    this.rows.set(
      source.map((item) => ({
        measurement: item.measurement ?? '',
        tolerance: this.measurements ? ((item as SheetMeasurement).tolerance ?? '') : '',
        values: {
          ...Object.fromEntries(
            this.sizes.map(size => [size, ''])
          ),
          ...Object.fromEntries(
            (item.details ?? []).map(detail => [
              detail.size?.trim() ?? '',
              detail.value ?? '',
            ])
          ),
        },
        editing: false,
      })),
    );
  }

  private updateSizes(): void {
    const source: (SheetMeasurement | SheetElasticCut)[] = this.measurements ?? this.elasticCuts ?? [];

    const detailSizes = source.flatMap(measure =>
      (measure.details ?? [])
        .map(detail => detail.size?.trim())
        .filter((size): size is string => !!size)
    );

    this._sizes.set([
      ...new Set([
        ...this._inputSizes,
        ...detailSizes,
      ]),
    ]);
  }

  toggleEdit(index: number): void {
    this.rows.update((rows) =>
      rows.map((row, i) => {
        if (i === index) return { ...row, editing: !row.editing };
        return row.editing ? { ...row, editing: false } : row;
      }),
    );
  }

  updateValue(index: number, field: 'measurement' | 'tolerance', value: string): void {
    this.rows.update((rows) => rows.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }

  updateSizeValue(index: number, size: string, value: string): void {
    this.rows.update((rows) =>
      rows.map((row, i) => (i === index ? { ...row, values: { ...row.values, [size]: value } } : row)),
    );
  }

  deleteRow(index: number): void {
    this.rows.update((rows) => rows.filter((_, i) => i !== index));
  }

  addRow(): void {
    this.rows.update((rows) => [
      ...rows.map((row) => (row.editing ? { ...row, editing: false } : row)),
      {
        measurement: '',
        tolerance: '',
        values: Object.fromEntries(this.sizes.map((size) => [size, ''])),
        editing: true,
      },
    ]);
  }

  displayValue(value: string): string {
    return value?.trim() ? value : '0';
  }
}
