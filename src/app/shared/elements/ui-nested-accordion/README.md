# UiNestedAccordion (`app-ui-nested-accordion`)

Generic accordion with unlimited nesting. Independent of any SIGPRO entity: map your data to `AccordionItem` and render domain content with templates.

## Inputs / outputs
| Name | Type | Default | Notes |
|---|---|---|---|
| `items` | `AccordionItem[]` | `[]` | Hierarchical data |
| `multiple` | `boolean` | `true` | `false` = one open node per level |
| `expandedIds` | `model<ReadonlySet<id>>` | empty | Two-way `[(expandedIds)]`; use it to open nodes initially |
| `itemToggle` | `{ item, expanded }` | | Emitted on each toggle |

`AccordionItem`: `id`, `title`, `subtitle?`, `icon?` (key of `icon-map`), `badge?: { label, intent? }`, `disabled?`, `data?` (your payload), `children?` (recursive).

## Custom content
Optional templates, both receive `$implicit` (the item) and `depth` (0-based):
- `#accordionBody`: rendered inside every node, above its children.
- `#accordionActions`: header buttons. Use `$event.stopPropagation()` is not needed (they sit outside the toggle button).

```html
<app-ui-nested-accordion [items]="tree" [multiple]="false" [(expandedIds)]="open" (itemToggle)="log($event)">
  <ng-template #accordionBody let-item let-depth="depth">
    <app-my-detail [value]="item.data" />
  </ng-template>
  <ng-template #accordionActions let-item>
    <app-ui-button (click)="edit(item)">Editar</app-ui-button>
  </ng-template>
</app-ui-nested-accordion>
```

```ts
tree: AccordionItem<Order>[] = orders.map(o => ({ id: o.id, title: o.code, data: o,
  children: o.lines.map(l => ({ id: `${o.id}-${l.id}`, title: l.name })) }));
```

Demo: `ui-nested-accordion-demo.ts` (4 levels). Accessibility: buttons with `aria-expanded`/`aria-controls`, collapsed content is `inert`, animation respects `prefers-reduced-motion`.
