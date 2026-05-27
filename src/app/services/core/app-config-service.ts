import { Injectable } from '@angular/core';
import { Observable, of, shareReplay, tap, catchError, map } from 'rxjs';
import { AppSettingService } from './app-setting-service';
import { environment } from '../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
  private static readonly SETTING_NAMES = [
    environment.LOW_EFFICIENCY_LIMIT,
    environment.HIGH_EFFICIENCY_LIMIT,
    environment.BALANCE_END_EXTRA_HOURS,
  ];

  private settings = new Map<string, string>();
  private load$: Observable<void> | null = null;

  constructor(private appSettingService: AppSettingService) { }

  load(): Observable<void> {
    if (!this.load$) {
      this.load$ = this.appSettingService
        .getValues(AppConfigService.SETTING_NAMES)
        .pipe(
          tap((items) => items.forEach((s) => this.settings.set(s.name, s.value))),
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

  get(key: string): string | undefined {
    return this.settings.get(key);
  }

  getNumber(key: string, defaultValue = 0): number {
    const val = this.settings.get(key);
    if (val === undefined) return defaultValue;
    const num = Number(val);
    return isNaN(num) ? defaultValue : num;
  }

  get lowEfficiencyLimit(): number {
    return this.getNumber(environment.LOW_EFFICIENCY_LIMIT, 0);
  }

  get highEfficiencyLimit(): number {
    return this.getNumber(environment.HIGH_EFFICIENCY_LIMIT, 100);
  }

  get balanceEndExtraHours(): number {
    return this.getNumber(environment.BALANCE_END_EXTRA_HOURS, 8);
  }
}
