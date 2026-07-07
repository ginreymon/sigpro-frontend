import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { AdditionalStampingTime } from '../../models/stamping/additional-stamping-time';

@Injectable({
  providedIn: 'root',
})
export class AdditionalStampingTimeService extends BaseCrudService<AdditionalStampingTime> {
  protected override _endpoint: string = '/stamping/additional-times/';
}
