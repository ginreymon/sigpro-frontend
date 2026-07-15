import { Injectable, signal } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Employee } from '../../models/production/employee';
import { WorkBreakRecord } from '../../models/production/work-break-record';
import { WorkSession } from '../../models/production/work-session';

export interface BalanceModalData {
  currentSession: WorkSession | null;
  shiftEndTime: string | null;
  inWindow: boolean;
}

export interface PauseModalData {
  activityId: number | null | undefined;
}

export interface EmployeesModalData {
  employees: Employee[];
  preselectedIds: number[];
  apprenticeIds?: number[];
  apprenticeEditable?: boolean;
}

export interface EmployeesSavedData {
  ids: number[];
  apprenticeIds: number[];
}

@Injectable({ providedIn: 'root' })
export class ShiftModalsService {
  readonly activeModal = signal<'balance' | 'employees' | 'pause' | null>(null);
  readonly balanceData = signal<BalanceModalData | null>(null);
  readonly pauseData = signal<PauseModalData | null>(null);
  readonly employeesData = signal<EmployeesModalData | null>(null);
  readonly reloadBalanceTrigger = signal(0);

  readonly employeesSaved$ = new Subject<EmployeesSavedData>();
  readonly pauseSaved$ = new Subject<WorkBreakRecord>();

  /** Command bus: true = open, false = close, null = no override */
  readonly shiftHourlyOpen$ = new BehaviorSubject<boolean | null>(null);

  /** Global readable state of ShiftHourlyRecord visibility */
  readonly shiftHourlyVisible = signal(false);

  /** Visibility of the stamping registration panel (StampingRecord) */
  readonly stampingRecordVisible = signal(false);

  openStampingRecord(): void {
    this.stampingRecordVisible.set(true);
  }

  closeStampingRecord(): void {
    this.stampingRecordVisible.set(false);
  }

  reloadBalance(): void {
    this.reloadBalanceTrigger.update(n => n + 1);
  }

  openBalance(data: BalanceModalData): void {
    this.balanceData.set(data);
    this.activeModal.set('balance');
  }

  openEmployees(data: EmployeesModalData): void {
    this.employeesData.set(data);
    this.activeModal.set('employees');
  }

  openPause(data: PauseModalData): void {
    this.pauseData.set(data);
    this.activeModal.set('pause');
  }

  onEmployeesSaved(data: EmployeesSavedData): void {
    this.employeesSaved$.next(data);
    this.close();
  }

  onPauseSaved(record: WorkBreakRecord): void {
    this.pauseSaved$.next(record);
    this.close();
  }

  openShiftHourlyRecord(): void {
    this.shiftHourlyOpen$.next(true);
  }

  setShiftHourlyVisible(visible: boolean): void {
    this.shiftHourlyVisible.set(visible);
  }

  close(): void {
    this.activeModal.set(null);
  }
}
