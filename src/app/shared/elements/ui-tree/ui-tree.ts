import { Component, ElementRef, computed, inject, input, model, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiIcon } from '../ui-icon/ui-icon';

export type UiTreeId = string | number;

export interface UiTreeNode {
  id: UiTreeId;
  label: string;
  description?: string;
  children?: UiTreeNode[];
}

/**
 * Generic hierarchical tree with unlimited depth and tri-state selection.
 * The selection value (`selected`) only contains LEAF ids; parent state is derived.
 */
@Component({
  selector: 'app-ui-tree',
  imports: [NgTemplateOutlet, UiIcon],
  templateUrl: './ui-tree.html',
  styleUrl: './ui-tree.css',
})
export class UiTree {
  private host = inject<ElementRef<HTMLElement>>(ElementRef);

  nodes = input<UiTreeNode[]>([]);
  selectable = input(true);
  defaultExpanded = input(false);
  showCount = input(true);
  emptyText = input('Sin elementos');
  ariaLabel = input<string | null>(null);
  selected = model<UiTreeId[]>([]);

  /** Ids toggled away from the `defaultExpanded` state. */
  private toggledIds = signal<Set<UiTreeId>>(new Set());
  private focusedId = signal<UiTreeId | null>(null);

  private selectedSet = computed(() => new Set(this.selected() ?? []));

  /** Leaf ids per node id, computed once per `nodes` change. */
  private leavesById = computed(() => {
    const map = new Map<UiTreeId, UiTreeId[]>();
    const walk = (node: UiTreeNode): UiTreeId[] => {
      // A node with a `children` array is a group (never a selectable leaf, even if empty).
      const leaves = node.children ? node.children.flatMap(walk) : [node.id];
      map.set(node.id, leaves);
      return leaves;
    };
    this.nodes().forEach(walk);
    return map;
  });

  isExpanded(id: UiTreeId): boolean {
    return this.defaultExpanded() !== this.toggledIds().has(id);
  }

  toggleExpanded(id: UiTreeId): void {
    const next = new Set(this.toggledIds());
    if (!next.delete(id)) next.add(id);
    this.toggledIds.set(next);
  }

  hasChildren(node: UiTreeNode): boolean {
    return !!node.children?.length;
  }

  selectedCount(node: UiTreeNode): number {
    const set = this.selectedSet();
    return (this.leavesById().get(node.id) ?? []).filter((id) => set.has(id)).length;
  }

  totalCount(node: UiTreeNode): number {
    return this.leavesById().get(node.id)?.length ?? 0;
  }

  state(node: UiTreeNode): 'checked' | 'unchecked' | 'indeterminate' {
    const count = this.selectedCount(node);
    if (count === 0) return 'unchecked';
    return count === this.totalCount(node) ? 'checked' : 'indeterminate';
  }

  ariaChecked(node: UiTreeNode): 'true' | 'false' | 'mixed' | null {
    if (!this.selectable()) return null;
    const state = this.state(node);
    return state === 'indeterminate' ? 'mixed' : state === 'checked' ? 'true' : 'false';
  }

  toggleSelection(node: UiTreeNode): void {
    if (!this.selectable()) return;
    const leaves = this.leavesById().get(node.id) ?? [];
    const leafSet = new Set(leaves);
    const rest = (this.selected() ?? []).filter((id) => !leafSet.has(id));
    this.selected.set(this.state(node) === 'checked' ? rest : [...rest, ...leaves]);
  }

  /** Roving tabindex: only one row is in the tab order. */
  tabIndex(node: UiTreeNode, isFirst: boolean): number {
    const focused = this.focusedId();
    // Fall back to the first row when nothing is focused or the focused node disappeared.
    if (focused === null || !this.leavesById().has(focused)) return isFirst ? 0 : -1;
    return focused === node.id ? 0 : -1;
  }

  onFocus(node: UiTreeNode): void {
    this.focusedId.set(node.id);
  }

  onKeydown(event: KeyboardEvent, node: UiTreeNode): void {
    const row = event.currentTarget as HTMLElement;
    const rows = Array.from(this.host.nativeElement.querySelectorAll<HTMLElement>('[data-tree-row]'));
    const index = rows.indexOf(row);
    const expandable = this.hasChildren(node);
    let handled = true;

    switch (event.key) {
      case 'ArrowDown':
        rows[index + 1]?.focus();
        break;
      case 'ArrowUp':
        rows[index - 1]?.focus();
        break;
      case 'ArrowRight':
        if (expandable && !this.isExpanded(node.id)) this.toggleExpanded(node.id);
        else if (expandable) rows[index + 1]?.focus();
        break;
      case 'ArrowLeft':
        if (expandable && this.isExpanded(node.id)) {
          this.toggleExpanded(node.id);
        } else {
          row.closest('li')?.parentElement?.closest('li')?.querySelector<HTMLElement>('[data-tree-row]')?.focus();
        }
        break;
      case 'Enter':
        if (expandable) this.toggleExpanded(node.id);
        else this.toggleSelection(node);
        break;
      case ' ':
        this.toggleSelection(node);
        break;
      default:
        handled = false;
    }
    if (handled) event.preventDefault();
  }
}
