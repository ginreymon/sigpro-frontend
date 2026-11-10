import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseCrudService } from '../common/base-crud-service';
import { AppSetting } from '../../models/core/app-setting';

export interface AppSettingValue {
  id: number;
  name: string;
  key: string | null;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class AppSettingService extends BaseCrudService<AppSetting> {
  _endpoint = '/core/app-settings/';

  getAllKeyedValues(): Observable<AppSettingValue[]> {
    const params = new HttpParams().set('all_keys', 'true');
    return this.http.get<AppSettingValue[]>(`${this.endpoint}values/`, { params });
  }
}
