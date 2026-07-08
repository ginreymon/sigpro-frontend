import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { StampingStampTypeDescription } from '../../models/stamping/stamping-stamp-type-description';

@Injectable({
  providedIn: 'root',
})
export class StampingStampTypeDescriptionService extends BaseCrudService<StampingStampTypeDescription> {
  protected override _endpoint: string = '/stamping/stamp-type-descriptions/';
}
