import { Component, Input, computed, inject, signal } from '@angular/core';
import { ControlContainer, FormControl, FormGroupDirective } from '@angular/forms';
import { finalize } from 'rxjs';
import { SheetMeasurement } from '../../../../models/catalog/sheet-measurement';
import { SheetElasticCut } from '../../../../models/catalog/sheet-elastic-cut';
import { Reference } from '../../../../models/catalog/reference';
import { Collection } from '../../../../models/catalog/collection';
import { TechnicalSheetStatus } from '../../../../models/catalog/technical-sheet-status';
import { SkuReferenceInfo } from '../../../../models/catalog/sku-reference-info';
import { SkuReferenceInfoService } from '../../../../services/catalog/sku-reference-info-service';
import { LoaderService } from '../../../../services/common/loader-service';
import { UiTabs, TabItem } from '../../../../shared/elements/ui-tabs/ui-tabs';
import { UiIcon } from '../../../../shared/elements/ui-icon/ui-icon';
import { UiButton } from "../../../../shared/elements/ui-button/ui-button";
import { MeasureTable } from "../measure-table/measure-table";

const TABS: TabItem[] = [
  { key: 'general', label: 'General' },
  { key: 'measurements', label: 'Medidas' },
  { key: 'elasticCuts', label: 'Elástico' },
  { key: 'pieces', label: 'Despiece' },
  { key: 'images', label: 'Producto' },
];

@Component({
  selector: 'app-sheet-detail',
  imports: [UiTabs, UiIcon, UiButton, MeasureTable],
  templateUrl: 'sheet-detail.html',
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
})
export class SheetDetail {
  @Input() references: Reference[] = [];
  @Input() collections: Collection[] = [];
  @Input() statuses: TechnicalSheetStatus[] = [];
  @Input() measurements: SheetMeasurement[] = [];
  @Input() elasticCuts: SheetElasticCut[]   = [];

  activeTab = signal('general');

  tabs = computed<TabItem[]>(() => {
    const hasReference = !!this.referenceInfo();
    const measurementTabsDisabled = !this.referenceInfo()?.sizes?.trim();

    return TABS.map((tab) => {
      if (tab.key === 'measurements' || tab.key === 'elasticCuts') {
        return { ...tab, disabled: measurementTabsDisabled };
      }
      if (tab.key === 'pieces' || tab.key === 'images') {
        return { ...tab, disabled: !hasReference };
      }
      return tab;
    });
  });

  referenceInfo = signal<SkuReferenceInfo | null>(null);

  private controlContainer = inject(ControlContainer);
  private skuReferenceInfoService = inject(SkuReferenceInfoService);
  private loaderService = inject(LoaderService);

  get collection() {
    return this.controlContainer.control?.get('collectionId') as FormControl;
  }

  selectedCollectionName(): string | null {
    const id = this.collection?.value;
    return this.collections.find((collection) => collection.id == id)?.name ?? null;
  }

  get sizes(): string[] {
    return this.referenceInfo()?.sizes?.split(',').map((size) => size.trim()).filter(Boolean) ?? [];
  }

  onTabChange(key: string): void {
    this.activeTab.set(key);
  }

  reset(): void {
    this.activeTab.set('general');
    this.referenceInfo.set(null);
  }

  onReferenceSelect(event: { index: number; value: Reference }): void {
    this.referenceInfo.set(null);

    if (!event.value?.rowid_item) {
      return;
    }

    this.loaderService.showLoader();
    this.skuReferenceInfoService
      .getByRowidItem(event.value.rowid_item)
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe((info) => this.referenceInfo.set(info));
  }
}
