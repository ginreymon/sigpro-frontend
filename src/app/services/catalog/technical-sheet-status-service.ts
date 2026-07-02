import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { TechnicalSheetStatus } from '../../models/catalog/technical-sheet-status';

@Injectable({ providedIn: 'root' })
export class TechnicalSheetStatusService extends BaseCrudService<TechnicalSheetStatus> {
  protected override _endpoint = '/catalog/technical-sheet-statuses/';
}
