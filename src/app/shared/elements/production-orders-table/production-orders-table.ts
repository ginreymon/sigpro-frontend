import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { ProductionOrder } from '../../../models/production/production-order';
import { ColorDetail } from '../../../models/production/color-detail';
import { SizeQtyDetail } from '../../../models/production/size-detail';
import { UiTableButton } from '../ui-table-button/ui-table-button';
import { UiTooltip } from '../ui-tooltip/ui-tooltip';
import { TaskTimerService } from '../../../services/common/task-timer-service';
import { WorkSession } from '../../../models/production/work-session';
import { ButtonBaseType } from '../../../common/classes/button-base';
import { DialogService } from '../../../services/common/dialog-service';

@Component({
  selector: 'app-production-orders-table',
  imports: [UiTableButton, UiTooltip],
  templateUrl: './production-orders-table.html',
  styleUrl: './production-orders-table.css',
})
export class ProductionOrdersTable {
  private _productionOrder: ProductionOrder | null = null;
  sizes: string[] = [];
  skuColors: ColorDetail[] = [];
  totalBySizes: SizeQtyDetail[] = [];
  grandTotal: SizeQtyDetail | null = null;
  tTService = inject(TaskTimerService);
  dialogService = inject(DialogService);

  get productionOrder() {
    return this._productionOrder;
  }

  @Input()
  set productionOrder(po: ProductionOrder | null) {
    this._productionOrder = po;
    this.buildColorSizeStructure();
    this.fillMissingSizes();
    this.calculateTotalsBySize();
  }

  @Input() currentSession: WorkSession | null = null;

  @Output() onSelectSKU = new EventEmitter<{ color: ColorDetail; size: SizeQtyDetail }>();

  buildColorSizeStructure() {
    if (!this._productionOrder) return;

    this.skuColors = [...this._productionOrder.colors].sort((a, b) =>
      a.color.localeCompare(b.color),
    );

    const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
    const sizeSet = new Set<string>();

    this.skuColors = this.skuColors.map((c) => {
      const numberSizes = c.sizes
        .filter((s) => !isNaN(Number(s.size)))
        .sort((a, b) => Number(a.size) - Number(b.size));

      const letterSizes = c.sizes
        .filter((s) => isNaN(Number(s.size)))
        .sort((a, b) => {
          const order = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];

          const ai = order.indexOf(a.size);
          const bi = order.indexOf(b.size);

          return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
        });

      const sizes = [...numberSizes, ...letterSizes];
      sizes.forEach((s) => sizeSet.add(s.size));

      return {
        ...c,
        sizes,
      };
    });

    const numberSizes = Array.from(sizeSet)
      .filter((s) => !isNaN(Number(s)))
      .sort((a, b) => Number(a) - Number(b));

    const letterSizes = Array.from(sizeSet)
      .filter((s) => isNaN(Number(s)))
      .sort((a, b) => order.indexOf(a) - order.indexOf(b));

    this.sizes = [...numberSizes, ...letterSizes];
  }

  fillMissingSizes() {
    this.skuColors = [...this.skuColors].map((c) => {
      const sizeMap = new Map<string, SizeQtyDetail>();

      c.sizes.forEach((s) => {
        sizeMap.set(s.size, s);
      });

      const completedSizes = this.sizes.map((size) => {
        if (sizeMap.has(size)) {
          return sizeMap.get(size)!;
        }

        return {
          size,
          skuRowId: 0,
          orderedQty: 0,
          plannedQty: 0,
          completedQty: 0,
          wasteQty: 0,
          rejectedQty: 0,
        };
      });

      return {
        ...c,
        sizes: completedSizes,
      };
    });
  }

  calculateTotalsBySize() {
    const totalsMap = new Map<string, SizeQtyDetail>();

    const totalSizes: SizeQtyDetail = {
      skuRowId: 0,
      orderedQty: 0,
      plannedQty: 0,
      completedQty: 0,
      wasteQty: 0,
      rejectedQty: 0,
      size: '',
    };

    this.sizes.forEach((s) => {
      totalsMap.set(s, {
        ...totalSizes,
        size: s,
      });
    });

    this.skuColors.forEach((c) => {
      c.sizes.forEach((sizeObj: any) => {
        const total = totalsMap.get(sizeObj.size);

        if (total) {
          total.completedQty += sizeObj.completedQty;
          total.orderedQty += sizeObj.orderedQty;
          total.plannedQty += sizeObj.plannedQty;
          total.wasteQty += sizeObj.wasteQty;
          total.rejectedQty += sizeObj.rejectedQty;
        }
      });
    });

    this.totalBySizes = Array.from(totalsMap.values());
    this.grandTotal = { ...totalSizes };

    this.totalBySizes.forEach((ts) => {
      if (!this.grandTotal) return;
      this.grandTotal.completedQty += ts.completedQty;
      this.grandTotal.orderedQty += ts.orderedQty;
      this.grandTotal.plannedQty += ts.plannedQty;
      this.grandTotal.wasteQty += ts.wasteQty;
      this.grandTotal.rejectedQty += ts.rejectedQty;
    });
  }

  getButtonIntent(size: any): ButtonBaseType {
    if (size.completedQty === size.orderedQty) return 'cancel';
    if (size.hasOpenRecords === true) return 'action';
    return 'label';
  }

  selectSKU(cd: ColorDetail, sd: SizeQtyDetail) {
    if (!this.productionOrder || !this.currentSession) return;
    const record = this.currentSession.active_activity.last_open_production_record;  
    
    if (record){
      const doc =`${record.op_type} ${record.op_number}`;   
      this.dialogService.openToast('Advertencia', `Existe una tarea en proceso que no ha finalizado (${doc.toUpperCase()}).`, 'fail');
      return;
    }
    this.tTService.startTask(cd, sd, this.productionOrder, this.currentSession);
  }
}
