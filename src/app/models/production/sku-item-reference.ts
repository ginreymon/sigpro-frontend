import { BaseEntity } from '../../common/interfaces/base-entity';
import { SkuItemFields } from './sku-item-fields';

export interface SkuItemReference extends BaseEntity, SkuItemFields {
  sam_value: string | null;
  sam_id: number | null;
}
