import { Component } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiIcon } from '../../../shared/elements/ui-icon/ui-icon';
import { PanelLayout } from '../../../shared/components/panel-layout/panel-layout';

@Component({
  selector: 'app-stamping-auditory',
  imports: [WorkSpaceLayout, UiIcon, PanelLayout],
  templateUrl: './auditory.html',
})
export class StampingAuditory {}
