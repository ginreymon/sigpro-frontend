import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ShiftHourlyRecord } from './shift-hourly-record';
import { AppConfigService } from '../../../../../services/core/app-config-service';
import { WorkSessionActivityService } from '../../../../../services/production/work-session-activity-service';
import { LoaderService } from '../../../../../services/common/loader-service';
import { DialogService } from '../../../../../services/common/dialog-service';
import { ShiftModalsService } from '../../../../../services/common/shift-modals-service';

describe('ShiftHourlyRecord — reopen on register (S_H_KEEP_OPEN)', () => {
  let shiftModals: ShiftModalsService;

  function createComponent(keepOpenOnRegister: boolean): ShiftHourlyRecord {
    const appConfigStub = {
      load: () => of(undefined),
      showShiftHourlyComponent: true,
      shiftHourlyWindowSeconds: 300,
      shiftHourlyKeepOpenOnRegister: keepOpenOnRegister,
    };

    TestBed.configureTestingModule({
      imports: [ShiftHourlyRecord],
      providers: [
        { provide: AppConfigService, useValue: appConfigStub },
        { provide: WorkSessionActivityService, useValue: { resume: () => of(undefined) } },
        { provide: LoaderService, useValue: { showLoader: () => {}, hideLoader: () => {} } },
        { provide: DialogService, useValue: { openToast: () => {} } },
      ],
    });

    const fixture = TestBed.createComponent(ShiftHourlyRecord);
    const component = fixture.componentInstance;

    // enabled stays false so ngOnInit won't call startTimer()/setInterval — isolates
    // the fix (the shiftHourlyOpen$ subscription) from the hourly-window timer logic.
    component.enabled = false;
    component.ngOnInit();

    shiftModals = TestBed.inject(ShiftModalsService);
    return component;
  }

  afterEach(() => {
    shiftModals.shiftHourlyOpen$.next(null);
  });

  it('reopens the panel immediately when S_H_KEEP_OPEN is enabled and a save command arrives', () => {
    const component = createComponent(true);
    (component as any).isOpen.set(false);

    shiftModals.shiftHourlyOpen$.next(true);

    expect((component as any).isOpen()).toBe(true);
  });

  it('does not force the panel open when S_H_KEEP_OPEN is disabled', () => {
    const component = createComponent(false);
    (component as any).isOpen.set(false);

    shiftModals.shiftHourlyOpen$.next(true);

    expect((component as any).isOpen()).toBe(false);
  });

  it('consumes the command so a stale "true" cannot reopen a future instance', () => {
    const component = createComponent(true);

    shiftModals.shiftHourlyOpen$.next(true);

    expect(shiftModals.shiftHourlyOpen$.getValue()).toBeNull();
  });
});
