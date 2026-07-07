import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { StampingReferenceSam } from '../../models/stamping/stamping-reference-sam';

@Injectable({
  providedIn: 'root',
})
export class StampingReferenceSamService extends BaseCrudService<StampingReferenceSam> {
  protected override _endpoint: string = '/stamping/reference-sams/';
}
