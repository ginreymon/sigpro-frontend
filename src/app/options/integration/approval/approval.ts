import { Component } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';

@Component({
  selector: 'app-approval',
  imports: [WorkSpaceLayout, UiIcon],
  templateUrl: './approval.html',
})
export class Approval {}
