import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { SkuItemReference } from '../../models/production/sku-item-reference';

@Injectable({
  providedIn: 'root',
})
export class SkuItemReferenceService extends BaseCrudService<SkuItemReference> {
  protected override _endpoint: string = '/production/sku-items/references/';
}
