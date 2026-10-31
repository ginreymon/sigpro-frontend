import { Component, HostListener, Input, signal } from '@angular/core';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';
import { UiLabelButton } from '../../../elements/ui-label-button/ui-label-button';

export interface OpsPopoverItem {
  title: string;
  subtitle?: string;
}

// "N OPs" button that opens a small card with the list of OPs next to it.
// The card sits below the button, or above it when there is more room there; `maxHeight` keeps it
// inside the viewport on any screen size.
@Component({
  selector: 'app-ops-popover',
  imports: [UiIcon, UiLabelButton],
  templateUrl: './ops-popover.html',
})
export class OpsPopover {
  // Heading of the card (e.g. the work center).
  @Input({ required: true }) title = '';
  @Input({ required: true }) items: OpsPopoverItem[] = [];

  protected readonly card = signal<{
    left: number;
    width: number;
    maxHeight: number;
    top?: number;
    bottom?: number;
  } | null>(null);

  protected get label(): string {
    return `${this.items.length} ${this.items.length === 1 ? 'OP' : 'OPs'}`;
  }

  protected toggle(event: Event): void {
    event.stopPropagation();
    if (this.card()) {
      this.close();
      return;
    }
    const margin = 8;
    const gap = 4;
    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const width = Math.min(288, window.innerWidth - margin * 2);
    const left = Math.max(margin, Math.min(rect.left + rect.width / 2 - width / 2, window.innerWidth - width - margin));
    const spaceBelow = window.innerHeight - rect.bottom - gap - margin;
    const spaceAbove = rect.top - gap - margin;
    const below = spaceBelow >= 200 || spaceBelow >= spaceAbove;
    const maxHeight = Math.min(320, below ? spaceBelow : spaceAbove);
    this.card.set(
      below
        ? { left, width, maxHeight, top: rect.bottom + gap }
        : { left, width, maxHeight, bottom: window.innerHeight - rect.top + gap },
    );
  }

  // The position is computed from the viewport when opening, so it is stale after a resize.
  @HostListener('window:resize')
  @HostListener('document:keydown.escape')
  protected close(): void {
    this.card.set(null);
  }
}
