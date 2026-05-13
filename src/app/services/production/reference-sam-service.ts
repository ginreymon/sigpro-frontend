import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { ReferenceSam } from '../../models/production/reference-sam';

@Injectable({
  providedIn: 'root',
})
export class ReferenceSamService extends BaseCrudService<ReferenceSam> {
  protected override _endpoint: string = '/production/reference-sam/';
}
