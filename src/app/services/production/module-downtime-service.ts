import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { ModuleDowntime } from '../../models/production/module-downtime';

@Injectable({
  providedIn: 'root',
})
export class ModuleDowntimeService extends BaseCrudService<ModuleDowntime> {
  protected override _endpoint: string = '/production/module-downtimes/';
}
