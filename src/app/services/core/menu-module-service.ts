import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { Module } from '../../models/core/module';

@Injectable({
  providedIn: 'root',
})
export class MenuModuleService extends BaseCrudService<Module> {
  protected override _endpoint: string = '/core/menu-modules/';
}
