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
}

@Injectable({ providedIn: 'root' })
export class ShiftModalsService {
  readonly activeModal = signal<'balance' | 'employees' | 'pause' | null>(null);
  readonly balanceData = signal<BalanceModalData | null>(null);
  readonly pauseData = signal<PauseModalData | null>(null);
  readonly employeesData = signal<EmployeesModalData | null>(null);

  readonly employeesSaved$ = new Subject<number[]>();
  readonly pauseSaved$ = new Subject<WorkBreakRecord>();

  /** Command bus: true = open, false = close, null = no override */
  readonly shiftHourlyOpen$ = new BehaviorSubject<boolean | null>(null);

  /** Global readable state of ShiftHourlyRecord visibility */
  readonly shiftHourlyVisible = signal(false);

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

  onEmployeesSaved(ids: number[]): void {
    this.employeesSaved$.next(ids);
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
