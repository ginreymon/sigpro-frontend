import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductionOrder } from '../../models/production/production-order';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DocType } from '../../models/production/doc-type';

@Injectable({
  providedIn: 'root',
})
export class ProductionOrderService {
  private path: string = `${environment.BASE_API_URL}/production`;

  constructor(private http: HttpClient) { }

  getOrder(po: ProductionOrder, flat?: boolean): Observable<any[]> {
    const params = new HttpParams().set('type', po.type).set('number', po.number);
    return this.http.get<any>(`${this.path}/production-orders/${flat ? 'flat/' : ''}`, { params });
  }

  getComponents(po: ProductionOrder): Observable<any[]> {
    const params = new HttpParams().set('type', po.type).set('number', po.number);
    return this.http.get<any[]>(`${this.path}/production-components/`, {
      params,
    });
  }

  getDocType(): Observable<DocType[]> {
    return this.http.get<any[]>(`${this.path}/document-types/`);
  }
}
