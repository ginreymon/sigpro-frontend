import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { Role } from '../../models/user/role';

@Injectable({
  providedIn: 'root',
})
export class RoleService extends BaseCrudService<Role> {
  protected override _endpoint: string = '/user/role/';
}
