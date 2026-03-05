import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';

@Injectable({
  providedIn: 'root',
})
export class ModuleService  extends BaseCrudService<ModuleService>{
  protected override _endpoint: string = '/production/modules/';
  
}
