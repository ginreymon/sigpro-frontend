import { TableRow } from '../../../../common/interfaces/table-row';

export class TableFilterState<T> {
  private activeFilters = new Map<string, Set<any>>();
  private currentSearchTerm = '';
  private formatters = new Map<string, (value: any) => string>();

  isFilterActive(field: string): boolean {
    return (this.activeFilters.get(field)?.size ?? 0) > 0;
  }

  isValueChecked(field: string, value: any): boolean {
    return this.activeFilters.get(field)?.has(value) ?? false;
  }

  toggleFilterValue(field: string, value: any): void {
    if (!this.activeFilters.has(field)) {
      this.activeFilters.set(field, new Set());
    }
    const vals = this.activeFilters.get(field)!;
    if (vals.has(value)) vals.delete(value);
    else vals.add(value);
    if (vals.size === 0) this.activeFilters.delete(field);
  }

  clearFilter(field: string): void {
    this.activeFilters.delete(field);
  }

  setSearchTerm(term: string): void {
    this.currentSearchTerm = term;
  }

  // Columns with a filterFormat filter by its text, so the panel lists and matches that text.
  setFormatter(field: string, format: ((value: any) => string) | undefined): void {
    if (format) this.formatters.set(field, format);
    else this.formatters.delete(field);
  }

  private key(field: string, value: any): any {
    const format = this.formatters.get(field);
    return format ? format(value) : value;
  }

  // Sorted by the raw value (an ISO timestamp sorts chronologically; its formatted text would not).
  getUniqueValues(field: string, rows: TableRow<T>[]): any[] {
    const rawByKey = new Map<any, any>();
    for (const row of rows) {
      const raw = (row.obj as any)[field];
      const key = this.key(field, raw);
      if (!rawByKey.has(key)) rawByKey.set(key, raw);
    }
    return [...rawByKey]
      .sort(([, a], [, b]) => {
        if (a == null) return 1;
        if (b == null) return -1;
        return String(a).localeCompare(String(b), undefined, { numeric: true });
      })
      .map(([key]) => key);
  }

  apply(rows: TableRow<T>[], searchEnabled: boolean, columnFilterEnabled: boolean): TableRow<T>[] {
    let filtered = rows;

    if (searchEnabled) {
      const term = this.currentSearchTerm.toLowerCase().trim();
      if (term) {
        filtered = filtered.filter((row) =>
          Object.values(row.obj as object).some((v) => String(v ?? '').toLowerCase().includes(term)),
        );
      }
    }

    if (columnFilterEnabled) {
      for (const [field, values] of this.activeFilters) {
        if (values.size > 0) {
          filtered = filtered.filter((row) => values.has(this.key(field, (row.obj as any)[field])));
        }
      }
    }

    return filtered;
  }
}
