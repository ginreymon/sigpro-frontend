import { TimeAuditEntity } from '../../common/interfaces/time-audit-entity';
import { UserAuditEntity } from '../../common/interfaces/user-audit-entity';
import { ActiveEntity } from '../../common/interfaces/active-entity';
import { SkuItemFields } from '../production/sku-item-fields';

export interface StampingReferenceSam extends TimeAuditEntity, UserAuditEntity, ActiveEntity {
  rowid_item: number | null;
  identification: string;
  reference?: SkuItemFields | null;
  machine_type: number;
  machine_type_name?: string | null;
  people_count: number;
  piece: number;
  piece_name?: string | null;
  stamped_pieces: number;
  location?: number | null;
  location_name?: string | null;
  stamp_type_description?: number | null;
  stamp_type_description_name?: string | null;
  technique?: number | null;
  technique_name?: string | null;
  fabric_type?: number | null;
  fabric_type_name?: string | null;
  frames?: number | null;
  inks?: number | null;
  prints?: number | null;
  pieces_per_board?: number | null;
  layout_form?: string | null;
  pre_dried?: number | null;
  sam_single_person: string;
  tasks_per_hour: number;
}
