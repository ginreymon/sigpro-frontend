import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { Permission } from '../../models/user/permission';

@Injectable({
  providedIn: 'root',
})
export class PermissionService extends BaseCrudService<Permission> {
  protected override _endpoint: string = '/user/permission/';
}
