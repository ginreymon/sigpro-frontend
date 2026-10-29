import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { TableColumn } from '../../../../common/interfaces/table-column';
import { TableRow } from '../../../../common/interfaces/table-row';
import { PaginatedResponse } from '../../../../common/interfaces/paginated-response';
import { DataTable } from './data-table';

interface Item {
  name: string;
  qty: number;
  eff: number;
}

const COLUMNS: TableColumn<Item>[] = [
  { field: 'name', label: 'Nombre' },
  { field: 'qty', label: 'Cantidad', align: 'right', footerFormat: '1.0-0' },
  { field: 'eff', label: 'Eficiencia', align: 'right', footerFormat: '1.2-2', footerSuffix: '%' },
];

const ROWS: TableRow<Item>[] = [
  { selected: false, obj: { name: 'Alfa', qty: 10, eff: 80 } },
  { selected: false, obj: { name: 'Beta', qty: 20, eff: 90 } },
  { selected: false, obj: { name: 'Gamma', qty: 30, eff: 70 } },
];

type Inputs = Partial<{
  data: TableRow<Item>[];
  columns: TableColumn<Item>[];
  footer: Item[];
  footerLabel: string;
  summaryRow: Partial<Item> | null;
  summaryLabel: string;
  clientFilter: boolean;
  showPager: boolean;
  paginatedResponse: PaginatedResponse<Item>;
}>;

function render(inputs: Inputs = {}) {
  const fixture = TestBed.createComponent(DataTable<Item>);
  const all: Inputs = { data: ROWS, columns: COLUMNS, ...inputs };
  for (const [key, value] of Object.entries(all)) fixture.componentRef.setInput(key, value);
  fixture.detectChanges();
  return { fixture, el: fixture.nativeElement as HTMLElement };
}

// Desktop table only: the mobile accordion is covered by its own tests below.
const bodyRows = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>('table tbody tr'));
const footRows = (el: HTMLElement) => Array.from(el.querySelectorAll<HTMLElement>('table tfoot tr'));
const cells = (tr: HTMLElement) => Array.from(tr.querySelectorAll('td')).map(td => td.textContent?.replace(/\s+/g, ' ').trim());

describe('DataTable normal mode', () => {
  it('renders one row per record and no special row by default', () => {
    const { el } = render();
    expect(bodyRows(el)).toHaveLength(3);
    expect(el.querySelector('[data-summary-row]')).toBeNull();
    expect(footRows(el)).toHaveLength(0);
  });

  it('renders the footer with label and formatted values', () => {
    const { el } = render({ footer: [{ name: 'x', qty: 1234, eff: 85.5 }], footerLabel: 'TOTALES' });
    const [row] = footRows(el);
    expect(cells(row)).toEqual(['TOTALES', 'x', '1,234', '85.50%']);
    expect(row.classList.contains('bg-gray-50')).toBe(true);
    expect(row.classList.contains('font-semibold')).toBe(true);
    expect(row.classList.contains('text-gray-700')).toBe(true);
    expect(row.querySelectorAll('td')[2].className).toContain('text-right');
  });
});

describe('DataTable special first row', () => {
  const SUMMARY: Partial<Item> = { qty: 60, eff: 80 };

  it('renders the summary row first, above the records, with label and formats', () => {
    const { el } = render({ summaryRow: SUMMARY, summaryLabel: 'Total' });
    const rows = bodyRows(el);
    expect(rows).toHaveLength(4);
    expect(rows[0].hasAttribute('data-summary-row')).toBe(true);
    expect(cells(rows[0])).toEqual(['Total', '', '60', '80.00%']);
    expect(cells(rows[1])[1]).toBe('Alfa');
    expect(rows[0].classList.contains('bg-brand-50')).toBe(true);
  });

  it('keeps the column alignment of the data rows', () => {
    const { el } = render({ summaryRow: SUMMARY });
    const [summary, first] = bodyRows(el);
    const align = (tr: HTMLElement) => Array.from(tr.querySelectorAll('td')).map(td => td.className.match(/text-(left|right|center)/)?.[0]);
    expect(align(summary)).toEqual(align(first));
  });

  it('uses TOTAL as the default label', () => {
    const { el } = render({ summaryRow: SUMMARY });
    expect(cells(bodyRows(el)[0])[0]).toBe('TOTAL');
  });

  it('is not counted in the index numbering of the records', () => {
    const { el } = render({ summaryRow: SUMMARY });
    expect(cells(bodyRows(el)[1])[0]).toBe('1');
    expect(cells(bodyRows(el)[3])[0]).toBe('3');
  });

  it('renders absent values as empty cells', () => {
    const { el } = render({ summaryRow: { qty: 5 } });
    expect(cells(bodyRows(el)[0])).toEqual(['TOTAL', '', '5', '']);
  });

  it('works with an empty table: summary row plus the empty state', () => {
    const { el } = render({ data: [], summaryRow: SUMMARY });
    expect(bodyRows(el)[0].hasAttribute('data-summary-row')).toBe(true);
    expect(el.textContent).toContain('No hay registros para mostrar');
  });

  it('works alongside the footer without affecting it', () => {
    const { el } = render({ summaryRow: SUMMARY, footer: [{ name: 'x', qty: 1, eff: 1 }] });
    expect(footRows(el)).toHaveLength(1);
    expect(footRows(el)[0].hasAttribute('data-summary-row')).toBe(false);
  });

  it('renders the mobile summary accordion first and flagged', () => {
    const { el } = render({ summaryRow: SUMMARY, summaryLabel: 'Total' });
    const details = Array.from(el.querySelectorAll('details'));
    expect(details).toHaveLength(4);
    expect(details[0].hasAttribute('data-summary-row')).toBe(true);
    expect(details[0].textContent).toContain('Total');
    expect(details[1].hasAttribute('data-summary-row')).toBe(false);
  });

  it('renders absent values as empty in the mobile summary too (no stray suffix)', () => {
    const { el } = render({ summaryRow: { qty: 5 } });
    const summary = el.querySelector('details[data-summary-row]') as HTMLElement;
    expect(summary.textContent).not.toContain('%');
  });

  it('keeps the footer mobile accordion open and with its original look', () => {
    const { el } = render({ footer: [{ name: 'x', qty: 1, eff: 2 }], footerLabel: 'TOTALES' });
    const details = Array.from(el.querySelectorAll('details')).at(-1) as HTMLElement;
    expect(details.hasAttribute('open')).toBe(true);
    expect(details.hasAttribute('data-summary-row')).toBe(false);
    expect(details.querySelector('summary')?.classList.contains('hover:bg-gray-50')).toBe(true);
    expect(details.querySelector('summary + div')?.classList.contains('bg-gray-50')).toBe(true);
  });

  it('does not render any summary markup when disabled', () => {
    const { el } = render({ summaryRow: null });
    expect(el.querySelector('[data-summary-row]')).toBeNull();
  });

  it('filters act only on the records and keep the summary row', () => {
    const { fixture, el } = render({ summaryRow: SUMMARY, clientFilter: true });
    fixture.componentInstance.searchHandler('alfa');
    fixture.detectChanges();
    const rows = bodyRows(el);
    expect(rows).toHaveLength(2);
    expect(rows[0].hasAttribute('data-summary-row')).toBe(true);
    expect(cells(rows[1])[1]).toBe('Alfa');
  });

  it('filtering to no records empties the data but leaves the summary input intact', () => {
    const { fixture } = render({ summaryRow: SUMMARY, clientFilter: true });
    fixture.componentInstance.searchHandler('zzz');
    // Rendering the no-match empty state raises NG0100 in this test environment even without
    // a summary row (existing icon in the empty state), so the check is made on state.
    expect(fixture.componentInstance['_data']).toHaveLength(0);
    expect(fixture.componentInstance.summaryRow).toEqual(SUMMARY);
  });

  it('does not alter pagination: totals and index offset come from the paginated response', () => {
    const response: PaginatedResponse<Item> = {
      count: 45,
      params: { limit: 3, offset: 6 },
      results: ROWS.map(r => r.obj),
    } as PaginatedResponse<Item>;
    const { fixture, el } = render({ data: undefined, paginatedResponse: response, summaryRow: SUMMARY });
    expect(fixture.componentInstance['totalItems']).toBe(45);
    expect(cells(bodyRows(el)[1])[0]).toBe('7');
  });
});
