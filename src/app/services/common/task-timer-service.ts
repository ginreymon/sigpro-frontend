import { inject, Injectable } from '@angular/core';
import { BehaviorSubject, finalize } from 'rxjs';
import { TaskTimerState } from '../../common/interfaces/task-timer-state';
import { ProductionOrder } from '../../models/production/production-order';
import { ColorDetail } from '../../models/production/color-detail';
import { SizeQtyDetail } from '../../models/production/size-detail';
import { WorkSession } from '../../models/production/work-session';
import { WorkSessionService } from '../production/work-session-service';
import { WorkSpaceLoaderService } from './work-space-loader-service';

@Injectable({
  providedIn: 'root',
})
export class TaskTimerService {
  private workSessionService = inject(WorkSessionService);
  private wslService = inject(WorkSpaceLoaderService);

  private _initialState: TaskTimerState = {
    isConfirmed: false,
    colorDetail: null,
    sizeQtyDetail: null,
    productionOrder: null,
    currentSession: null,
    title: '',
    visible: false,
    showQuantityModal: false,
  };

  private stateSubject = new BehaviorSubject<TaskTimerState>(this._initialState);
  state$ = this.stateSubject.asObservable();

  private setState(partial: Partial<TaskTimerState>) {
    const state: TaskTimerState = {
      isConfirmed: false,
      colorDetail: null,
      sizeQtyDetail: null,
      productionOrder: null,
      currentSession: null,
      visible: false,
      showQuantityModal: false,
      ...partial,
    };
    this.stateSubject.next(state);
  }

  get state(): TaskTimerState {
    return this.stateSubject.value;
  }

  startTask(colorDetail: ColorDetail, sizeQtyDetail: SizeQtyDetail, productionOrder: ProductionOrder, currentSession: WorkSession, title?: string) {
    this.setState({
      isConfirmed: false,
      colorDetail,
      sizeQtyDetail,
      productionOrder,
      currentSession,
      title,
      visible: true,
    });
  }

  continueTask(po: ProductionOrder, title?: string) {
    this.wslService.start();
    this.workSessionService.getActive()
      .pipe(finalize(() => this.wslService.end()))
      .subscribe((ws: WorkSession) => {
        const record = ws?.active_activity?.last_open_production_record;
        if (!record) return;

        const skuRowId = record.sku_rowid;
        let params = null;

        for (const color of po.colors) {
          const size = color.sizes.find((s) => s.skuRowId == skuRowId);
          if (size) {
            params = { colorDetail: color, sizeQtyDetail: size };
            break;
          }
        }

        if (!params?.colorDetail || !params.sizeQtyDetail) return;

        this.startTask(params.colorDetail, params.sizeQtyDetail, po, ws, title);
        this.startTimer();
      });
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

  openQuantityModal() {
    this.setState({ ...this.state, showQuantityModal: true });
  }

  closeQuantityModal() {
    this.setState({ ...this.state, showQuantityModal: false });
  }

}
