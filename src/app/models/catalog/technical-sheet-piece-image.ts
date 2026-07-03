import { AuditEntity } from '../../common/interfaces/audit-entity';

export interface TechnicalSheetPieceImage extends AuditEntity {
  sheet_id: number;
  file_path: string;
}
