import { Component, signal } from '@angular/core';
import { AccordionItem, UiNestedAccordion } from './ui-nested-accordion';

// Demo with 4 levels: plant > area > line > station. Register under a menu url to preview it.
@Component({
  selector: 'app-ui-nested-accordion-demo',
  imports: [UiNestedAccordion],
  template: `
    <div class="p-4 max-w-3xl flex flex-col gap-4">
      <label class="flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" [checked]="multiple()" (change)="multiple.set(!multiple())" />
        Permitir varios abiertos
      </label>
      <app-ui-nested-accordion [items]="items" [multiple]="multiple()">
        <ng-template #accordionBody let-item let-depth="depth">
          @if (!item.children) {
            <p class="text-gray-600">Contenido personalizado de «{{ item.title }}» (nivel {{ depth + 1 }}).</p>
          }
        </ng-template>
        <ng-template #accordionActions let-item>
          <button type="button" class="text-xs text-brand hover:underline cursor-pointer"
            (click)="$event.preventDefault()">Ver</button>
        </ng-template>
      </app-ui-nested-accordion>
    </div>
  `,
})
export class UiNestedAccordionDemo {
  protected readonly multiple = signal(true);
  protected readonly items: AccordionItem[] = [
    {
      id: 'p1', title: 'Planta Norte', subtitle: '2 áreas', badge: { label: 'Activa', intent: 'active' },
      children: [
        {
          id: 'a1', title: 'Confección', subtitle: '2 líneas',
          children: [
            { id: 'l1', title: 'Línea 1', badge: { label: 'Pausada', intent: 'paused' },
              children: [{ id: 's1', title: 'Estación 1' }, { id: 's2', title: 'Estación 2' }] },
            { id: 'l2', title: 'Línea 2', children: [{ id: 's3', title: 'Estación 3' }] },
          ],
        },
        { id: 'a2', title: 'Estampación', children: [{ id: 'l3', title: 'Línea 3', disabled: true }] },
      ],
    },
    { id: 'p2', title: 'Planta Sur', badge: { label: 'Inactiva', intent: 'inactive' }, children: [{ id: 'a3', title: 'Corte' }] },
  ];
}
