import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { HomeView } from '../../models/core/home-view';

@Injectable({
  providedIn: 'root',
})
export class HomeViewService extends BaseCrudService<HomeView> {
  protected override _endpoint: string = '/core/home-views/';
}
