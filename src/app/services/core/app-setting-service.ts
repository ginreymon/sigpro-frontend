import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { AppSetting } from '../../models/core/app-setting';

@Injectable({ providedIn: 'root' })
export class AppSettingService extends BaseCrudService<AppSetting> {
  _endpoint = '/core/app-settings/';
}
