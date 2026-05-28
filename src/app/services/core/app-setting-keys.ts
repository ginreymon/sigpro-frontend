export const AppSettingKey = {
  LOW_EFFICIENCY:      'EFF_LOW',
  HIGH_EFFICIENCY:     'EFF_HIGH',
  BAL_HOURS:           'BAL_HOURS',
  SHOW_HOURLY:         'SHOW_HOURLY',
  SHIFT_HOURLY_WINDOW: 'S_H_WINDOW',
} as const;

export type AppSettingKey = (typeof AppSettingKey)[keyof typeof AppSettingKey];
