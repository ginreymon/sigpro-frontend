import { inject, signal } from '@angular/core';
import { QueryParams } from '../interfaces/query-params';
import { PaginatedResponse } from '../interfaces/paginated-response';
import { BaseEntity } from '../interfaces/base-entity';
import { BaseCrudService } from '../../services/common/base-crud-service';
import { finalize, map, Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WorkSpaceLoaderService } from '../../services/common/work-space-loader-service';

export abstract class PaginatedCrudPage<T extends BaseEntity> {
  protected limit: number = environment.DEFAULT_PAGE_SIZE;
  protected page: number = 1;
  protected searchTerm: string = '';
  // Filtros extra que se envían en cada consulta (reload/search/pager).
  protected filters: Record<string, any> = this.initialFilters();
  protected paginatedResponse = signal<PaginatedResponse<T> | null>(null);

  protected wslService = inject(WorkSpaceLoaderService);

  constructor(protected crudService: BaseCrudService<T>) {
    this.reload();
  }

  // Filtros de la primera consulta (el constructor ya la dispara, antes de que
  // se inicialicen los campos de la subclase: no usar campos de instancia aquí).
  protected initialFilters(): Record<string, any> {
    return {};
  }

  // Query currently in flight. An identical query reuses it; a different one cancels it (its
  // response would be stale). Callbacks are carried over so a superseded reload never loses them.
  private inFlight: { key: string; sub: Subscription; callbacks: Array<() => void> } | null = null;

  private getData(params: QueryParams, callback?: () => void) {
    const key = JSON.stringify(params);
    if (this.inFlight?.key === key) {
      if (callback) this.inFlight.callbacks.push(callback);
      return;
    }

    const callbacks = this.inFlight?.callbacks ?? [];
    if (callback) callbacks.push(callback);
    this.inFlight?.sub.unsubscribe();

    this.wslService.start();
    const entry = { key, callbacks, sub: new Subscription() };
    this.inFlight = entry;
    entry.sub = this.crudService
      .getAll(params)
      .pipe(
        map((res) => this.mapResponse(res)),
        finalize(() => {
          this.wslService.end();
          if (this.inFlight === entry) this.inFlight = null;
        }),
      )
      .subscribe({
        next: (res) => this.paginatedResponse.set(res),
        // Callbacks hide the loader, so they must also run when the request fails.
        complete: () => entry.callbacks.forEach((cb) => cb()),
        error: () => entry.callbacks.forEach((cb) => cb()),
      });
  }

  protected mapResponse(res: PaginatedResponse<T>): PaginatedResponse<T> {
    return { ...res };
  }

  protected reload(callback?: () => void) {
    const offset = (this.page - 1) * this.limit;

    const params: QueryParams = {
      limit: this.limit,
      offset,
      search: this.searchTerm || undefined,
      filters: this.filters,
    };

    this.getData(params, callback);
  }

  protected searchHandler(value: string) {
    this.searchTerm = value;
    this.page = 1;
    const params: QueryParams = {
      limit: this.limit,
      offset: 0,
      search: this.searchTerm,
      filters: this.filters,
    };
    this.getData(params);
  }

  protected pagerHandler(value: { page: number; pageSize: number }) {
    if (value?.page != this.page) {
      this.page = value.page;
    }

    if (this.limit != value?.pageSize) {
      this.limit = value.pageSize;
      this.page = 1;
    }

    const offset = (this.page - 1) * this.limit;
    const params: QueryParams = {
      limit: this.limit,
      offset,
      search: this.searchTerm || undefined,
      filters: this.filters,
    };
    this.getData(params);
  }
}
