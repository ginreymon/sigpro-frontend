import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OpProgressRow } from '../../models/common/op-progress-row';

@Injectable({
  providedIn: 'root',
})
export class OpProgressService {
  private path = `${environment.BASE_API_URL}/dashboard/op-progress/`;

  constructor(private http: HttpClient) {}

  getOpProgress(startDate: string, endDate: string, areaId?: number): Observable<OpProgressRow[]> {
    let params = new HttpParams().set('start_date', startDate).set('end_date', endDate);
    if (areaId !== undefined) params = params.set('area_id', areaId);
    return this.http.get<OpProgressRow[]>(this.path, { params });
  }
}
