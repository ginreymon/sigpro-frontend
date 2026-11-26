import { Directive, inject } from '@angular/core';
import { BaseCrudPage } from './base-crud-page';
import { BaseEntity } from '../interfaces/base-entity';
import { TableActions } from '../interfaces/table-actions';
import { RouteContextService } from '../../services/core/route-context-service';

@Directive()
export abstract class AdminOnlyCrudPage<T extends BaseEntity> extends BaseCrudPage<T> {
  protected routeContext = inject(RouteContextService);

  protected get isAdminModule(): boolean {
    return this.routeContext.currentModule?.url === 'admin';
  }

  protected override get actions(): TableActions {
    if (this.isAdminModule) return super.actions;
    return {
      view: { enabled: true, title: this.entityTitle, iconName: 'eye', toolTip: 'Ver' },
      edit: { enabled: false },
      delete: { enabled: false },
      create: { enabled: false },
    };
  }
}
