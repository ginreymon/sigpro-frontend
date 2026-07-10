import { Component } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { ProgressBar } from '../../../shared/components/progress-bar/progress-bar';

@Component({
  selector: 'app-machine-panel',
  imports: [WorkSpaceLayout, UiBadge, ProgressBar],
  templateUrl: './machine-panel.html',
})
export class MachinePanel {}
