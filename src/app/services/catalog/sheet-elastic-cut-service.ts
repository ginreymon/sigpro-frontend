import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { SheetElasticCut } from '../../models/catalog/sheet-elastic-cut';

@Injectable({ providedIn: 'root' })
export class SheetElasticCutService extends BaseCrudService<SheetElasticCut> {
  protected override _endpoint = '/catalog/sheet-elastic-cuts/';
}
