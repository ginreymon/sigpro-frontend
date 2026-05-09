import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, EMPTY, forkJoin, map, Observable } from 'rxjs';
import { ActivatedRoute } from '@angular/router';
import { TaskTimerState } from '../../common/interfaces/task-timer-state';
import { ProductionOrder } from '../../models/production/production-order';
import { ColorDetail } from '../../models/production/color-detail';
import { SizeQtyDetail } from '../../models/production/size-detail';
import { WorkSession } from '../../models/production/work-session';
import { WorkSessionService } from '../production/work-session-service';
import { ProductionOrderService } from '../production/production-order-service';

@Injectable({
  providedIn: 'root',
})
export class TaskTimerService {
  private workSessionService = inject(WorkSessionService);
  private productionOrderService = inject(ProductionOrderService);
  private route = inject(ActivatedRoute);

  private _initialState: TaskTimerState = {
    isConfirmed: false,
    rowColorDetail: null,
    selectedSKU: null,
    currentOP: null,
    currentSession: null,
    title: '',
    visible: false,
    showQuantityModal: false,
    showPauseModal: false,
  };

  private stateSubject = new BehaviorSubject<TaskTimerState>(this._initialState);
  state$ = this.stateSubject.asObservable();

  private setState(partial: Partial<TaskTimerState>) {
    const state: TaskTimerState = {
      isConfirmed: false,
      rowColorDetail: null,
      selectedSKU: null,
      currentOP: null,
      currentSession: null,
      visible: false,
      showQuantityModal: false,
      showPauseModal: false,
      ...partial,
    };
    this.stateSubject.next(state);
  }

  get state(): TaskTimerState {
    return this.stateSubject.value;
  }

  openDialog(
    rowColorDetail: ColorDetail,
    selectedSKU: SizeQtyDetail,
    currentOP: ProductionOrder,
    currentSession: WorkSession,
    title?: string,
  ) {
    this.setState({
      isConfirmed: false,
      rowColorDetail,
      selectedSKU,
      currentOP,
      currentSession,
      title,
      visible: true,
    });
  }

  loadState(): Observable<TaskTimerState> {
    const { docType: documentType, docNumber: documentNumber } = this.route.snapshot.queryParams;
    if (!documentType || !documentNumber) return EMPTY;

    return forkJoin({
      ws: this.workSessionService.getActive(),
      po: this.productionOrderService
        .getOrder({ documentType, documentNumber }, true)
        .pipe(map((po) => po as ProductionOrder)),
    }).pipe(
      map(({ ws, po }) => {
        const skuRowId = ws?.active_activity?.last_open_production_record?.sku_rowid;
        let rowColorDetail: ColorDetail | null = null;
        let selectedSKU: SizeQtyDetail | null = null;

        if (skuRowId) {
          for (const color of po.colors) {
            const size = color.sizes.find((s) => s.skuRowId == skuRowId);
            if (size) {
              rowColorDetail = color;
              selectedSKU = size;
              break;
            }
          }
        }

        this.stateSubject.next({
          ...this.state,
          rowColorDetail,
          selectedSKU,
          currentOP: po,
          currentSession: ws,
        });
        return this.stateSubject.value;
      }),
    );
  }

  continueDialog(po: ProductionOrder, ws: WorkSession, title?: string) {
    const record = ws?.active_activity?.last_open_production_record;
    if (!record) return;

    const skuRowId = record.sku_rowid;
    let params = null;

    for (const color of po.colors) {
      const size = color.sizes.find((s) => s.skuRowId == skuRowId);
      if (size) {
        params = { colorDetail: color, selectedSku: size };
        break;
      }
    }

    if (!params?.colorDetail || !params.selectedSku) return;

    this.openDialog(params.colorDetail, params.selectedSku, po, ws, title);
    this.startTimer();
  }

  startTimer() {
    this.setState({
      ...this.state,
      isConfirmed: true,
    });
  }

  cancel() {
    this.stateSubject.next(this._initialState);
  }

  closeDialog() {
    this.closePauseModal();
    this.closeQuantityModal();
    this.setState({ ...this.state, visible: false });
  }

  openQuantityModal() {
    this.setState({ ...this.state, showQuantityModal: true });
  }

  closeQuantityModal() {
    this.setState({ ...this.state, showQuantityModal: false });
  }

  openPauseModal() {
    this.setState({ ...this.state, showPauseModal: true });
  }

  closePauseModal() {
    this.setState({ ...this.state, showPauseModal: false });
  }
}
