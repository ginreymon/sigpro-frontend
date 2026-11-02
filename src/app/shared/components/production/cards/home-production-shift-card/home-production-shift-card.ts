import { Component, computed, Input } from '@angular/core';
import { WorkShiftSummary } from '../work-shift-summary/work-shift-summary';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';
import { UpperCasePipe } from '@angular/common';

@Component({
  selector: 'app-home-production-shift-card',
  imports: [UiIcon, UpperCasePipe],
  host: { class: 'block' },
  templateUrl: './home-production-shift-card.html',
})
export class HomeProductionShiftCard extends WorkShiftSummary {
  private static readonly tileTitles = ['Encomendados', 'Meta', 'Acumuladas', 'Bajas y saldos '];

  /** Parent is still fetching the active session. */
  @Input() loading = false;

  // Skeleton while the session loads and until the cards are built (config load is async).
  get showSkeleton(): boolean {
    return this.loading || !this.cards().length;
  }

  readonly moduleCard = computed(() => this.cards().find(c => c.title === 'Módulo'));
  readonly shiftCard = computed(() => this.cards().find(c => c.title === 'Turno'));
  readonly dayEfficiency = computed(() => this.cards().find(c => c.title === 'Eficiencia'));
  readonly tiles = computed(() => this.cards().filter(c => HomeProductionShiftCard.tileTitles.includes(c.title)));
}
