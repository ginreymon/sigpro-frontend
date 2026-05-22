import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { BaseCrudService } from '../common/base-crud-service';
import { AppSetting } from '../../models/core/app-setting';

export interface AppSettingValue {
  id: number;
  name: string;
  value: string;
}

@Injectable({ providedIn: 'root' })
export class AppSettingService extends BaseCrudService<AppSetting> {
  _endpoint = '/core/app-settings/';

  getValues(names: string[]): Observable<AppSettingValue[]> {
    const params = new HttpParams().set('names', names.join(','));
    return this.http.get<AppSettingValue[]>(`${this.endpoint}values/`, { params });
  }
}
