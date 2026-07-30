import { Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { ProductionOrder } from '../../../../../models/production/production-order';
import { ColorDetail } from '../../../../../models/production/color-detail';
import { SizeQtyDetail } from '../../../../../models/production/size-detail';
import { UiTableButton } from '../../../../elements/ui-table-button/ui-table-button';
import { UiTooltipFixed } from '../../../../elements/ui-tooltip-fixed/ui-tooltip-fixed';
import { WorkSession } from '../../../../../models/production/work-session';
import { ButtonBaseType } from '../../../../../common/classes/button-base';
import { DialogService } from '../../../../../services/common/dialog-service';
import { SkuTaskDetail } from '../../../../../models/production/sku-task-detail';
import { ProductionOrderService } from '../../../../../services/production/production-order-service';
import { LoaderService } from '../../../../../services/common/loader-service';
import { finalize } from 'rxjs';
import { UiTooltip } from "../../../../elements/ui-tooltip/ui-tooltip";
import { UiIcon } from "../../../../elements/ui-icon/ui-icon";
import { TableColumnFilter } from '../../../table/table-column-filter/table-column-filter';
import { buildColorSizeMatrix } from './color-size-matrix';

@Component({
  selector: 'app-production-orders-table',
  imports: [UiTableButton, UiTooltipFixed, UiTooltip, UiIcon, TableColumnFilter],
  templateUrl: './production-orders-table.html',
  styleUrl: './production-orders-table.css',
})
export class ProductionOrdersTable {
  @ViewChild(TableColumnFilter) private colorFilterPanel!: TableColumnFilter;

  private selectedColors = new Set<string>();
  protected colorFilterOpen = false;

  protected get filteredSkuColors(): ColorDetail[] {
    if (this.selectedColors.size === 0) return this.skuColors;
    return this.skuColors.filter((c) => this.selectedColors.has(c.color));
  }

  protected get colorFilterValues(): string[] {
    return [...new Set(this.skuColors.map((c) => c.color))].sort((a, b) => a.localeCompare(b));
  }

  protected get isColorFilterActive(): boolean {
    return this.selectedColors.size > 0;
  }

  protected readonly isColorChecked = (value: any): boolean => this.selectedColors.has(value);

  protected toggleColorFilterDropdown(event: MouseEvent): void {
    event.stopPropagation();
    if (this.colorFilterOpen) {
      this.colorFilterPanel.close();
      return;
    }
    this.colorFilterOpen = true;
    this.colorFilterPanel.open(event.currentTarget as HTMLElement);
  }

  protected toggleColorValue(value: any): void {
    if (this.selectedColors.has(value)) this.selectedColors.delete(value);
    else this.selectedColors.add(value);
  }

  protected clearColorFilter(): void {
    this.selectedColors.clear();
    this.colorFilterPanel.close();
  }

  protected onColorFilterClosed(): void {
    this.colorFilterOpen = false;
  }
  private _productionOrder: ProductionOrder | null = null;
  sizes: string[] = [];
  skuColors: ColorDetail[] = [];
  totalBySizes: SizeQtyDetail[] = [];
  grandTotal: SizeQtyDetail | null = null;
  dialogService = inject(DialogService);
  poService = inject(ProductionOrderService);

  private loaderService = inject(LoaderService);

  get productionOrder() {
    return this._productionOrder;
  }

  @Input()
  set productionOrder(po: ProductionOrder | null) {
    this._productionOrder = po;

    if (!po) {
      this.sizes = [];
      this.skuColors = [];
      this.totalBySizes = [];
      this.grandTotal = null;
      return;
    }

    const matrix = buildColorSizeMatrix(po);
    this.sizes = matrix.sizes;
    this.skuColors = matrix.skuColors;
    this.totalBySizes = matrix.totalBySizes;
    this.grandTotal = matrix.grandTotal;
  }

  @Input() currentSession: WorkSession | null = null;
  @Input() readOnly: boolean = false;
  @Output() onSelectSKU = new EventEmitter<SkuTaskDetail>();

  getProducedQty(size: any): number {
    return Number(size.completedQty) + Number(size.rejectedQty) + Number(size.wasteQty);
  }

  getButtonIntent(size: any): ButtonBaseType {
    if (this.getProducedQty(size) === size.orderedQty) return 'cancel';
    if (size.hasOpenRecords === true) return 'action';
    if (this.getProducedQty(size) > 0) return 'danger';
    return 'label';
  }

  selectSKU(docType: string, docNumber: number, skuRowId: number) {
    this.loaderService.showLoader();
    this.poService.getSkuDetail(docType, docNumber, skuRowId)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe({
        next: (sku) => {
          this.onSelectSKU.emit(sku);
        },
      })
  }
}
