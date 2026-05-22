import { TimeAuditEntity } from '../../common/interfaces/time-audit-entity';
import { UserAuditEntity } from '../../common/interfaces/user-audit-entity';
import { ActiveEntity } from '../../common/interfaces/active-entity';

export type AppSettingDataType = 'STRING' | 'INTEGER' | 'DECIMAL' | 'BOOLEAN';

export interface AppSetting extends TimeAuditEntity, UserAuditEntity, ActiveEntity {
  name: string;
  value: string;
  data_type: AppSettingDataType;
  description: string | null;
}
