import { TestBed } from '@angular/core/testing';
import { WorkCenterDocument } from '../../../../../../../models/integration/order-by-work-center';
import { SkuDetail, SkuRecord } from '../../../../../../../models/production/sku-detail';
import { DocumentIntegrationColors } from './document-integration-colors';

const record = (id: number, processed: boolean, units = 10): SkuRecord => ({
  id,
  ordered_quantity: 10,
  planned_quantity: 10,
  completed_quantity: units,
  scrap_quantity: 0,
  rejected_quantity: 0,
  recorded_quantity: units,
  tep_submission_id: processed ? 99 : null,
  tep_processed: processed,
});

const sku = (size: string, skuRowId: number, extra: Partial<SkuDetail> = {}): SkuDetail => ({
  size,
  skuRowId,
  orderedQty: 10,
  plannedQty: 10,
  completedQty: 10,
  wasteQty: 0,
  rejectedQty: 0,
  ...extra,
});

const totals = { orderedQty: 0, plannedQty: 0, completedQty: 0, wasteQty: 0, rejectedQty: 0 };

function documentWith(colors: Record<string, SkuDetail[]>): WorkCenterDocument {
  const colorRows = Object.entries(colors).map(([color, skus]) => ({ color, totals, skus }));
  return { detail: { colorRows } } as unknown as WorkCenterDocument;
}

function render(document: WorkCenterDocument) {
  const fixture = TestBed.createComponent(DocumentIntegrationColors);
  fixture.componentRef.setInput('document', document);
  fixture.detectChanges();
  return fixture;
}

const text = (element: Element | null) => (element?.textContent ?? '').replace(/\s+/g, ' ').trim();

describe('DocumentIntegrationColors', () => {
  // AZUL: S integrated (10), M pending (7) + integrated (3 of 10 -> missing 0 after 3+7).
  // ROJO: L integrated (10), XL no records (missing 10).
  const doc = documentWith({
    ROJO: [
      sku('L', 3, { tepProcessed: true, records: [record(4, true)] }),
      sku('XL', 4, { tepProcessed: false, records: [], completedQty: 0 }),
    ],
    AZUL: [
      sku('S', 1, { tepProcessed: true, records: [record(1, true)] }),
      sku('M', 2, { tepProcessed: false, records: [record(2, true, 3), record(3, false, 5)] }),
      sku('EMPTY', 0, { tepProcessed: false }), // placeholder cell, ignored
    ],
  });

  it('sums integrated, pending and missing units per color, sorted by color', () => {
    const cards = Array.from(render(doc).nativeElement.querySelectorAll('[data-testid=color-card]'));

    expect(cards.length).toBe(2);
    expect(text(cards[0] as Element)).toContain('AZUL');
    expect(text((cards[0] as Element).querySelector('[data-testid=color-numbers]'))).toBe(
      'Integrado 13 · Por integrar 5 · Falta 2',
    );
    expect(text((cards[1] as Element).querySelector('[data-testid=color-numbers]'))).toBe(
      'Integrado 10 · Por integrar 0 · Falta 10',
    );
  });

  it('sizes the stacked bar segments as a share of the ordered units', () => {
    const card = render(doc).nativeElement.querySelector('[data-testid=color-card]') as Element;
    const [integrated, pending, missing] = Array.from(
      card.querySelectorAll('[data-testid=color-bar] > div'),
    ) as HTMLElement[];

    expect(integrated.style.width).toBe('65%'); // 13 / 20
    expect(pending.style.width).toBe('25%'); // 5 / 20
    expect(missing.style.width).toBe('10%'); // 2 / 20
    expect(integrated.className).toContain('bg-green-500');
    expect(pending.className).toContain('bg-amber-400');
    expect(missing.className).toContain('bg-slate-300');
  });

  it('shows the state chip of each color', () => {
    const chips = Array.from(
      render(doc).nativeElement.querySelectorAll('[data-testid=color-chip]'),
    ) as HTMLElement[];

    expect(text(chips[0])).toBe('Por integrar'); // AZUL has a pending SKU
    expect(chips[0].className).toContain('bg-amber-100');
    expect(text(chips[1])).toBe('Sin registros'); // ROJO: one integrated, one without records
  });

  it('marks a color as integrated when every SKU is integrated', () => {
    const element = render(
      documentWith({ VERDE: [sku('S', 1, { tepProcessed: true, records: [record(1, true)] })] }),
    ).nativeElement as HTMLElement;

    expect(text(element.querySelector('[data-testid=color-chip]'))).toBe('Integrado');
  });

  it('computes the OP-level totals and the integrated percentage', () => {
    const element = render(doc).nativeElement as HTMLElement;

    expect(text(element.querySelector('[data-testid=summary-numbers]'))).toContain(
      'Integrado 23 · Por integrar 5 · Falta 12 de 40 ordenadas',
    );
    expect(text(element.querySelector('[data-testid=summary-percent]'))).toMatch(/^5[78]% integrado$/); // 57.5% (rounding at the half)
  });

  it('expands a card to list its pending SKUs, or a note when all is integrated', () => {
    const fixture = render(
      documentWith({
        AZUL: [sku('M', 2, { tepProcessed: false, records: [record(3, false, 7)] })],
        VERDE: [sku('S', 1, { tepProcessed: true, records: [record(1, true)] })],
      }),
    );
    const element = fixture.nativeElement as HTMLElement;
    const buttons = Array.from(element.querySelectorAll('button')) as HTMLButtonElement[];

    expect(buttons[0].getAttribute('aria-expanded')).toBe('false');
    expect(element.querySelector('[data-testid=color-detail]')).toBeNull();

    buttons[0].click();
    buttons[1].click();
    fixture.detectChanges();

    const details = Array.from(element.querySelectorAll('[data-testid=color-detail]'));
    expect(buttons[0].getAttribute('aria-expanded')).toBe('true');
    expect(text(details[0])).toContain('Talla M · 7 und');
    expect(text(details[0])).toContain('Registros: 3');
    expect(text(details[1])).toBe('Todo integrado');
  });

  it('shows only a hint when the API sent no TEP data', () => {
    const element = render(documentWith({ AZUL: [sku('S', 1), sku('M', 2)] }))
      .nativeElement as HTMLElement;

    expect(text(element)).toContain('Ejecuta fn_color_rows_produccion_op');
    expect(element.querySelector('[data-testid=color-card]')).toBeNull();
  });

  it('does not divide by zero when nothing was ordered', () => {
    const element = render(
      documentWith({ AZUL: [sku('S', 1, { orderedQty: 0, tepProcessed: false, records: [] })] }),
    ).nativeElement as HTMLElement;

    expect(text(element.querySelector('[data-testid=summary-percent]'))).toBe('0% integrado');
  });
});
