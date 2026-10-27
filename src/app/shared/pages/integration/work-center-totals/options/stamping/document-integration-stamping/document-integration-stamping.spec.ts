import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IntegrationReferenceSam, WorkCenterDocument } from '../../../../../../../models/integration/order-by-work-center';
import { SkuRecord } from '../../../../../../../models/production/sku-detail';
import { CELL_SELECTED_CLASSES } from '../../production/integration-state';
import { DocumentIntegrationStamping } from './document-integration-stamping';

const record = (id: number, processed: boolean, units: number): SkuRecord =>
  ({ id, recorded_quantity: units, tep_processed: processed }) as unknown as SkuRecord;

const sam = (id: number, records: SkuRecord[], tepProcessed = false): IntegrationReferenceSam =>
  ({
    id,
    reference_code: `REF-${id}`,
    task_people_count: 1,
    machine_type_name: 'Plana',
    sam: 10,
    tasks_per_hour: 5,
    stamped_qty: 0,
    pending_qty: 0,
    tepProcessed,
    records,
  }) as unknown as IntegrationReferenceSam;

function documentWith(
  referenceSams: IntegrationReferenceSam[],
  secondsByUnit: number | null = null,
  additionalSecondsByUnit: number | null = null,
): WorkCenterDocument {
  return {
    seconds_by_unit: secondsByUnit,
    additional_seconds_by_unit: additionalSecondsByUnit,
    detail: { referenceSams },
  } as unknown as WorkCenterDocument;
}

function render(document: WorkCenterDocument) {
  const fixture = TestBed.createComponent(DocumentIntegrationStamping);
  fixture.componentRef.setInput('document', document);
  fixture.detectChanges();
  return fixture;
}

type Fixture = ComponentFixture<DocumentIntegrationStamping>;
const root = (fixture: Fixture) => fixture.nativeElement as HTMLElement;
const cards = (fixture: Fixture) =>
  Array.from(root(fixture).querySelectorAll('[data-testid=sam-card]')) as HTMLButtonElement[];
const chip = (fixture: Fixture) => root(fixture).querySelector('button.rounded-full') as HTMLButtonElement;
const inputs = (fixture: Fixture) =>
  Array.from(root(fixture).querySelectorAll('app-ui-hour-input input')) as HTMLInputElement[];

function click(fixture: Fixture, button: HTMLElement) {
  button.click();
  fixture.detectChanges();
}

// Types into the hours (0) or minutes (1) input like the user would.
function type(fixture: Fixture, index: number, value: string) {
  const input = inputs(fixture)[index];
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

const hasClasses = (button: HTMLElement, classes: string) =>
  classes.split(' ').every((cls) => button.classList.contains(cls));

// 1: integrated, 2: ready, 3: no records, 4: ready (one processed + one pending record)
const sams = () => [
  sam(1, [record(1, true, 10)], true),
  sam(2, [record(2, false, 10)]),
  sam(3, []),
  sam(4, [record(3, true, 5), record(4, false, 20)]),
];

describe('DocumentIntegrationStamping', () => {
  const doc = documentWith(sams());

  it('renders one card per SAM', () => {
    expect(cards(render(doc))).toHaveLength(4);
  });

  it('only enables ready cards and exposes aria-pressed only on them', () => {
    const list = cards(render(doc));

    expect(list.map((card) => card.disabled)).toEqual([true, false, true, false]);
    expect(list[1].getAttribute('aria-pressed')).toBe('false');
    [0, 2].forEach((i) => expect(list[i].hasAttribute('aria-pressed')).toBe(false));
  });

  it('selects and deselects a ready card on click', () => {
    const fixture = render(doc);
    const ready = cards(fixture)[1];

    click(fixture, ready);
    expect(ready.getAttribute('aria-pressed')).toBe('true');
    expect(hasClasses(ready, CELL_SELECTED_CLASSES)).toBe(true);
    expect(fixture.componentInstance.selectedSamIds()).toEqual([2]);

    click(fixture, ready);
    expect(ready.getAttribute('aria-pressed')).toBe('false');
    expect(fixture.componentInstance.selectedSamIds()).toEqual([]);
  });

  it('ignores clicks on disabled cards', () => {
    const fixture = render(doc);
    const list = cards(fixture);

    [0, 2].forEach((i) => click(fixture, list[i]));

    expect(fixture.componentInstance.selectedSamIds()).toEqual([]);
  });

  it('selects every ready SAM with the "Por integrar" chip and clears them on a second click', () => {
    const fixture = render(doc);

    click(fixture, chip(fixture));
    expect(fixture.componentInstance.selectedSamIds()).toEqual([2, 4]);

    click(fixture, chip(fixture));
    expect(fixture.componentInstance.selectedSamIds()).toEqual([]);
  });

  it('counts the SAMs per state in the legend', () => {
    const text = root(render(doc)).textContent ?? '';

    expect(text).toContain('Integrado · 1');
    expect(text).toContain('Por integrar · 2');
    expect(text).toContain('Sin registros · 1');
  });

  it('shows the ordered, stamped and pending quantities of each SAM', () => {
    const withQty = { ...sam(1, [record(1, false, 10)]), stamped_qty: 4185, pending_qty: 7397 } as IntegrationReferenceSam;
    const text = cards(render(documentWith([withQty])))[0].textContent ?? '';

    expect(text).toContain('Ordenadas 11582');
    expect(text).toContain('Estampadas 4185');
    expect(text).toContain('Por hacer 7397');
  });

  it('shows 0 as pending when more than ordered was stamped', () => {
    const over = { ...sam(1, [record(1, false, 10)]), stamped_qty: 5000, pending_qty: -200 } as IntegrationReferenceSam;

    expect(cards(render(documentWith([over])))[0].textContent).toContain('Por hacer 0');
  });

  it('shows an empty message when the reference has no SAM', () => {
    const fixture = render(documentWith([]));

    expect(cards(fixture)).toHaveLength(0);
    expect(root(fixture).textContent).toContain('Sin SAM para esta referencia');
  });

  describe('time of the selection', () => {
    const secondsByUnit = 32.526315;
    const timeDoc = () =>
      documentWith(
        [sam(1, [record(1, true, 99), record(2, false, 530)]), sam(2, [record(3, false, 10)])],
        secondsByUnit,
        0,
      );

    it('shows no time inputs until something is selected', () => {
      expect(inputs(render(timeDoc()))).toHaveLength(0);
    });

    it('preloads pending units x (seconds_by_unit + additional) as HH:MM', () => {
      const fixture = render(timeDoc());

      click(fixture, cards(fixture)[0]); // 530 pending units; the processed record is not counted

      // 530 x 32.526315 s = 17239 s = 287.3 min -> 287 min = 04:47
      expect(inputs(fixture).map((input) => input.value)).toEqual(['04', '47']);
    });

    it('adds additional_seconds_by_unit to seconds_by_unit', () => {
      const fixture = render(documentWith([sam(1, [record(1, false, 10)])], 100, 50));

      click(fixture, cards(fixture)[0]); // 10 x 150 s = 25 min

      expect(inputs(fixture).map((input) => input.value)).toEqual(['00', '25']);
    });

    it('emits units and time of the selection, including manual edits', () => {
      const fixture = render(documentWith([sam(1, [record(1, false, 10)])], 150, 0));
      const summaries: { units: number; hours: number; minutes: number }[] = [];
      fixture.componentInstance.selectionSummary.subscribe((summary) => summaries.push(summary));

      click(fixture, cards(fixture)[0]);
      expect(summaries.at(-1)).toEqual({ units: 10, hours: 0, minutes: 25 });

      type(fixture, 0, '2');
      expect(summaries.at(-1)).toEqual({ units: 10, hours: 2, minutes: 25 });

      click(fixture, cards(fixture)[0]); // deselect
      expect(summaries.at(-1)?.units).toBe(0);
    });
  });
});
