import { Component, computed, input } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { ProductionOrder } from '../../../../../models/production/production-order';
import { UiIcon } from '../../../../elements/ui-icon/ui-icon';

@Component({
  selector: 'app-order-header',
  imports: [UpperCasePipe, UiIcon],
  templateUrl: './order-header.html',
})
export class OrderHeader {
  productionOrder = input<ProductionOrder | null>(null);
  mobileAccordion = input(false);
  // Extra title/data pairs appended after the base OP fields — lets callers
  // surface page-specific data (e.g. stamping pieces in Auditoría) without
  // coupling this shared component to their domain.
  extraCards = input<{ title: string; data: string }[]>([]);

  cards = computed(() => {
    const doc = this.productionOrder();
    if (!doc) return [];
    return [
      { title: 'OP', data: `${doc.documentType} ${doc.documentNumber}` },
      { title: 'Referencia', data: doc.reference ?? '' },
      { title: 'Tipo de Confección', data: doc.classification?.manufacture ?? '' },
      { title: 'Tipo de Estampación', data: doc.classification?.print ?? '' },
      { title: 'Marca/Línea', data: `${doc.classification?.brand ?? ''}/${doc.classification?.line ?? ''}` },
      { title: 'Clasifi. Comercial', data: doc.classification?.commercial ?? '' },
      ...this.extraCards(),
    ];
  });

  restCards = computed(() => this.cards().slice(1));
}
