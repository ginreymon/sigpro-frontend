import { AuditEntity } from '../../common/interfaces/audit-entity';
import { SkuInfo } from './sku-info';

export interface TechnicalSheet extends AuditEntity {
  rowid_item: number;
  tariff_code: string | null;
  source_model: string | null;
  colors: string | null;
  status: number | null;
  status_name: string | null;
  sheet_version: string | null;
  operational_route: string | null;
  warehouse: string | null;
  fabric_warehouse: string | null;
  sku_info: SkuInfo | null;
  sizes: string[] | null;
  // flattened from sku_info for table display
  reference: string | null;
  description: string | null;
  brand: string | null;
  collection: string | null;
  collection_local_name: string | null;
}
