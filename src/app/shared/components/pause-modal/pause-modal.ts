import { Component, inject } from '@angular/core';
import { BoxLayout } from '../box-layout/box-layout';
import { UiButton } from '../../elements/ui-button/ui-button';
import { TaskTimerService } from '../../../services/common/task-timer-service';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-pause-modal',
  standalone: true,
  imports: [BoxLayout, UiButton],
  templateUrl: './pause-modal.html',
})
export class PauseModal {
  private tTService = inject(TaskTimerService);

  protected state = toSignal(this.tTService.state$, {
    initialValue: this.tTService.state,
  });

  cancel() {
    this.tTService.closePauseModal();
  }
}
