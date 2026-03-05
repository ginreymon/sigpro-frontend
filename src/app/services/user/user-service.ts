import { Injectable } from '@angular/core';
import { BaseCrudService } from '../common/base-crud-service';
import { User } from '../../models/user/user';

@Injectable({
  providedIn: 'root',
})
export class UserService extends BaseCrudService<User> {
  protected override _endpoint: string = '/user/account/';
}
