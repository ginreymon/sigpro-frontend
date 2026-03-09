import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { Module } from '../../models/production/module';

@Injectable({
  providedIn: 'root',
})
export class ModuleService  extends BaseCrudService<Module>{
  protected override _endpoint: string = '/production/modules/';
  
}
