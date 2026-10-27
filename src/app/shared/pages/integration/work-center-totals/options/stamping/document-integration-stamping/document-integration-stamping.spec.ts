import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkCenterDocument } from '../../../../../../../models/integration/order-by-work-center';
import { SkuRecord } from '../../../../../../../models/production/sku-detail';
import { CELL_SELECTED_CLASSES } from '../../production/integration-state';
import { DocumentIntegrationStamping } from './document-integration-stamping';

const record = (id: number, processed: boolean, units = 10): SkuRecord =>
  ({ id, recorded_quantity: units, tep_processed: processed }) as unknown as SkuRecord;

const sam = (id: number, records: SkuRecord[], tepProcessed?: boolean) => ({ id, records, tepProcessed });

const totals = { stamped_qty: 3610, pending_qty: 2181, total_qty: 5791 };

function documentWith(
  referenceSams: unknown[],
  options: {
    totals?: unknown;
    factor?: number | null;
    secondsByUnit?: number | null;
    additionalSecondsByUnit?: number | null;
  } = {},
): WorkCenterDocument {
  return {
    seconds_by_unit: options.secondsByUnit ?? null,
    additional_seconds_by_unit: options.additionalSecondsByUnit ?? null,
    detail: {
      referenceSams,
      stamping_factor: options.factor === undefined ? 3 : options.factor,
      totals: options.totals === undefined ? totals : options.totals,
    },
  } as unknown as WorkCenterDocument;
}

// PS 12204: two SAMs (41 and 42) with pending records.
const readyDoc = (secondsByUnit: number | null = null, additional: number | null = null) =>
  documentWith([sam(41, [record(1, false, 10)], false), sam(42, [record(2, false, 5)], false)], {
    secondsByUnit,
    additionalSecondsByUnit: additional,
  });

function render(document: WorkCenterDocument) {
  const fixture = TestBed.createComponent(DocumentIntegrationStamping);
  fixture.componentRef.setInput('document', document);
  fixture.detectChanges();
  return fixture;
}

const el = (fixture: ComponentFixture<DocumentIntegrationStamping>) => fixture.nativeElement as HTMLElement;
const block = (fixture: ComponentFixture<DocumentIntegrationStamping>) =>
  el(fixture).querySelector('[data-testid=stamping-op]') as HTMLButtonElement | null;
const stat = (fixture: ComponentFixture<DocumentIntegrationStamping>, name: 'stamped' | 'pending' | 'total') =>
  (el(fixture).querySelector(`[data-testid=stat-${name}]`)?.textContent ?? '').replace(/\s+/g, ' ').trim();
const piecesText = (fixture: ComponentFixture<DocumentIntegrationStamping>) =>
  (el(fixture).querySelector('[data-testid=stamping-pieces]')?.textContent ?? '').replace(/\s+/g, ' ').trim();
const progressWidth = (fixture: ComponentFixture<DocumentIntegrationStamping>) =>
  (el(fixture).querySelector('[data-testid=stamping-progress]') as HTMLElement | null)?.style.width;
const inputs = (fixture: ComponentFixture<DocumentIntegrationStamping>) =>
  Array.from(el(fixture).querySelectorAll('app-ui-hour-input input')) as HTMLInputElement[];

function click(fixture: ComponentFixture<DocumentIntegrationStamping>) {
  block(fixture)!.click();
  fixture.detectChanges();
}

// Types into the hours (0) or minutes (1) input like the user would.
function type(fixture: ComponentFixture<DocumentIntegrationStamping>, index: number, value: string) {
  const input = inputs(fixture)[index];
  input.value = value;
  input.dispatchEvent(new Event('input'));
  fixture.detectChanges();
}

const hasClasses = (target: HTMLElement, classes: string) =>
  classes.split(' ').every((cls) => target.classList.contains(cls));

describe('DocumentIntegrationStamping', () => {
  describe('OP block and totals', () => {
    it('renders a single block with state, factor and totals', () => {
      const fixture = render(readyDoc());

      expect(el(fixture).querySelectorAll('[data-testid=stamping-op]')).toHaveLength(1);
      const text = block(fixture)!.textContent!.replace(/\s+/g, ' ');
      expect(text).toContain('Por integrar');
      expect(piecesText(fixture)).toBe('3 piezas estampadas');
      expect(stat(fixture, 'stamped')).toBe('Estampadas3,610');
      expect(stat(fixture, 'pending')).toBe('Por hacer2,181');
      expect(stat(fixture, 'total')).toBe('Total5,791');
      expect(text).toContain('Por integrar 15 und');
    });

    it('never shows a negative "Por hacer"', () => {
      const fixture = render(
        documentWith([sam(41, [record(1, false)], false)], {
          totals: { stamped_qty: 6000, pending_qty: -208.5, total_qty: 5791 },
        }),
      );

      expect(stat(fixture, 'pending')).toBe('Por hacer0');
      expect(stat(fixture, 'pending')).not.toContain('-');
    });

    it('writes the stamping factor as "pieza estampada" in singular when it is 1', () => {
      const fixture = render(
        documentWith([sam(41, [record(1, false)], false)], {
          factor: 1,
          totals: { stamped_qty: 100, pending_qty: 100, total_qty: 200 },
        }),
      );

      expect(piecesText(fixture)).toBe('1 pieza estampada');
    });

    it('shows the stamped share of the total as a progress bar', () => {
      const fixture = render(readyDoc()); // 3610 of 5791 stamped

      expect(progressWidth(fixture)).toMatch(/^62\.3/);
      expect(el(fixture).querySelector('[role=progressbar]')?.getAttribute('aria-valuenow')).toMatch(/^62\.3/);
      expect(el(fixture).textContent).toContain('62%');
    });

    it('caps the progress at 100% when more than the total was stamped', () => {
      const fixture = render(
        documentWith([sam(41, [record(1, false)], false)], {
          totals: { stamped_qty: 6000, pending_qty: -209, total_qty: 5791 },
        }),
      );

      expect(progressWidth(fixture)).toBe('100%');
    });

    it('shows "Sin factor de estampado" when there are no totals', () => {
      const fixture = render(documentWith([sam(41, [record(1, false)], false)], { totals: null, factor: null }));

      expect(el(fixture).querySelector('[data-testid=stamping-totals]')).toBeNull();
      expect(block(fixture)!.textContent).toContain('Sin factor de estampado');
      expect(el(fixture).querySelector('[data-testid=stamping-pieces]')).toBeNull();
    });

    it('shows the empty message when there are no SAMs', () => {
      const fixture = render(documentWith([]));

      expect(block(fixture)).toBeNull();
      expect(el(fixture).textContent).toContain('Sin registros de estampación');
    });
  });

  describe('selection', () => {
    it('selects every ready SAM id on click and clears it on the second click', () => {
      const fixture = render(readyDoc());

      click(fixture);
      expect(fixture.componentInstance.selectedSamIds()).toEqual([41, 42]);
      expect(block(fixture)!.getAttribute('aria-pressed')).toBe('true');
      expect(hasClasses(block(fixture)!, CELL_SELECTED_CLASSES)).toBe(true);

      click(fixture);
      expect(fixture.componentInstance.selectedSamIds()).toEqual([]);
      expect(block(fixture)!.getAttribute('aria-pressed')).toBe('false');
      expect(hasClasses(block(fixture)!, CELL_SELECTED_CLASSES)).toBe(false);
    });

    it('only selects the ready SAMs when others are integrated or empty', () => {
      const fixture = render(
        documentWith([sam(41, [record(1, true)], true), sam(42, [record(2, false)], false), sam(43, [])]),
      );

      click(fixture);

      expect(fixture.componentInstance.selectedSamIds()).toEqual([42]);
    });

    it('is disabled with no aria-pressed when everything is integrated', () => {
      const fixture = render(documentWith([sam(41, [record(1, true)], true), sam(42, [record(2, true)], true)]));

      expect(block(fixture)!.disabled).toBe(true);
      expect(block(fixture)!.hasAttribute('aria-pressed')).toBe(false);
      expect(block(fixture)!.textContent).toContain('Integrado');
      click(fixture);
      expect(fixture.componentInstance.selectedSamIds()).toEqual([]);
    });

    it('is disabled when nothing was recorded', () => {
      const fixture = render(documentWith([sam(41, []), sam(42, [])]));

      expect(block(fixture)!.disabled).toBe(true);
      expect(block(fixture)!.hasAttribute('aria-pressed')).toBe(false);
      expect(block(fixture)!.textContent).toContain('Sin registros');
    });
  });

  describe('time inputs', () => {
    it('shows no time inputs until the OP is selected', () => {
      expect(inputs(render(readyDoc(150)))).toHaveLength(0);
    });

    it('preloads (pending units) x (seconds + additional seconds) rounded to minutes', () => {
      // 15 und x (150 + 30) s = 2700 s = 45 min -> 00:45
      const fixture = render(readyDoc(150, 30));
      click(fixture);

      expect(inputs(fixture).map((input) => input.value)).toEqual(['00', '45']);
    });

    it('rounds to the nearest minute and carries minutes into hours', () => {
      // 15 und x 290 s = 4350 s = 72.5 min -> 73 min -> 01:13
      const fixture = render(readyDoc(290));
      click(fixture);

      expect(inputs(fixture).map((input) => input.value)).toEqual(['01', '13']);
    });

    it('ignores the pending units of already integrated records', () => {
      // only the 5 pending units count: 5 x 600 s = 50 min
      const fixture = render(documentWith([sam(41, [record(1, true, 100), record(2, false, 5)], false)], { secondsByUnit: 600 }));
      click(fixture);

      expect(inputs(fixture).map((input) => input.value)).toEqual(['00', '50']);
    });
  });

  describe('selectionSummary', () => {
    it('emits units and time on select and after typing by hand', () => {
      const fixture = render(readyDoc(120)); // 15 und x 120 s = 30 min
      const summaries: { units: number; hours: number; minutes: number }[] = [];
      fixture.componentInstance.selectionSummary.subscribe((summary) => summaries.push(summary));

      click(fixture);
      expect(summaries.at(-1)).toEqual({ units: 15, hours: 0, minutes: 30 });

      type(fixture, 0, '2');
      expect(summaries.at(-1)).toEqual({ units: 15, hours: 2, minutes: 30 });

      type(fixture, 1, '15');
      expect(summaries.at(-1)).toEqual({ units: 15, hours: 2, minutes: 15 });
    });
  });
});
