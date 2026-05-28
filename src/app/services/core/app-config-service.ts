import { Injectable } from '@angular/core';
import { Observable, of, shareReplay, tap, catchError, map } from 'rxjs';
import { AppSettingService } from './app-setting-service';
import { AppSettingKey } from './app-setting-keys';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private settings = new Map<string, string>();
  private load$: Observable<void> | null = null;

  constructor(private appSettingService: AppSettingService) { }

  load(): Observable<void> {
    if (!this.load$) {
      this.load$ = this.appSettingService
        .getAllKeyedValues()
        .pipe(
          tap((items) => items.forEach((s) => s.key && this.settings.set(s.key, s.value))),
          map(() => void 0),
          catchError(() => of(void 0)),
          shareReplay(1),
        );
    }
    return this.load$;
  }

  reload(): void {
    this.load$ = null;
    this.settings.clear();
    this.load().subscribe();
  }

  get(key: AppSettingKey): string | undefined {
    return this.settings.get(key);
  }

  getNumber(key: AppSettingKey, defaultValue = 0): number {
    const val = this.settings.get(key);
    if (val === undefined) return defaultValue;
    const num = Number(val);
    return isNaN(num) ? defaultValue : num;
  }

  get lowEfficiencyLimit(): number {
    return this.getNumber(AppSettingKey.LOW_EFFICIENCY, 0);
  }

  get highEfficiencyLimit(): number {
    return this.getNumber(AppSettingKey.HIGH_EFFICIENCY, 100);
  }

  get balanceEndExtraHours(): number {
    return this.getNumber(AppSettingKey.BAL_HOURS, 8);
  }

  get showShiftHourlyComponent(): boolean {
    return this.get(AppSettingKey.SHOW_HOURLY) === 'true';
  }
}
