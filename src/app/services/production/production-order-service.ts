import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProductionOrder } from '../../models/production/production-order';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { DocType } from '../../models/production/doc-type';
import { ProductionItem } from '../../models/production/production-item';
import { Component } from '../../models/production/component';
import { SkuTaskDetail } from '../../models/production/sku-task-detail';
import { OrderMaterialsResponse } from '../../models/production/order-materials';

@Injectable({
  providedIn: 'root',
})
export class ProductionOrderService {
  private path: string = `${environment.BASE_API_URL}/production`;

  constructor(private http: HttpClient) {}

  getOrder(po: Partial<ProductionOrder>, flat?: boolean): Observable<ProductionOrder | ProductionItem[]> {
    const params = new HttpParams().set('type', po.documentType!).set('number', po.documentNumber!);
    return this.http.get<any>(`${this.path}/production-orders/${flat ? 'flat/' : ''}`, { params });
  }

  getComponents(po: Partial<ProductionOrder>): Observable<Component[]> {
    const params = new HttpParams().set('type', po.documentType!).set('number', po.documentNumber!);
    return this.http.get<any[]>(`${this.path}/production-components/`, {
      params,
    });
  }

  getSkuDetail(docType: string, docNumber: number, skuRowId: number, idPlan?: number): Observable<SkuTaskDetail> {
    let params = new HttpParams()
      .set('type', docType)
      .set('number', docNumber)
      .set('sku_rowid', skuRowId);
    if (idPlan !== undefined) params = params.set('id_plan', idPlan);
    return this.http.get<SkuTaskDetail>(`${this.path}/production-orders/sku-detail/`, { params });
  }

  getMaterials(docType: string, docNumber: number): Observable<OrderMaterialsResponse> {
    const params = new HttpParams().set('type', docType).set('number', docNumber);
    return this.http.get<OrderMaterialsResponse>(`${this.path}/production-orders/materials/`, { params });
  }

  getDocType(): Observable<DocType[]> {
    return this.http.get<any[]>(`${this.path}/document-types/`);
  }
}
