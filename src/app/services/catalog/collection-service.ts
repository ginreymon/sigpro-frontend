import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { Collection } from '../../models/catalog/collection';

@Injectable({ providedIn: 'root' })
export class CollectionService extends BaseCrudService<Collection> {
  protected override _endpoint = '/catalog/collections/';
}
