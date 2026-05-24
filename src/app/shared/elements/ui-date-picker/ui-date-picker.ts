import { Component, computed, forwardRef, signal } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '../../../common/classes/base-control-value-accessor';
import { UiIcon } from '../ui-icon/ui-icon';
import { UiButton } from '../ui-button/ui-button';

const MONTHS_ES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];
const DAYS_ES = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];

type DateState = { date: number; month: number; year: number };

@Component({
  selector: 'app-ui-date-picker',
  standalone: true,
  imports: [UiIcon, UiButton],
  templateUrl: './ui-date-picker.html',
  styleUrl: './ui-date-picker.css',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiDatePicker), multi: true },
  ],
})
export class UiDatePicker extends BaseControlValueAccessor<string | null> {
  readonly months = MONTHS_ES;
  readonly days = DAYS_ES;

  isOpen = signal(false);
  viewMode = signal<'days' | 'months' | 'years'>('days');
  viewDate = signal<{ month: number; year: number }>({
    month: new Date().getMonth(),
    year: new Date().getFullYear(),
  });
  selectedDate = signal<DateState | null>(null);
  tempDate = signal<DateState | null>(null);
  yearPage = signal(0);

  displayLabel = computed(() => {
    const d = this.selectedDate();
    if (!d) return null;
    return `${d.date} de ${MONTHS_ES[d.month].toLowerCase()} de ${d.year}`;
  });

  calendarGrid = computed((): (number | null)[][] => {
    const { month, year } = this.viewDate();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  });

  yearGrid = computed((): number[] => {
    const base = this.viewDate().year - 7 + this.yearPage() * 16;
    return Array.from({ length: 16 }, (_, i) => base + i);
  });

  open() {
    if (this.disabled) return;
    const d = this.selectedDate();
    this.tempDate.set(d ? { ...d } : null);
    this.viewDate.set({ month: d?.month ?? new Date().getMonth(), year: d?.year ?? new Date().getFullYear() });
    this.viewMode.set('days');
    this.yearPage.set(0);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.onTouched();
  }

  accept() {
    const t = this.tempDate();
    if (t && t.date > 0) {
      this.selectedDate.set({ ...t });
      const iso = `${t.year}-${String(t.month + 1).padStart(2, '0')}-${String(t.date).padStart(2, '0')}`;
      this.value = iso;
      this.onChange(iso);
    }
    this.close();
  }

  selectDay(day: number | null) {
    if (!day) return;
    const { month, year } = this.viewDate();
    this.tempDate.set({ date: day, month, year });
  }

  isTempSelected(day: number | null): boolean {
    if (!day) return false;
    const t = this.tempDate();
    const v = this.viewDate();
    return !!(t && t.date === day && t.month === v.month && t.year === v.year);
  }

  isToday(day: number | null): boolean {
    if (!day) return false;
    const now = new Date();
    const v = this.viewDate();
    return day === now.getDate() && v.month === now.getMonth() && v.year === now.getFullYear();
  }

  prevMonth() {
    this.viewDate.update(v => ({
      month: v.month === 0 ? 11 : v.month - 1,
      year: v.month === 0 ? v.year - 1 : v.year,
    }));
  }

  nextMonth() {
    this.viewDate.update(v => ({
      month: v.month === 11 ? 0 : v.month + 1,
      year: v.month === 11 ? v.year + 1 : v.year,
    }));
  }

  selectMonth(i: number) {
    this.viewDate.update(v => ({ ...v, month: i }));
    this.viewMode.set('days');
  }

  selectYear(y: number) {
    this.viewDate.update(v => ({ ...v, year: y }));
    this.viewMode.set('days');
  }

  prevYears() {
    this.yearPage.update(p => p - 1);
  }

  nextYears() {
    this.yearPage.update(p => p + 1);
  }

  stopPropagation(event: Event) {
    event.stopPropagation();
  }

  override writeValue(value: string | null): void {
    if (!value) {
      this.selectedDate.set(null);
      this.value = null;
      return;
    }
    const parts = value.split('-').map(Number);
    if (parts.length === 3) {
      const [year, month, date] = parts;
      this.selectedDate.set({ date, month: month - 1, year });
    }
    this.value = value;
  }
}
