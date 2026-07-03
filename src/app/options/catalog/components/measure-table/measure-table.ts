import { Component, Input } from '@angular/core';
import { DataTable } from '../../../../shared/components/data-table/data-table';
import { TableColumn } from '../../../../common/interfaces/table-column';
import { TableRow } from '../../../../common/interfaces/table-row';
import { SheetMeasurement } from '../../../../models/catalog/sheet-measurement';
import { SheetElasticCut } from '../../../../models/catalog/sheet-elastic-cut';

type MeasureRow = Record<string, string | number | null>;

@Component({
  selector: 'app-measure-table',
  imports: [DataTable],
  templateUrl: './measure-table.html',
  styleUrl: './measure-table.css',
  host: { class: 'block min-w-full max-w-full' },
})
export class MeasureTable {
  @Input() measurements: SheetMeasurement[] | null = null;
  @Input() elasticCuts: SheetElasticCut[] | null = null;
  @Input() sizes: string[] = [];

  get columns(): TableColumn<MeasureRow>[] {
    const columns: TableColumn<MeasureRow>[] = [
      { field: 'measurement', label: 'Medida' },
      ...this.sizes.map((size) => ({ field: size, label: size })),
    ];

    if (this.measurements) {
      columns.push({ field: 'tolerance', label: 'Tolerancia' });
    }

    return columns;
  }

  get rows(): TableRow<MeasureRow>[] {
    const source: (SheetMeasurement | SheetElasticCut)[] = this.measurements ?? this.elasticCuts ?? [];

    return source.map((item) => ({
      selected: false,
      obj: {
        measurement: item.measurement,
        ...Object.fromEntries(this.sizes.map((size) => [size, null])),
        ...(this.measurements ? { tolerance: (item as SheetMeasurement).tolerance } : {}),
      },
    }));
  }
}
