import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  HostListener,
  Input,
  OnDestroy,
  Output,
  Renderer2,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../../../../environments/environment';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
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
  handler: () => void;
  hideWhen?: () => boolean;
}

const MENU_OFFSET = 8; // px, separación entre el botón y el menú

/**
 * Reemplaza a app-shift-cycles-actions: mismas acciones/lógica de jornada,
 * UI en forma de FAB (botón "+" redondo) con menú hacia arriba. El menú se
 * porta a document.body y se posiciona con fixed (igual que app-ui-combobox)
 * para no quedar recortado cuando este componente vive dentro de una modal.
 */
@Component({
  selector: 'app-shift-cycles-fab',
  imports: [UiIcon],
  templateUrl: './shift-cycles-fab.html',
})
export class ShiftCyclesFab implements AfterViewInit, OnDestroy {
  @Input() finalizeDay: boolean = false;
  @Input() inWindow: boolean = false;
  @Input() config: ShiftCyclesConfig | null = null;
  @Input() hiddenActions: ShiftCycleActionKey[] = [];
  @Output() onFinalize = new EventEmitter<void>();

  @ViewChild('menu') private menuRef!: ElementRef<HTMLElement>;

  private elementRef = inject(ElementRef<HTMLElement>);
  private renderer = inject(Renderer2);
  private shiftModals = inject(ShiftModalsService);
  private contextService = inject(ProductionContextService);
  private workSessionService = inject(WorkSessionService);
  private loaderService = inject(LoaderService);
  private dialogService = inject(DialogService);
  private router = inject(Router);

  private context = toSignal(this.contextService.context$, { initialValue: null });

  isOpen = signal(false);
  menuStyle = signal<Record<string, string>>({});

  private readonly scrollHandler = (): void => this.close();

  readonly actions: ShiftCycleAction[] = [
    {
      key: 'stampingRecord',
      icon: 'circleRight',
      label: 'Registrar',
      handler: () => this.openStampingRecord(),
      hideWhen: () => this.isHidden('stampingRecord', c => c.showStampingRecord),
    },
    {
      key: 'lastDelivery',
      icon: 'truck',
      label: 'Última entrega',
      handler: () => this.lastDelivery(),
      hideWhen: () => this.finalizeDay || this.isHidden('lastDelivery', c => c.showLastDeliveryAction),
    },
    {
      key: 'employees',
      icon: 'user',
      label: 'Empleados',
      handler: () => this.openEmployeesSnapshot(),
      hideWhen: () => this.finalizeDay || this.isHidden('employees', c => c.showEmployeesModal),
    },
    {
      key: 'balance',
      icon: 'chartArea',
      label: 'Balance',
      handler: () => this.openBalance(),
      hideWhen: () => this.isHidden('balance', c => c.showBalanceSheet),
    },
    {
      key: 'pause',
      icon: 'pause',
      label: 'Pausar',
      handler: () => this.openPauses(),
      hideWhen: () => this.finalizeDay || this.isHidden('pause', c => c.showPauseModal),
    },
    {
      key: 'materials',
      icon: 'file',
      label: 'Materiales',
      handler: () => this.showMaterials(),
      hideWhen: () => this.isHidden('materials', c => c.showMaterialsAction),
    },
    {
      key: 'changeOp',
      icon: 'magnifyingGlass',
      label: 'Cambiar OP',
      handler: () => this.goToSearch(),
      hideWhen: () => this.isHidden('changeOp', c => c.showChangeOpAction),
    },
  ];

  ngAfterViewInit(): void {
    this.renderer.appendChild(document.body, this.menuRef.nativeElement);
  }

  ngOnDestroy(): void {
    document.removeEventListener('scroll', this.scrollHandler, true);
    this.menuRef?.nativeElement.remove();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    if (!this.isOpen()) return;
    const target = event.target as Node;
    if (this.elementRef.nativeElement.contains(target)) return;
    if (this.menuRef?.nativeElement.contains(target)) return;
    this.close();
  }

  visibleActions(): ShiftCycleAction[] {
    return this.actions.filter(a => !a.hideWhen?.());
  }

  toggle(): void {
    if (this.isOpen()) {
      this.close();
    } else {
      this.open();
    }
  }

  run(action: ShiftCycleAction): void {
    this.close();
    action.handler();
  }

  private open(): void {
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    this.menuStyle.set({
      position: 'fixed',
      left: `${rect.left}px`,
      bottom: `${window.innerHeight - rect.top + MENU_OFFSET}px`,
      zIndex: '9999',
    });
    this.isOpen.set(true);
    document.addEventListener('scroll', this.scrollHandler, true);
  }

  private close(): void {
    this.isOpen.set(false);
    document.removeEventListener('scroll', this.scrollHandler, true);
  }

  private isHidden(key: ShiftCycleActionKey, configFlag: (config: ShiftCyclesConfig) => boolean): boolean {
    if (this.hiddenActions.includes(key)) return true;
    return this.config ? !configFlag(this.config) : false;
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

  private openBalance(): void {
    const session = this.context()?.session ?? null;
    this.shiftModals.openBalance({
      currentSession: session,
      shiftEndTime: session?.work_shift?.end_time ?? null,
      inWindow: this.inWindow,
    });
  }

  private openStampingRecord(): void {
    this.shiftModals.openStampingRecord();
  }

  private openPauses(): void {
    this.shiftModals.openPause({
      activityId: this.context()?.session?.active_activity?.id,
    });
  }

  private openEmployeesSnapshot(): void {
    const context = this.context();
    const snapshot = context?.session?.employees_snapshot ?? [];
    const employees = context?.employees ?? [];
    const preselectedIds = snapshot.map(e => e.id);
    const apprenticeIds = snapshot.filter(e => e.is_apprentice).map(e => e.id);
    this.shiftModals.openEmployees({ employees, preselectedIds, apprenticeIds, apprenticeEditable: true });
  }

  private lastDelivery(): void {
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
