import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { TechnicalSheetImage } from '../../models/catalog/technical-sheet-image';

@Injectable({ providedIn: 'root' })
export class TechnicalSheetImageService extends BaseCrudService<TechnicalSheetImage> {
  protected override _endpoint = '/catalog/technical-sheet-images/';
}
