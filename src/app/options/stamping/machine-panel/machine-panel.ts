import { Component } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';
import { ProgressBar } from '../../../shared/components/progress-bar/progress-bar';
import { PanelLayout } from '../../../shared/components/panel-layout/panel-layout';

@Component({
  selector: 'app-machine-panel',
  imports: [WorkSpaceLayout, UiBadge, ProgressBar, PanelLayout],
  templateUrl: './machine-panel.html',
})
export class MachinePanel {}
