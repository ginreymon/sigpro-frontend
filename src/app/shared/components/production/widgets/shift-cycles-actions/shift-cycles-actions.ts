import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { UiButton } from "../../../../elements/ui-button/ui-button";
import { UiIcon } from "../../../../elements/ui-icon/ui-icon";
import { DragCarousel } from "../../../widgets/drag-carousel/drag-carousel";
import { ShiftModalsService } from '../../../../../services/common/shift-modals-service';
import { ProductionContextService } from '../../../../../services/production/production-context-service';
import { WorkSessionService } from '../../../../../services/production/work-session-service';
import { LoaderService } from '../../../../../services/common/loader-service';
import { DialogService } from '../../../../../services/common/dialog-service';
import { ShiftCyclesConfig } from '../../../../../common/interfaces/shift-cycles-config';

export type ShiftCycleActionKey =
  | 'stampingRecord'
  | 'lastDelivery'
  | 'employees'
  | 'balance'
  | 'pause'
  | 'materials'
  | 'changeOp';

interface ShiftCycleAction {
  key: ShiftCycleActionKey;
  icon: string;
  label: string;
  tooltip?: string;
  iconIntent: 'action' | 'cancel';
  handler: () => void;
  hideWhen?: () => boolean;
}

export type ShiftCyclesActionsMode = 'icon' | 'labeled';

@Component({
  selector: 'app-shift-cycles-actions',
  imports: [UiButton, UiIcon, DragCarousel],
  templateUrl: './shift-cycles-actions.html',
  styleUrl: './shift-cycles-actions.css',
})
export class ShiftCyclesActions {
  @Input() finalizeDay: boolean = false;
  @Input() mode: ShiftCyclesActionsMode = 'icon';
  @Input() inWindow: boolean = false;
  @Output() onFinalize = new EventEmitter<void>();
  @Input() config: ShiftCyclesConfig | null = null;
  @Input() hiddenActions: ShiftCycleActionKey[] = [];

  private shiftModals = inject(ShiftModalsService);
  private contextService = inject(ProductionContextService);
  private workSessionService = inject(WorkSessionService);
  private loaderService = inject(LoaderService);
  private dialogService = inject(DialogService);
  private router = inject(Router);

  private context = toSignal(this.contextService.context$, { initialValue: null });

  actions: ShiftCycleAction[] = [
    {
      key: 'stampingRecord',
      icon: 'clock',
      label: 'Tiempos',
      iconIntent: 'action',
      handler: () => this.openStampingRecord(),
      hideWhen: () => this.isHidden('stampingRecord', c => c.showStampingRecord),
    },
    {
      key: 'lastDelivery',
      icon: 'truck',
      label: 'Última entrega',
      iconIntent: 'action',
      handler: () => this.lastDelivery(),
      hideWhen: () => this.finalizeDay || this.isHidden('lastDelivery', c => c.showLastDeliveryAction),
    },
    {
      key: 'employees',
      icon: 'user',
      label: 'Empleados',
      iconIntent: 'cancel',
      handler: () => this.openEmployeesSnapshot(),
      hideWhen: () => this.finalizeDay || this.isHidden('employees', c => c.showEmployeesModal),
    },
    {
      key: 'balance',
      icon: 'chartArea',
      label: 'Balance',
      iconIntent: 'cancel',
      handler: () => this.openBalance(),
      hideWhen: () => this.isHidden('balance', c => c.showBalanceSheet),
    },
    {
      key: 'pause',
      icon: 'pause',
      label: 'Pausar',
      iconIntent: 'cancel',
      handler: () => this.openPauses(),
      hideWhen: () => this.finalizeDay || this.isHidden('pause', c => c.showPauseModal),
    },
    {
      key: 'materials',
      icon: 'file',
      label: 'Materiales',
      iconIntent: 'action',
      handler: () => this.showMaterials(),
      hideWhen: () => this.isHidden('materials', c => c.showMaterialsAction),
    },
    {
      key: 'changeOp',
      icon: 'magnifyingGlass',
      label: 'Cambiar OP',
      iconIntent: 'action',
      handler: () => this.goToSearch(),
      hideWhen: () => this.isHidden('changeOp', c => c.showChangeOpAction),
    },
  ];

  private isHidden(key: ShiftCycleActionKey, configFlag: (config: ShiftCyclesConfig) => boolean): boolean {
    if (this.hiddenActions.includes(key)) return true;
    return this.config ? !configFlag(this.config) : false;
  }

  protected getTooltip(action: ShiftCycleAction): string {
    return action.tooltip ?? action.label;
  }

  private goToSearch(): void {
    this.router.navigate([], { queryParams: {} });
  }

  private showMaterials(): void {
    const order = this.context()?.order;
    if (!order) return;
    this.router.navigate(['/', ...environment.ORDER_DETAIL.split('/')], {
      queryParams: { docType: order.documentType, docNumber: order.documentNumber },
    });
  }

  openBalance(): void {
    const session = this.context()?.session ?? null;
    this.shiftModals.openBalance({
      currentSession: session,
      shiftEndTime: session?.work_shift?.end_time ?? null,
      inWindow: this.inWindow,
    });
  }

  openStampingRecord(): void {
    this.shiftModals.openStampingRecord();
  }

  openPauses(): void {
    this.shiftModals.openPause({
      activityId: this.context()?.session?.active_activity?.id,
    });
  }

  openEmployeesSnapshot(): void {
    const context = this.context();
    const snapshot = context?.session?.employees_snapshot ?? [];
    const employees = context?.employees ?? [];
    const preselectedIds = snapshot.map(e => e.id);
    const apprenticeIds = snapshot.filter(e => e.is_apprentice).map(e => e.id);
    this.shiftModals.openEmployees({ employees, preselectedIds, apprenticeIds, apprenticeEditable: true });
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
