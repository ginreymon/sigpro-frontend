import { Component } from '@angular/core';
import { WorkSpaceLayout } from '../../../layouts/work-space-layout/work-space-layout';
import { UiButton } from '../../../shared/elements/ui-button/ui-button';
import { UiOptionCard } from '../../../shared/elements/ui-option-card/ui-option-card';
import { UiDecorator } from '../../../shared/elements/ui-decorator/ui-decorator';
import { Searcher } from '../../../shared/components/searcher/searcher';
import { BaseCrudPage } from '../../../common/classes/base-crud-page';
import { WorkSession } from '../../../models/production/work-session';
import { WorkSessionService } from '../../../services/production/work-session-service';
import { UiBadge } from '../../../shared/elements/ui-badge/ui-badge';

@Component({
  selector: 'app-day-operation',
  imports: [WorkSpaceLayout, UiButton, UiOptionCard, UiDecorator, Searcher, UiBadge],
  templateUrl: './day-operation.html',
  styleUrl: './day-operation.css',
})
export class DayOperation extends BaseCrudPage<WorkSession> {
  constructor(workSessionService: WorkSessionService) {
    super(workSessionService);
  }
}
