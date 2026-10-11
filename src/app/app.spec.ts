import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { UpdateService } from './services/common/update-service';

describe('App', () => {
  const updateService = {
    updateAvailable: signal(false),
    start: vi.fn(),
    applyUpdate: vi.fn(),
  };

  beforeEach(async () => {
    updateService.start.mockClear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: UpdateService, useValue: updateService }],
    }).compileComponents();
  });

  it('should create the app and start the update check', () => {
    const fixture = TestBed.createComponent(App);

    expect(fixture.componentInstance).toBeTruthy();
    expect(updateService.start).toHaveBeenCalledTimes(1);
  });

  it('should render the router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('router-outlet')).not.toBeNull();
  });
});
