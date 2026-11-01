import { Component, input, output, signal } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiIcon } from '../ui-icon/ui-icon';

export interface TreeNode {
  id: string | number;
  label: string;
  children?: TreeNode[];
}

// Hierarchical list with expandable nodes. Every node (leaf or branch) emits nodeSelect on click.
@Component({
  selector: 'app-ui-tree-view',
  imports: [UiIcon, NgTemplateOutlet],
  templateUrl: './ui-tree-view.html',
  host: { class: 'block' },
})
export class UiTreeView {
  readonly nodes = input<TreeNode[]>([]);
  readonly nodeSelect = output<TreeNode>();

  protected readonly expandedIds = signal<ReadonlySet<string | number>>(new Set());

  protected toggle(node: TreeNode): void {
    this.expandedIds.update((ids) => {
      const next = new Set(ids);
      if (!next.delete(node.id)) next.add(node.id);
      return next;
    });
  }
}
