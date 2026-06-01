import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { UiTooltip } from "../../elements/ui-tooltip/ui-tooltip";
import { UiButton } from "../../elements/ui-button/ui-button";
import { UiIcon } from "../../elements/ui-icon/ui-icon";
import { ShiftModalsService } from '../../../services/common/shift-modals-service';
import { ProductionContextService } from '../../../services/production/production-context-service';
import { WorkSessionService } from '../../../services/production/work-session-service';
import { LoaderService } from '../../../services/common/loader-service';
import { DialogService } from '../../../services/common/dialog-service';

interface ShiftCycleAction {
  icon: string;
  label: string;
  tooltip: string;
  iconIntent: 'action' | 'cancel';
  handler: () => void;
  hideWhen?: () => boolean;
}

export type ShiftCyclesActionsMode = 'icon' | 'labeled';

@Component({
  selector: 'app-shift-cycles-actions',
  imports: [UiTooltip, UiButton, UiIcon],
  templateUrl: './shift-cycles-actions.html',
  styleUrl: './shift-cycles-actions.css',
})
export class ShiftCyclesActions {
  @Input() finalizeDay: boolean = false;
  @Input() mode: ShiftCyclesActionsMode = 'icon';
  @Input() inWindow: boolean = false;
  @Output() onFinalize = new EventEmitter<void>();

  private shiftModals = inject(ShiftModalsService);
  private contextService = inject(ProductionContextService);
  private workSessionService = inject(WorkSessionService);
  private loaderService = inject(LoaderService);
  private dialogService = inject(DialogService);

  private readonly ALLOWED_COST_CENTERS = [110, 103];
  private context = toSignal(this.contextService.context$, { initialValue: null });

  actions: ShiftCycleAction[] = [
    {
      icon: 'truck',
      label: 'Última entrega',
      tooltip: 'Última entrega',
      iconIntent: 'action',
      handler: () => this.lastDelivery(),
    },
    {
      icon: 'user',
      label: 'Empleados',
      tooltip: 'Empleados',
      iconIntent: 'cancel',
      handler: () => this.openEmployeesSnapshot(),
    },
    {
      icon: 'chartArea',
      label: 'Balance',
      tooltip: 'Balance',
      iconIntent: 'cancel',
      handler: () => this.openBalance(),
    },
    {
      icon: 'pause',
      label: 'Pausas',
      tooltip: 'Pausar',
      iconIntent: 'cancel',
      handler: () => this.openPauses(),
      hideWhen: () => this.finalizeDay,
    },
  ];

  openBalance(): void {
    const session = this.context()?.session ?? null;
    this.shiftModals.openBalance({
      currentSession: session,
      shiftEndTime: session?.work_shift?.end_time ?? null,
      inWindow: this.inWindow,
    });
  }

  openPauses(): void {
    this.shiftModals.openPause({
      activityId: this.context()?.session?.active_activity?.id,
    });
  }

  openEmployeesSnapshot(): void {
    const context = this.context();
    const employees = (context?.employees ?? []).filter(
      e => this.ALLOWED_COST_CENTERS.includes(e.cost_center_rowid!)
    );
    const preselectedIds = context?.session?.employees_snapshot?.map(e => e.id) ?? [];
    this.shiftModals.openEmployees({ employees, preselectedIds });
  }

  lastDelivery(): void {
    const sessionId = this.context()?.session?.id;
    if (!sessionId) return;
    this.dialogService.openConfirm(
      'Última entrega',
      '¿Confirmar última entrega? Con esta acción finalizará la jornada.',
      'Confirmar',
      () => {
        this.loaderService.showLoader();
        this.workSessionService.finalizeEditing(sessionId)
          .pipe(finalize(() => this.loaderService.hideLoader()))
          .subscribe({
            next: () => {
              this.dialogService.closeConfirm();
              this.onFinalize.emit();
            },
          });
      }
    );
  }
}
