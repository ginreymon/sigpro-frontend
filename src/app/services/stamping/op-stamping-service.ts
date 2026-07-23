import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { StampingOrderDetail } from '../../models/stamping/stamping-order-detail';

@Injectable({
  providedIn: 'root',
})
export class OPStampingService {
  private path: string = `${environment.BASE_API_URL}/stamping`;

  constructor(private http: HttpClient) {}

  getOrderDetail(docType: string, docNumber: number): Observable<StampingOrderDetail> {
    const params = new HttpParams().set('type', docType).set('number', docNumber);
    return this.http.get<StampingOrderDetail>(`${this.path}/stamping-orders/flat/`, { params });
  }
}
