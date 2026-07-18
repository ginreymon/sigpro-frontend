import { TableRow } from '../../../../common/interfaces/table-row';

export class TableFilterState<T> {
  private activeFilters = new Map<string, Set<any>>();
  private currentSearchTerm = '';

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

  getUniqueValues(field: string, rows: TableRow<T>[]): any[] {
    const seen = new Set<any>();
    const result: any[] = [];
    for (const row of rows) {
      const val = (row.obj as any)[field];
      if (!seen.has(val)) {
        seen.add(val);
        result.push(val);
      }
    }
    return result.sort((a, b) => {
      if (a == null) return 1;
      if (b == null) return -1;
      return String(a).localeCompare(String(b), undefined, { numeric: true });
    });
  }

  apply(rows: TableRow<T>[], clientFilterEnabled: boolean): TableRow<T>[] {
    if (!clientFilterEnabled) return [...rows];

    let filtered = rows;

    const term = this.currentSearchTerm.toLowerCase().trim();
    if (term) {
      filtered = filtered.filter((row) =>
        Object.values(row.obj as object).some((v) => String(v ?? '').toLowerCase().includes(term)),
      );
    }

    for (const [field, values] of this.activeFilters) {
      if (values.size > 0) {
        filtered = filtered.filter((row) => values.has((row.obj as any)[field]));
      }
    }

    return filtered;
  }
}
