import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { Option } from '../../models/core/option';

@Injectable({
  providedIn: 'root',
})
export class OptionsService extends BaseCrudService<Option> {
  protected override _endpoint: string = '/core/menu-options/';
}
