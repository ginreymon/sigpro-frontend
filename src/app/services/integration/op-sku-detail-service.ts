import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { OpSkuDetail } from '../../models/integration/op-sku-detail';

@Injectable({
  providedIn: 'root',
})
export class OpSkuDetailService {
  constructor(private http: HttpClient) {}

  get(opType: string, opNumber: number): Observable<OpSkuDetail> {
    const params = new HttpParams().set('op_type', opType).set('op_number', opNumber);
    return this.http.get<OpSkuDetail>(
      `${environment.BASE_API_URL}/integration/orders-to-be-outbound/op-sku-detail/`,
      { params },
    );
  }
}
