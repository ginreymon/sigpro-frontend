import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { ModuleAssignee } from '../../models/production/module-assignee';
@Injectable({
  providedIn: 'root',
})
export class ModuleAssigneeService extends BaseCrudService<ModuleAssignee>{
  protected override _endpoint: string='/production/module-assignees/';
  
}
