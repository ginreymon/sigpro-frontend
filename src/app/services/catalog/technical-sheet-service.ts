import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { TechnicalSheet } from '../../models/catalog/technical-sheet';

@Injectable({ providedIn: 'root' })
export class TechnicalSheetService extends BaseCrudService<TechnicalSheet> {
  protected override _endpoint = '/catalog/technical-sheets/';
}
