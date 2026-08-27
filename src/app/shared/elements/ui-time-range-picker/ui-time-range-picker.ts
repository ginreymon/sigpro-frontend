import { Component, computed, forwardRef, Input, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '../../../common/classes/base-control-value-accessor';
import { UiIcon } from '../ui-icon/ui-icon';
import { UiButton } from '../ui-button/ui-button';

type Period = 'AM' | 'PM';
type ClockMode = 'hour' | 'minute';
type TimeValue = { hour: number; minute: number };
type ClockMark = { value: number; label: string; angleDeg: number };

const WHEEL_CENTER = 120;
const WHEEL_RADIUS = 92;
const MARK_SIZE = 36;
const THUMB_SIZE = 28;

@Component({
  selector: 'app-ui-time-range-picker',
  standalone: true,
  imports: [UiIcon, UiButton],
  templateUrl: './ui-time-range-picker.html',
  styleUrl: './ui-time-range-picker.css',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiTimeRangePicker), multi: true },
  ],
})
export class UiTimeRangePicker extends BaseControlValueAccessor<string | null> {
  @Input() title = 'Hora';

  isOpen = signal(false);
  clockMode = signal<ClockMode>('hour');

  selected = signal<TimeValue | null>(null);
  temp = signal<TimeValue>({ hour: 0, minute: 0 });

  period = computed<Period>(() => (this.temp().hour >= 12 ? 'PM' : 'AM'));

  hour12 = computed(() => {
    const h = this.temp().hour % 12;
    return h === 0 ? 12 : h;
  });

  displayLabel = computed(() => {
    const s = this.selected();
    if (!s) return '';
    const h = s.hour % 12 === 0 ? 12 : s.hour % 12;
    const period = s.hour >= 12 ? 'PM' : 'AM';
    return `${String(h).padStart(2, '0')}:${String(s.minute).padStart(2, '0')} ${period}`;
  });

  hourMarks = computed((): ClockMark[] =>
    Array.from({ length: 12 }, (_, i) => {
      const value = i === 0 ? 12 : i;
      return { value, label: String(value), angleDeg: i * 30 };
    }),
  );

  minuteMarks = computed((): ClockMark[] =>
    Array.from({ length: 12 }, (_, i) => {
      const value = i * 5;
      return { value, label: String(value).padStart(2, '0'), angleDeg: i * 30 };
    }),
  );

  marks = computed((): ClockMark[] =>
    this.clockMode() === 'hour' ? this.hourMarks() : this.minuteMarks(),
  );

  pointerAngle = computed(() => {
    const t = this.temp();
    return this.clockMode() === 'hour' ? (this.hour12() % 12) * 30 : t.minute * 6;
  });

  pointerOnMark = computed(() => {
    const value = this.clockMode() === 'hour' ? this.hour12() : this.temp().minute;
    return this.marks().some(m => m.value === value);
  });

  thumbPosition = computed((): { left: number; top: number } => {
    const rad = (this.pointerAngle() * Math.PI) / 180;
    return {
      left: WHEEL_CENTER + WHEEL_RADIUS * Math.sin(rad) - THUMB_SIZE / 2,
      top: WHEEL_CENTER - WHEEL_RADIUS * Math.cos(rad) - THUMB_SIZE / 2,
    };
  });

  open() {
    if (this.disabled) return;
    const s = this.selected();
    this.temp.set(s ? { ...s } : { hour: 0, minute: 0 });
    this.clockMode.set('hour');
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.onTouched();
  }

  accept() {
    const t = this.temp();
    this.selected.set({ ...t });
    const result = this.fmt(t);
    this.value = result;
    this.onChange(result);
    this.close();
  }

  selectClockMode(mode: ClockMode) {
    this.clockMode.set(mode);
  }

  setPeriod(period: Period) {
    const current = this.period();
    if (current === period) return;
    this.temp.update(t => ({ ...t, hour: (t.hour + 12) % 24 }));
  }

  isMarkSelected(mark: ClockMark): boolean {
    return this.clockMode() === 'hour' ? mark.value === this.hour12() : mark.value === this.temp().minute;
  }

  markStyle(angleDeg: number): { left: number; top: number } {
    const rad = (angleDeg * Math.PI) / 180;
    return {
      left: WHEEL_CENTER + WHEEL_RADIUS * Math.sin(rad) - MARK_SIZE / 2,
      top: WHEEL_CENTER - WHEEL_RADIUS * Math.cos(rad) - MARK_SIZE / 2,
    };
  }

  onWheelClick(event: MouseEvent, wheel: HTMLElement) {
    const rect = wheel.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = event.clientX - cx;
    const dy = event.clientY - cy;
    let angle = (Math.atan2(dx, -dy) * 180) / Math.PI;
    if (angle < 0) angle += 360;

    if (this.clockMode() === 'hour') {
      const idx = Math.round(angle / 30) % 12;
      this.setHour12(idx === 0 ? 12 : idx);
    } else {
      const value = Math.round(angle / 6) % 60;
      this.setMinute(value);
    }
  }

  private setHour12(value: number) {
    const period = this.period();
    const hour24 = this.to24Hour(value, period);
    this.temp.update(t => ({ ...t, hour: hour24 }));
    this.clockMode.set('minute');
  }

  private setMinute(value: number) {
    this.temp.update(t => ({ ...t, minute: value }));
  }

  private to24Hour(hour12: number, period: Period): number {
    if (period === 'AM') return hour12 === 12 ? 0 : hour12;
    return hour12 === 12 ? 12 : hour12 + 12;
  }

  private fmt(t: TimeValue): string {
    return `${this.pad2(t.hour)}:${this.pad2(t.minute)}`;
  }

  private pad2(n: number): string {
    return String(n).padStart(2, '0');
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  override writeValue(value: string | null): void {
    if (!value) {
      this.selected.set(null);
      this.value = null;
      return;
    }
    this.selected.set(this.parse(value));
    this.value = value;
  }

  private parse(hhmm: string): TimeValue {
    const [hour, minute] = hhmm.split(':').map(Number);
    return { hour: hour || 0, minute: minute || 0 };
  }
}
