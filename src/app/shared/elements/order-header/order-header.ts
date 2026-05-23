import { Component, computed, input } from '@angular/core';
import { UpperCasePipe } from '@angular/common';
import { ProductionOrder } from '../../../models/production/production-order';

@Component({
  selector: 'app-order-header',
  imports: [UpperCasePipe],
  templateUrl: './order-header.html',
})
export class OrderHeader {
  productionOrder = input<ProductionOrder | null>(null);

  cards = computed(() => {
    const doc = this.productionOrder();
    if (!doc) return [];
    return [
      { title: 'OP', data: `${doc.documentType} ${doc.documentNumber}` },
      { title: 'Referencia', data: doc.reference },
      { title: 'Tipo de Confección', data: doc.classification.manufacture },
      { title: 'Tipo de Estampación', data: doc.classification.print },
      { title: 'Marca/Línea', data: `${doc.classification.brand}/${doc.classification.line}` },
      { title: 'Clasifi. Comercial', data: doc.classification.commercial },
    ];
  });
}
