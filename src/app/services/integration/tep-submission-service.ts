import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { TepSubmission } from '../../models/integration/tep-submission';

@Injectable({
  providedIn: 'root',
})
export class TepSubmissionService extends BaseCrudService<TepSubmission> {
  protected override _endpoint: string = '/integration/tep-submissions/';
}
