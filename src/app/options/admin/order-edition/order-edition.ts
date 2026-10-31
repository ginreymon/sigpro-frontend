import { Component, signal } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { EditRecords } from './edit-records/edit-records';
import { ViewOrder } from './view-order/view-order';
import { ORDER_EDITION_MODES, OrderEditionMode } from './order-edition-mode';

// Admin shell for /admin/order-edition: switches between editing records and viewing an OP.
@Component({
  selector: 'app-order-edition',
  imports: [WorkSpaceLayout, UiButton, EditRecords, ViewOrder],
  templateUrl: './order-edition.html',
})
export class OrderEdition {
  // Mode buttons are rendered from this list; the active mode decides which child component is shown.
  protected readonly modes = ORDER_EDITION_MODES;
  protected mode = signal<OrderEditionMode>('edit-records');
}
