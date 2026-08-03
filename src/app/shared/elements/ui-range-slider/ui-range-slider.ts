import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';

export interface TimeRange {
  startMinutes: number;
  endMinutes: number;
}

@Component({
  selector: 'app-ui-range-slider',
  standalone: true,
  templateUrl: './ui-range-slider.html',
  styleUrl: './ui-range-slider.css',
})
export class UiRangeSlider {
  @ViewChild('track') track!: ElementRef<HTMLDivElement>;

  @Input() totalMinutes = 60;
  @Input() disabled = false;
  /** Momento real (turno) que corresponde a minuto 0 — permite mostrar horas de reloj reales en vez de minutos transcurridos. */
  @Input() referenceStart: Date | string | null = null;

  private _startMinutes = 0;
  private _endMinutes = 60;

  @Input() set startMinutes(v: number) { this._startMinutes = this.clamp(v); }
  get startMinutes(): number { return this._startMinutes; }

  @Input() set endMinutes(v: number) { this._endMinutes = this.clamp(v); }
  get endMinutes(): number { return this._endMinutes; }

  @Output() rangeChange = new EventEmitter<TimeRange>();

  private activeHandle: 'start' | 'end' | null = null;

  get startPercent(): number {
    return this.totalMinutes > 0 ? (this._startMinutes / this.totalMinutes) * 100 : 0;
  }

  get endPercent(): number {
    return this.totalMinutes > 0 ? (this._endMinutes / this.totalMinutes) * 100 : 0;
  }

  formatLabel(minutes: number): string {
    if (this.referenceStart) {
      const base = new Date(this.referenceStart);
      const t = new Date(base.getTime() + minutes * 60000);
      return `${t.getHours().toString().padStart(2, '0')}:${t.getMinutes().toString().padStart(2, '0')}`;
    }
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60);
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  }

  get durationLabel(): string {
    const mins = this._endMinutes - this._startMinutes;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return h > 0 ? `${h}h ${m}min` : `${m}min`;
  }

  startDrag(handle: 'start' | 'end', event: MouseEvent | TouchEvent): void {
    if (this.disabled) return;
    event.preventDefault();
    this.activeHandle = handle;
  }

  @HostListener('document:mousemove', ['$event'])
  @HostListener('document:touchmove', ['$event'])
  onPointerMove(event: MouseEvent | TouchEvent): void {
    if (!this.activeHandle || !this.track) return;
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const rect = this.track.nativeElement.getBoundingClientRect();
    const ratio = rect.width > 0 ? Math.min(Math.max((clientX - rect.left) / rect.width, 0), 1) : 0;
    const minutes = Math.round(ratio * this.totalMinutes);

    if (this.activeHandle === 'start') {
      this._startMinutes = Math.min(minutes, this._endMinutes);
    } else {
      this._endMinutes = Math.max(minutes, this._startMinutes);
    }
  }

  @HostListener('document:mouseup')
  @HostListener('document:touchend')
  onPointerUp(): void {
    if (!this.activeHandle) return;
    this.activeHandle = null;
    this.rangeChange.emit({ startMinutes: this._startMinutes, endMinutes: this._endMinutes });
  }

  private clamp(v: number): number {
    return Math.min(Math.max(v, 0), this.totalMinutes);
  }
}
