import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { StampingOrderDetail } from '../../models/stamping/stamping-order-detail';
import { OrderTraceability } from '../../models/stamping/order-traceability';
import { ProductionOrder } from '../../models/production/production-order';
import { ColorRowDetail } from '../../models/production/color-row-detail';
import { SkuDetail } from '../../models/production/sku-detail';

// sp_ordenes_produccion_proceso_json (OPT) devuelve colorRows[].items en vez
// de colorRows[].skus, y cada item trae "attribute" en vez de "size" (cada
// color trae un único renglón sintético, no tallas reales por SKU — ver
// comentario en el SP). Se normaliza acá, en el único punto que llama a este
// endpoint, para que el resto de la app siga trabajando con el contrato
// único ColorRowDetail.skus[].size (buildColorSizeMatrix, ProductionOrdersTable,
// OrderSkuAuditTable, etc.) sin tener que conocer esta diferencia.
interface ProcessesSkuItem extends Omit<SkuDetail, 'size'> {
  attribute: string;
}
interface ProcessesColorRow extends Omit<ColorRowDetail, 'skus'> {
  items: ProcessesSkuItem[];
}
interface ProcessesOrderResponse extends Omit<ProductionOrder, 'colorRows'> {
  colorRows: ProcessesColorRow[];
}

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
    return this.http.get<ProcessesOrderResponse>(`${this.path}/production-orders/processes/`, { params }).pipe(
      map((data) => ({
        ...data,
        colorRows: data.colorRows.map(({ items, ...rest }) => ({
          ...rest,
          skus: items.map(({ attribute, ...item }): SkuDetail => ({ ...item, size: attribute })),
        })),
      })),
    );
  }
}
