import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  MonitoringDiagnostics,
  MonitoringSummary,
  SiesaCheckResult,
} from '../../models/system-monitoring/system-monitoring';

@Injectable({ providedIn: 'root' })
export class SystemMonitoringService {
  private http = inject(HttpClient);

  // Read lazily: BASE_API_URL is resolved by an app initializer.
  private get path(): string {
    return `${environment.BASE_API_URL}/system-monitoring`;
  }

  getSummary(): Observable<MonitoringSummary> {
    return this.http.get<MonitoringSummary>(`${this.path}/summary/`);
  }

  getDiagnostics(): Observable<MonitoringDiagnostics> {
    return this.http.get<MonitoringDiagnostics>(`${this.path}/diagnostics/`);
  }

  checkSiesa(): Observable<SiesaCheckResult> {
    return this.http.post<SiesaCheckResult>(`${this.path}/integrations/siesa/check/`, {});
  }

  reportClientError(payload: { message: string; url: string; stack: string }): Observable<void> {
    return this.http.post<void>(`${this.path}/client-errors/`, payload);
  }
}
