import { Component, EventEmitter, Input, OnChanges, OnDestroy, Output } from '@angular/core';
import { EfficiencySummaryBar } from '../../widgets/efficiency-summary-bar/efficiency-summary-bar';
import { BadgeIntent, UiBadge } from '../../../../elements/ui-badge/ui-badge';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';

const STATUS_BADGES: Record<string, { intent: BadgeIntent; label: string }> = {
  ACTIVE: { intent: 'active', label: 'Activo' },
  PAUSED: { intent: 'paused', label: 'Pausado' },
};
const INACTIVE_BADGE = { intent: 'inactive' as BadgeIntent, label: 'Inactivo' };
const COUNT_UP_MS = 1000;

@Component({
  selector: 'app-home-productivity-card',
  imports: [EfficiencySummaryBar, UiBadge, UiIcon],
  templateUrl: './home-productivity-card.html',
})
export class HomeProductivityCard implements OnChanges, OnDestroy {
  @Input({ required: true }) label!: string;
  @Input() efficiency = 0;
  @Input() status = 'INACTIVE';
  @Input() completed = 0;
  @Input() activeModules?: number;
  @Input() clickable = false;
  @Output() cardClick = new EventEmitter<void>();

  // Values rendered in the bar; they count up from the previous value to the real one.
  shownEfficiency = 0;
  shownCompleted = 0;

  private frameId?: number;

  ngOnChanges(): void {
    this.animateTo(this.efficiency, this.completed);
  }

  ngOnDestroy(): void {
    this.cancelAnimation();
  }

  badgeIntent(): BadgeIntent {
    return (STATUS_BADGES[this.status] ?? INACTIVE_BADGE).intent;
  }

  badgeLabel(): string {
    return (STATUS_BADGES[this.status] ?? INACTIVE_BADGE).label;
  }

  onClick(): void {
    if (this.clickable) this.cardClick.emit();
  }

  private animateTo(efficiency: number, completed: number): void {
    this.cancelAnimation();

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Every new API value counts up from zero so the change is visible without a loader.
    const fromEfficiency = 0;
    const fromCompleted = 0;
    if (reduceMotion) {
      this.shownEfficiency = efficiency;
      this.shownCompleted = completed;
      return;
    }

    const start = performance.now();
    const step = (now: number) => {
      const progress = Math.min((now - start) / COUNT_UP_MS, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      this.shownEfficiency = fromEfficiency + (efficiency - fromEfficiency) * eased;
      this.shownCompleted = Math.round(fromCompleted + (completed - fromCompleted) * eased);
      this.frameId = progress < 1 ? requestAnimationFrame(step) : undefined;
    };
    this.frameId = requestAnimationFrame(step);
  }

  private cancelAnimation(): void {
    if (this.frameId !== undefined) cancelAnimationFrame(this.frameId);
    this.frameId = undefined;
  }
}
