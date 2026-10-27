import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkCenterDocument } from '../../../../../../../models/integration/order-by-work-center';
import { SkuDetail, SkuRecord } from '../../../../../../../models/production/sku-detail';
import { CELL_SELECTED_CLASSES, CELL_STATE_CLASSES } from '../integration-state';
import { DocumentIntegrationMatrix } from './document-integration-matrix';

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

const totals = { orderedQty: 30, plannedQty: 30, completedQty: 20, wasteQty: 0, rejectedQty: 0 };

function documentWith(skus: SkuDetail[]): WorkCenterDocument {
  return { detail: { colorRows: [{ color: 'AZUL', totals, skus }] } } as unknown as WorkCenterDocument;
}

function render(document: WorkCenterDocument) {
  const fixture = TestBed.createComponent(DocumentIntegrationMatrix);
  fixture.componentRef.setInput('document', document);
  fixture.detectChanges();
  return fixture;
}

const cellButtons = (fixture: ComponentFixture<DocumentIntegrationMatrix>) =>
  Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll('tbody td button'),
  ) as HTMLButtonElement[];

function click(fixture: ComponentFixture<DocumentIntegrationMatrix>, button: HTMLElement) {
  button.click();
  fixture.detectChanges();
}

// One SKU per state: S integrated, M ready, L open, XL partial, XXL none.
const sizes = () => [
  sku('S', 1, { tepProcessed: true }),
  sku('M', 2, { tepProcessed: false }),
  sku('L', 3, { completedQty: 4, hasOpenRecords: true }),
  sku('XL', 4, { completedQty: 4 }),
  sku('XXL', 5, { completedQty: 0 }),
];

const hasClasses = (button: HTMLElement, classes: string) =>
  classes.split(' ').every((cls) => button.classList.contains(cls));

describe('DocumentIntegrationMatrix', () => {
  const doc = documentWith(sizes());

  it('applies the classes of each of the 5 cell states', () => {
    const cells = cellButtons(render(doc));

    expect(cells[0].className).toContain('bg-green-100'); // integrated
    expect(hasClasses(cells[1], CELL_STATE_CLASSES.ready)).toBe(true); // ready
    expect(cells[1].className).toContain('bg-brand-100');
    expect(cells[2].className).toContain('bg-gray-200'); // open
    expect(cells[3].className).toContain('bg-red-100'); // partial
    expect(hasClasses(cells[4], CELL_STATE_CLASSES.none)).toBe(true); // none: 'label' intent
  });

  it('only enables the ready cell and exposes aria-pressed only on it', () => {
    const cells = cellButtons(render(doc));

    expect(cells.map((cell) => cell.disabled)).toEqual([true, false, true, true, true]);
    expect(cells[1].getAttribute('aria-pressed')).toBe('false');
    [0, 2, 3, 4].forEach((i) => expect(cells[i].hasAttribute('aria-pressed')).toBe(false));
  });

  it('selects and deselects a ready cell on click', () => {
    const fixture = render(doc);
    const ready = cellButtons(fixture)[1];

    click(fixture, ready);
    expect(ready.getAttribute('aria-pressed')).toBe('true');
    expect(hasClasses(ready, CELL_SELECTED_CLASSES)).toBe(true);
    expect(ready.className).not.toContain('bg-brand-100');
    expect(fixture.componentInstance.selectedSkuIds()).toEqual([2]);

    click(fixture, ready);
    expect(ready.getAttribute('aria-pressed')).toBe('false');
    expect(ready.className).toContain('bg-brand-100');
    expect(fixture.componentInstance.selectedSkuIds()).toEqual([]);
  });

  it('ignores clicks on non-ready (disabled) cells', () => {
    const fixture = render(doc);
    const cells = cellButtons(fixture);

    [0, 2, 3, 4].forEach((i) => click(fixture, cells[i]));

    expect(fixture.componentInstance.selectedSkuIds()).toEqual([]);
    expect(cells[0].className).not.toContain('bg-brand-500');
  });

  it('allows several ready cells to be selected at once', () => {
    const fixture = render(documentWith([sku('S', 1, { tepProcessed: false }), sku('M', 2, { tepProcessed: false })]));
    const cells = cellButtons(fixture);

    click(fixture, cells[0]);
    click(fixture, cells[1]);

    expect(fixture.componentInstance.selectedSkuIds()).toEqual([1, 2]);
  });

  it('selects every ready cell when the "Por integrar" legend chip is clicked, and clears them on a second click', () => {
    const fixture = render(
      documentWith([
        sku('S', 1, { tepProcessed: true }),
        sku('M', 2, { tepProcessed: false }),
        sku('L', 3, { tepProcessed: false }),
        sku('XL', 4, { completedQty: 4 }),
      ]),
    );
    const chip = (fixture.nativeElement as HTMLElement).querySelector('button.rounded-full') as HTMLButtonElement;
    const cells = cellButtons(fixture);

    click(fixture, chip);
    expect(fixture.componentInstance.selectedSkuIds()).toEqual([2, 3]);
    expect(cells[1].getAttribute('aria-pressed')).toBe('true');
    expect(cells[2].getAttribute('aria-pressed')).toBe('true');

    click(fixture, chip);
    expect(fixture.componentInstance.selectedSkuIds()).toEqual([]);
  });

  it('completes the selection when only some ready cells were picked', () => {
    const fixture = render(documentWith([sku('S', 1, { tepProcessed: false }), sku('M', 2, { tepProcessed: false })]));
    const chip = (fixture.nativeElement as HTMLElement).querySelector('button.rounded-full') as HTMLButtonElement;

    click(fixture, cellButtons(fixture)[0]);
    click(fixture, chip);

    expect(fixture.componentInstance.selectedSkuIds()).toEqual([1, 2]);
  });

  it('counts the SKUs per state in the legend', () => {
    const text = (render(doc).nativeElement as HTMLElement).textContent ?? '';

    expect(text).toContain('Integrado · 1');
    expect(text).toContain('Por integrar · 1');
    expect(text).not.toContain('Registros abiertos'); // open and complete are not part of the legend
    expect(text).not.toContain('Completo');
    expect(text).toContain('Parcial · 1');
    expect(text).toContain('Sin producción · 1');
  });

  it('shows produced quantity first and ordered quantity second in the corners', () => {
    const [first] = cellButtons(
      render(documentWith([sku('S', 1, { completedQty: 6, rejectedQty: 1, wasteQty: 2 })])),
    );
    const spans = first.querySelectorAll('span');

    expect(spans[0].textContent?.trim()).toBe('9'); // produced = completed + rejected + waste
    expect(spans[1].textContent?.trim()).toBe('10'); // ordered
  });
});
