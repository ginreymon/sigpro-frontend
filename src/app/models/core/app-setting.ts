import { TimeAuditEntity } from '../../common/interfaces/time-audit-entity';
import { UserAuditEntity } from '../../common/interfaces/user-audit-entity';
import { ActiveEntity } from '../../common/interfaces/active-entity';

export type AppSettingDataTypeCode = 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN' | 'JSON';

export interface AppSetting extends TimeAuditEntity, UserAuditEntity, ActiveEntity {
  name: string;
  key: string | null;
  value: string;
  data_type: number;
  data_type_code: AppSettingDataTypeCode;
  description: string | null;
}
