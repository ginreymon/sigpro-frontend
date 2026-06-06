import { Component, Input } from '@angular/core';

export type BadgeIntent = 'default' | 'active' | 'inactive' | 'paused' | 'disabled' | 'warning' | 'danger';

@Component({
  selector: 'app-ui-badge',
  imports: [],
  templateUrl: './ui-badge.html',
  styleUrl: './ui-badge.css',
})
export class UiBadge {
  @Input() active: boolean = false;
  @Input() activeText: string = 'Activo';
  @Input() inactiveText: string = 'Inactivo';

  @Input() intent: BadgeIntent | null = null;
  @Input() label: string = '';

  private readonly _intents: Record<BadgeIntent, { badge: string; dot: string }> = {
    default: { badge: 'bg-brand-100 text-brand-700', dot: 'bg-brand-500' },
    active: { badge: 'bg-green-100 text-green-700', dot: 'bg-green-500' },
    inactive: { badge: 'bg-gray-100 text-gray-500', dot: 'bg-gray-400' },
    paused: { badge: 'bg-orange-100 text-orange-600', dot: 'bg-orange-600' },
    disabled: { badge: 'bg-gray-100 text-gray-400', dot: 'bg-gray-300' },
    warning: { badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
    danger: { badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
  };

  get badgeClass(): string {
    if (this.intent) return this._intents[this.intent].badge;
    return this.active ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-500';
  }

  get dotClass(): string {
    if (this.intent) return this._intents[this.intent].dot;
    return this.active ? 'bg-brand-500' : 'bg-slate-400';
  }

  get displayText(): string {
    if (this.intent) return this.label;
    return this.active ? this.activeText : this.inactiveText;
  }
}
