import { Component, ContentChildren, EventEmitter, inject, Input, Output, QueryList, TemplateRef, ViewChild } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { ProductionOrder } from '../../../../../models/production/production-order';
import { ColorRowDetail } from '../../../../../models/production/color-row-detail';
import { SkuDetail } from '../../../../../models/production/sku-detail';
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
import { applyPendingRecords, buildColorSizeMatrix, emptySize, sumInto } from './color-size-matrix';
import { TableTemplate, TableTemplateContext } from '../../../../../directives/table-template';
import { ProductionTableCustomColumn } from './production-table-custom-column';
import { ProductionRecord } from '../../../../../models/production/production-record';

@Component({
  selector: 'app-production-orders-table',
  imports: [UiTableButton, UiTooltipFixed, UiTooltip, UiIcon, TableColumnFilter, NgTemplateOutlet],
  templateUrl: './production-orders-table.html',
  styleUrl: './production-orders-table.css',
})
export class ProductionOrdersTable {
  @ViewChild(TableColumnFilter) private colorFilterPanel!: TableColumnFilter;

  @Input() customColumns: ProductionTableCustomColumn[] = [];
  @Input() colorColumnLabel = 'Color SKU';
  @Input() sizeTooltipLabel = 'Talla';

  @ContentChildren(TableTemplate) private templates!: QueryList<TableTemplate<SkuDetail>>;
  protected templateMap = new Map<string, TemplateRef<TableTemplateContext<SkuDetail>>>();

  ngAfterContentInit(): void {
    this.templates.forEach((t) => this.templateMap.set(t.name, t.template));
  }

  private selectedColors = new Set<string>();
  protected colorFilterOpen = false;

  protected get filteredSkuColors(): ColorRowDetail[] {
    if (this.selectedColors.size === 0) return this.skuColors;
    return this.skuColors.filter((c) => this.selectedColors.has(c.color));
  }
  
  protected filteredTotalBySizes: SkuDetail[] = [];
  protected filteredGrandTotal: SkuDetail = emptySize('');

  private updateFilteredTotals(): void {
    if (this.selectedColors.size === 0) {
      this.filteredTotalBySizes = this.totalBySizes;
      this.filteredGrandTotal = this.grandTotal ?? emptySize('');
      return;
    }

    const unselectedSizes = this.skuColors
      .filter((c) => !this.selectedColors.has(c.color))
      .map((c) => c.skus);

    this.filteredTotalBySizes = this.totalBySizes.map((total, i) => {
      const result = { ...total };
      unselectedSizes.forEach((sizes) => {
        result.orderedQty -= sizes[i].orderedQty;
        result.completedQty -= sizes[i].completedQty;
        result.plannedQty -= sizes[i].plannedQty;
        result.wasteQty -= sizes[i].wasteQty;
        result.rejectedQty -= sizes[i].rejectedQty;
      });
      return result;
    });

    const grandTotal = emptySize('');
    this.filteredTotalBySizes.forEach((ts) => sumInto(grandTotal, ts));
    this.filteredGrandTotal = grandTotal;
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
    this.updateFilteredTotals();
  }

  protected clearColorFilter(): void {
    this.selectedColors.clear();
    this.colorFilterPanel.close();
    this.updateFilteredTotals();
  }

  protected onColorFilterClosed(): void {
    this.colorFilterOpen = false;
  }
  private _productionOrder: ProductionOrder | null = null;
  private _pendingRecords: Partial<ProductionRecord>[] = [];
  sizes: string[] = [];
  skuColors: ColorRowDetail[] = [];
  totalBySizes: SkuDetail[] = [];
  grandTotal: SkuDetail | null = null;
  dialogService = inject(DialogService);
  poService = inject(ProductionOrderService);

  private loaderService = inject(LoaderService);

  get productionOrder() {
    return this._productionOrder;
  }

  @Input()
  set productionOrder(po: ProductionOrder | null) {
    this._productionOrder = po;
    this.recomputeMatrix();
  }

  // Registros manuales aún no persistidos (shift-cycles-manual: ver
  // ManualProductionRecordsStore) — se suman encima de productionOrder en
  // el navegador, sin volver a pedirla al backend. Ver applyPendingRecords.
  get pendingRecords() {
    return this._pendingRecords;
  }

  @Input()
  set pendingRecords(records: Partial<ProductionRecord>[]) {
    this._pendingRecords = records;
    this.recomputeMatrix();
  }

  private recomputeMatrix(): void {
    const po = this._productionOrder;

    if (!po) {
      this.sizes = [];
      this.skuColors = [];
      this.totalBySizes = [];
      this.grandTotal = null;
      this.updateFilteredTotals();
      return;
    }

    const matrix = buildColorSizeMatrix(applyPendingRecords(po, this._pendingRecords));
    this.sizes = matrix.sizes;
    this.skuColors = matrix.skuColors;
    this.totalBySizes = matrix.totalBySizes;
    this.grandTotal = matrix.grandTotal;
    this.updateFilteredTotals();
  }

  @Input() currentSession: WorkSession | null = null;
  @Input() readOnly: boolean = false;
  @Output() onSelectSKU = new EventEmitter<SkuTaskDetail>();

  getProducedQty(size: any): number {
    return Number(size.completedQty) + Number(size.rejectedQty) + Number(size.wasteQty);
  }

  // true si el renglón es un SKU real (no el placeholder de emptySize()).
  // OP normal lo identifica por skuRowId != 0; OPT vía production-orders/processes
  // no tiene skuRowId real (sale en 0 a propósito — ver OPStampingService) y
  // usa itemId (GUID) en su lugar, así que cualquiera de los dos cuenta.
  hasRealSku(size: SkuDetail): boolean {
    return size.skuRowId !== 0 || !!size.itemId;
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
