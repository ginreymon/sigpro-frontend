import { inject, signal } from '@angular/core';
import { QueryParams } from '../interfaces/query-params';
import { PaginatedResponse } from '../interfaces/paginated-response';
import { BaseEntity } from '../interfaces/base-entity';
import { BaseCrudService } from '../../services/common/base-crud-service';
import { finalize, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { WorkSpaceLoaderService } from '../../services/common/work-space-loader-service';

export abstract class PaginatedCrudPage<T extends BaseEntity> {
  protected limit: number = environment.DEFAULT_PAGE_SIZE;
  protected page: number = 1;
  protected searchTerm: string = '';
  protected paginatedResponse = signal<PaginatedResponse<T> | null>(null);

  protected wslService = inject(WorkSpaceLoaderService);

  constructor(protected crudService: BaseCrudService<T>) {
    this.reload();
  }

  private getData(params: QueryParams, callback?: () => void) {
    this.wslService.start();
    this.crudService
      .getAll(params)
      .pipe(
        map((res) => this.mapResponse(res)),
        finalize(() => this.wslService.end()),
      )
      .subscribe({
        next: (res) => this.paginatedResponse.set(res),
        complete: () => callback?.(),
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
    };
    this.getData(params);
  }
}
