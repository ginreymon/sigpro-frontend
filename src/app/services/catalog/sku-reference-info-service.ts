import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SkuReferenceInfo } from '../../models/catalog/sku-reference-info';

@Injectable({ providedIn: 'root' })
export class SkuReferenceInfoService {
  private endpoint = `${environment.BASE_API_URL}/catalog/referencia-info/`;

  constructor(private http: HttpClient) {}

  getByRowidItem(rowidItem: number): Observable<SkuReferenceInfo> {
    return this.http.get<SkuReferenceInfo>(this.endpoint, {
      params: { rowid_item: rowidItem },
    });
  }
}
