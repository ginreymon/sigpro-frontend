import { Component, computed, inject, Input, OnInit, signal } from '@angular/core';
import { finalize } from 'rxjs';
import { DecimalPipe } from '@angular/common';
import { TableColumn } from '../../../common/interfaces/table-column';
import { PaginatedResponse } from '../../../common/interfaces/paginated-response';
import { DataTable } from '../../components/data-table/data-table';
import { TableTemplate } from '../../../directives/table-template';
import { ProductionOrderService } from '../../../services/production/production-order-service';
import { OrderMaterialsResponse } from '../../../models/production/order-materials';
import { WorkSpaceLoaderService } from '../../../services/common/work-space-loader-service';

interface FlatMaterial { 
  color:          string;
  size:           string;
  materialNumber: number;
  fabricCode:     string;
  fabricColor:    string;
  consumption:    number;
  description:    string;
  total:          number;
}

@Component({
  selector: 'app-materials-table',
  imports: [DataTable, TableTemplate],
  templateUrl: './materials-table.html',
})
export class MaterialsTable implements OnInit {
  @Input() docType!:   string;
  @Input() docNumber!: number;

  private productionOrderService = inject(ProductionOrderService);
  private wslService             = inject(WorkSpaceLoaderService);

  paginatedResponse = signal<PaginatedResponse<FlatMaterial> | null>(null);

  private allRows: FlatMaterial[] = [];

  readonly columns: TableColumn<FlatMaterial>[] = [
    { field: 'color',          label: 'Color' },
    { field: 'size',           label: 'Talla' },
    { field: 'materialNumber', label: 'N°',          align: 'right' },
    { field: 'fabricCode',     label: 'Código Tela' },
    { field: 'fabricColor',    label: 'Color Tela' },
    { field: 'description',    label: 'Descripción' },
    { type: 'template', templateName: 'consumoTemplate', label: 'Consumo', align: 'right' },
    { type: 'template', templateName: 'totalTemplate',   label: 'Total',   align: 'right' },
  ];

  ngOnInit(): void {
    this.load();
  }

  searchHandler(value: string): void {
    const term    = value.toLowerCase().trim();
    const results = term
      ? this.allRows.filter(r =>
          r.color.toLowerCase().includes(term)       ||
          r.size.toLowerCase().includes(term)        ||
          r.fabricCode.toLowerCase().includes(term)  ||
          r.fabricColor.toLowerCase().includes(term) ||
          r.description.toLowerCase().includes(term) ||
          r.materialNumber.toString().includes(term) ||
          r.consumption.toString().includes(term)    ||
          r.total.toString().includes(term)
        )
      : this.allRows;
    this.paginatedResponse.set({ count: results.length, next: null, previous: null, results });
  }

  private load(): void {
    this.wslService.start();
    this.productionOrderService.getMaterials(this.docType, this.docNumber)
      .pipe(finalize(() => this.wslService.end()))
      .subscribe({
        next: data => {
          const flat = this.flatten(data);
          this.allRows = flat.results;
          this.paginatedResponse.set(flat);
        },
      });
  }

  private flatten(data: OrderMaterialsResponse): PaginatedResponse<FlatMaterial> {
    const rows: FlatMaterial[] = [];
    for (const ref of data.references ?? []) {
      for (const col of ref.colors ?? []) {
        for (const size of col.sizes ?? []) {
          for (const mat of size.materials ?? []) {
            rows.push({            
              color:          col.color,
              size:           size.size,
              materialNumber: mat.materialNumber,
              fabricCode:     mat.fabricCode,
              fabricColor:    mat.fabricColor,
              consumption:    mat.consumption,
              description:    mat.description,
              total:          mat.total,
            });
          }
        }
      }
    }
    return { count: rows.length, next: null, previous: null, results: rows };
  }
}
