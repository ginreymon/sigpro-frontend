import { TimeAuditEntity } from '../../common/interfaces/time-audit-entity';
import { UserAuditEntity } from '../../common/interfaces/user-audit-entity';
import { ActiveEntity } from '../../common/interfaces/active-entity';

export interface StampingReferenceSam extends TimeAuditEntity, UserAuditEntity, ActiveEntity {
  rowid_item: number;
  reference_name: string;
  machine: string;
  people_count: number;
  piece: string;
  stamped_pieces: number;
  location?: string | null;
  stamp_type_description?: string | null;
  technique?: string | null;
  garment_type?: string | null;
  fabric_type?: string | null;
  line?: string | null;
  brand?: string | null;
  collection?: string | null;
  process?: string | null;
  frames?: number | null;
  inks?: number | null;
  prints?: number | null;
  pieces_per_table?: number | null;
  layout_form?: string | null;
  pre_dried?: number | null;
  sam_single_person: string;
  tasks_per_hour: number;
}
