import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { OrdersByWorkCenterService } from '../../../../services/integration/orders-by-work-center-service';
import { OpSkuIntegration } from './op-sku-integration';

const totals = { orderedQty: 20, plannedQty: 20, completedQty: 10, wasteQty: 0, rejectedQty: 0 };
const sku = (size: string, skuRowId: number, tepProcessed: boolean) => ({
  size,
  skuRowId,
  orderedQty: 10,
  plannedQty: 10,
  completedQty: 10,
  wasteQty: 0,
  rejectedQty: 0,
  tepProcessed,
  records: [{ id: skuRowId, recorded_quantity: 10, tep_submission_id: tepProcessed ? 9 : null, tep_processed: tepProcessed }],
});

const response = {
  results: [
    { code: 'OTRO', documents: [{ op_rowid: 5, detail: null }] },
    {
      code: 'CT01 ',
      documents: [
        { op_rowid: 4, detail: null },
        { op_rowid: 5, detail: { colorRows: [{ color: 'AZUL', totals, skus: [sku('S', 1, true), sku('M', 2, false)] }] } },
      ],
    },
  ],
};

function render(originId: number, getAll = vi.fn(() => of(response))) {
  TestBed.configureTestingModule({ providers: [{ provide: OrdersByWorkCenterService, useValue: { getAll } }] });
  const fixture = TestBed.createComponent(OpSkuIntegration);
  fixture.componentRef.setInput('opRowid', 5);
  fixture.componentRef.setInput('originId', originId);
  fixture.componentRef.setInput('workCenterCode', 'CT01');
  fixture.detectChanges();
  return { element: fixture.nativeElement as HTMLElement, getAll };
}

describe('OpSkuIntegration', () => {
  it('requests by op_rowid and shows integrated vs pending SKUs of the matching work center and OP', () => {
    const { element, getAll } = render(1);

    expect(getAll).toHaveBeenCalledWith({ op_rowid: 5 });
    const text = element.textContent ?? '';
    expect(text).toContain('Integrado · 1');
    expect(text).toContain('Por integrar · 1');
    const cells = element.querySelectorAll('tbody td button');
    expect(cells[0].className).toContain('bg-green-100'); // integrated
    expect(cells[1].className).toContain('bg-brand-100'); // ready to integrate
  });

  it('does not request anything for origins without SKU detail', () => {
    const { element, getAll } = render(2);

    expect(getAll).not.toHaveBeenCalled();
    expect(element.textContent).toContain('Sin detalle por SKU');
  });
});
