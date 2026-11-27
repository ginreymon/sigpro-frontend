import { Injectable } from '@angular/core';
import { map, Observable, of, switchMap } from 'rxjs';
import { isProcessesOrder } from '../../common/functions/processes-machine-type';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { StampingOrderDetail } from '../../models/stamping/stamping-order-detail';
import { OrderTraceability } from '../../models/stamping/order-traceability';
import { ColorRowDetail } from '../../models/production/color-row-detail';
import { SkuDetail } from '../../models/production/sku-detail';

// sp_ordenes_produccion_proceso_json (OPT) devuelve colorRows[].items en vez
// de colorRows[].skus, con "attribute" en vez de "size" (cada color trae un
// único renglón sintético, no tallas reales por SKU — ver comentario en el
// SP). skuRowId ya viene en 0 desde el propio SP (no aplica para estos
// renglones sintéticos) e itemId trae el GUID determinístico — ambos pasan
// tal cual, solo se normaliza items -> skus y attribute -> size, en el
// único punto que llama a este endpoint, para que el resto de la app siga
// trabajando con el contrato único ColorRowDetail.skus[] (buildColorSizeMatrix,
// ProductionOrdersTable, OrderSkuAuditTable, etc.) sin tener que conocer
// esta diferencia.
interface ProcessesSkuItem extends Omit<SkuDetail, 'size'> {
  attribute: string;
}
interface ProcessesColorRow extends Omit<ColorRowDetail, 'skus'> {
  items: ProcessesSkuItem[];
}
interface ProcessesOrderResponse extends Omit<StampingOrderDetail, 'colorRows'> {
  colorRows: ProcessesColorRow[];
}

@Injectable({
  providedIn: 'root',
})
export class OPStampingService {
  // Read lazily: BASE_API_URL is resolved by an app initializer after this service may be created.
  private get path(): string {
    return `${environment.BASE_API_URL}/stamping`;
  }

  constructor(private http: HttpClient) {}

  getOrderDetail(docType: string, docNumber: number): Observable<StampingOrderDetail> {
    const params = new HttpParams().set('type', docType).set('number', docNumber);
    return this.http.get<StampingOrderDetail>(`${this.path}/stamping-orders/detail/`, { params });
  }

  // Loads the stamping detail (its referenceSams carry the machine type) and, when the order belongs
  // to a processes machine (e.g. CALANDRA), reloads it from production-orders/processes. Works for OP and OPT.
  getOrderByMachineType(docType: string, docNumber: number): Observable<StampingOrderDetail> {
    return this.getOrderDetail(docType, docNumber).pipe(
      switchMap((detail) =>
        isProcessesOrder(detail.referenceSams) ? this.getProductionOrderProcesses(docType, docNumber) : of(detail),
      ),
    );
  }

  getTraceability(docNumber: number, docType?: string | null): Observable<OrderTraceability[]> {
    let params = new HttpParams().set('number', docNumber);
    if (docType) params = params.set('type', docType);
    return this.http.get<OrderTraceability[]>(`${this.path}/stamping-orders/traceability/`, { params });
  }

  // Búsqueda de OP para módulos cuya máquina tiene uses_processes_search —
  // sp_ordenes_produccion_proceso_json en vez del endpoint genérico de
  // production-orders/detail (ver OrderSearcher).
  getProductionOrderProcesses(docType: string, docNumber: number): Observable<StampingOrderDetail> {
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
