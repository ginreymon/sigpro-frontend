import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { StampingOrderDetail } from '../../models/stamping/stamping-order-detail';
import { OrderTraceability } from '../../models/stamping/order-traceability';
import { ProductionOrder } from '../../models/production/production-order';

@Injectable({
  providedIn: 'root',
})
export class OPStampingService {
  private path: string = `${environment.BASE_API_URL}/stamping`;

  constructor(private http: HttpClient) {}

  getOrderDetail(docType: string, docNumber: number): Observable<StampingOrderDetail> {
    const params = new HttpParams().set('type', docType).set('number', docNumber);
    return this.http.get<StampingOrderDetail>(`${this.path}/stamping-orders/detail/`, { params });
  }

  getTraceability(docNumber: number, docType?: string | null): Observable<OrderTraceability[]> {
    let params = new HttpParams().set('number', docNumber);
    if (docType) params = params.set('type', docType);
    return this.http.get<OrderTraceability[]>(`${this.path}/stamping-orders/traceability/`, { params });
  }

  // Búsqueda de OP para módulos cuya máquina tiene uses_processes_search —
  // sp_ordenes_produccion_proceso_json en vez del endpoint genérico de
  // production-orders/detail (ver OrderSearcher).
  getProductionOrderProcesses(docType: string, docNumber: number): Observable<ProductionOrder> {
    const params = new HttpParams().set('type', docType).set('number', docNumber);
    return this.http.get<ProductionOrder>(`${this.path}/production-orders/processes/`, { params });
  }
}
