export interface WorkShiftCard {
  title: string;
  data: string | number;
  iconName?: string;
  action?: () => void;
  thresholds?: {
    green: number;
    red: number;
  };
}
