import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { ControlContainer, FormControl, FormGroupDirective, ReactiveFormsModule } from '@angular/forms';
import { forkJoin, finalize } from 'rxjs';
import { SheetMeasurement } from '../../../../models/catalog/sheet-measurement';
import { SheetElasticCut } from '../../../../models/catalog/sheet-elastic-cut';
import { Reference } from '../../../../models/catalog/reference';
import { Collection } from '../../../../models/catalog/collection';
import { TechnicalSheetStatus } from '../../../../models/catalog/technical-sheet-status';
import { SkuReferenceInfo } from '../../../../models/catalog/sku-reference-info';
import { ReferencesService } from '../../../../services/catalog/references-service';
import { CollectionService } from '../../../../services/catalog/collection-service';
import { TechnicalSheetStatusService } from '../../../../services/catalog/technical-sheet-status-service';
import { SkuReferenceInfoService } from '../../../../services/catalog/sku-reference-info-service';
import { LoaderService } from '../../../../services/common/loader-service';
import { UiFormField } from "../../../../shared/elements/ui-form-field/ui-form-field";
import { UiSelect } from "../../../../shared/elements/ui-select/ui-select";
import { UiTabs, TabItem } from '../../../../shared/elements/ui-tabs/ui-tabs';
import { UiIcon } from '../../../../shared/elements/ui-icon/ui-icon';
import { UiButton } from "../../../../shared/elements/ui-button/ui-button";

const TABS: TabItem[] = [
  { key: 'general', label: 'General' },
  { key: 'measurements', label: 'Medidas' },
  { key: 'elasticCuts', label: 'Elástico' },
  { key: 'pieces', label: 'Despiece' },
  { key: 'images', label: 'Producto' },
];

@Component({
  selector: 'app-sheet-detail',
  imports: [UiFormField, UiSelect, ReactiveFormsModule, UiTabs, UiIcon, UiButton],
  templateUrl: 'sheet-detail.html',
  viewProviders: [{ provide: ControlContainer, useExisting: FormGroupDirective }],
})
export class SheetDetail implements OnInit {
  @Input() measurements: SheetMeasurement[] = [];
  @Input() elasticCuts: SheetElasticCut[]   = [];

  tabs = signal<TabItem[]>(TABS);
  activeTab = signal('general');

  references = signal<Reference[]>([]);
  collections = signal<Collection[]>([]);
  statuses = signal<TechnicalSheetStatus[]>([]);
  referenceInfo = signal<SkuReferenceInfo | null>(null);

  private controlContainer = inject(ControlContainer);
  private referencesService = inject(ReferencesService);
  private collectionService = inject(CollectionService);
  private technicalSheetStatusService = inject(TechnicalSheetStatusService);
  private skuReferenceInfoService = inject(SkuReferenceInfoService);
  private loaderService = inject(LoaderService);

  ngOnInit(): void {
    this.loaderService.showLoader();
    forkJoin({
      references: this.referencesService.getAll(),
      collections: this.collectionService.all(),
      statuses: this.technicalSheetStatusService.all(),
    })
      .pipe(finalize(() => this.loaderService.hideLoader()))
      .subscribe(({ references, collections, statuses }) => {
        this.references.set(references);
        this.collections.set(collections);
        this.statuses.set(statuses);
      });
  }

  get reference() {
    return this.controlContainer.control?.get('referenceId') as FormControl;
  }

  get collection() {
    return this.controlContainer.control?.get('collectionId') as FormControl;
  }

  get status() {
    return this.controlContainer.control?.get('statusId') as FormControl;
  }

  selectedCollectionName(): string | null {
    const id = this.collection?.value;
    return this.collections().find((c) => c.id == id)?.name ?? null;
  }

  onTabChange(key: string): void {
    this.activeTab.set(key);
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

  openMeasures() {
    throw new Error('Method not implemented.');
  }

  openElasticMeasures() {
    throw new Error('Method not implemented.');
  }
}
