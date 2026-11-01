import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, contentChild, input, model, output } from '@angular/core';
import { BadgeIntent, UiBadge } from '../ui-badge/ui-badge';
import { UiIcon } from '../ui-icon/ui-icon';

export interface AccordionBadge {
  label: string;
  intent?: BadgeIntent;
}

// Generic node: no SIGPRO entities. Put domain data in `data` and read it from the templates.
export interface AccordionItem<T = unknown> {
  id: string | number;
  title: string;
  subtitle?: string;
  icon?: string; // key of common/const/icon-map
  badge?: AccordionBadge;
  disabled?: boolean;
  data?: T;
  children?: AccordionItem<T>[];
}

// Context handed to the custom templates of every node.
export interface AccordionContext<T = unknown> {
  $implicit: AccordionItem<T>;
  depth: number;
}

export interface AccordionToggleEvent<T = unknown> {
  item: AccordionItem<T>;
  expanded: boolean;
}

// Unlimited-depth accordion. Body/actions are customised with templates:
//   <ng-template #accordionBody let-item let-depth="depth">...</ng-template>
//   <ng-template #accordionActions let-item>...</ng-template>
@Component({
  selector: 'app-ui-nested-accordion',
  imports: [UiIcon, UiBadge, NgTemplateOutlet],
  templateUrl: './ui-nested-accordion.html',
  host: { class: 'block' },
})
export class UiNestedAccordion<T = unknown> {
  readonly items = input<AccordionItem<T>[]>([]);
  // false: opening a node closes its siblings (one open per level).
  readonly multiple = input(true);
  // Two-way bindable, so the parent can open nodes by default or read the state.
  readonly expandedIds = model<ReadonlySet<string | number>>(new Set());
  readonly itemToggle = output<AccordionToggleEvent<T>>();

  protected readonly bodyTpl = contentChild<TemplateRef<AccordionContext<T>>>('accordionBody');
  protected readonly actionsTpl = contentChild<TemplateRef<AccordionContext<T>>>('accordionActions');

  protected toggle(item: AccordionItem<T>, siblings: AccordionItem<T>[]): void {
    if (item.disabled) return;
    const next = new Set(this.expandedIds());
    const expanded = !next.delete(item.id);
    if (expanded) {
      if (!this.multiple()) siblings.forEach((s) => next.delete(s.id));
      next.add(item.id);
    }
    this.expandedIds.set(next);
    this.itemToggle.emit({ item, expanded });
  }

  protected hasContent(item: AccordionItem<T>): boolean {
    return !!item.children?.length || !!this.bodyTpl();
  }
}
