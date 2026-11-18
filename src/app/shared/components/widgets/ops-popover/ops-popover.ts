import { Component, HostListener, input, signal } from '@angular/core';
import { UiIcon } from '../../../elements/ui-icon/ui-icon';
import { UiLabelButton } from '../../../elements/ui-label-button/ui-label-button';

export interface OpsPopoverItem {
  key: string | number;
  title: string;
  subtitle?: string | null;
}

interface OpsPopoverPosition {
  left: number;
  width: number;
  maxHeight: number;
  top?: number;
  bottom?: number;
}

// "N OPs" button that opens a mini-card with the list of OPs, used by the integration tables.
// The card sits below the button, or above it when there is more room there; `maxHeight` keeps it
// inside the viewport on any screen size.
@Component({
  selector: 'app-ops-popover',
  imports: [UiIcon, UiLabelButton],
  templateUrl: './ops-popover.html',
})
export class OpsPopover {
  readonly items = input.required<OpsPopoverItem[]>();
  // Text of the card header, before the OP count (e.g. the work center code).
  readonly heading = input.required<string>();

  protected readonly position = signal<OpsPopoverPosition | null>(null);

  protected toggle(event: Event): void {
    event.stopPropagation();
    if (this.position()) {
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
    this.position.set(
      below
        ? { left, width, maxHeight, top: rect.bottom + gap }
        : { left, width, maxHeight, bottom: window.innerHeight - rect.top + gap },
    );
  }

  // Position is computed from the viewport when opening, so it is stale after a resize.
  @HostListener('window:resize')
  @HostListener('document:keydown.escape')
  protected close(): void {
    this.position.set(null);
  }
}
