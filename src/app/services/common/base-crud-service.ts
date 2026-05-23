import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { PaginatedResponse } from '../../common/interfaces/paginated-response';
import { QueryParams } from '../../common/interfaces/query-params';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export abstract class BaseCrudService<T> {
  protected abstract _endpoint: string;

  constructor(protected http: HttpClient) {}

  get endpoint() {
    return `${environment.BASE_API_URL}${this._endpoint}`;
  }

  getAll(params?: QueryParams): Observable<PaginatedResponse<T>> {
    const httpParams = this.buildParams(params);
    return this.http
      .get<PaginatedResponse<T>>(this.endpoint, {
        params: httpParams,
      })
      .pipe(
        map((resp) => ({
          ...resp,
          params: params || undefined,
        })),
      );
  }

  all(): Observable<T[]> {
    return this.http.get<T[]>(`${this.endpoint}all/`);
  }

  getById(id: number): Observable<T> {
    return this.http.get<T>(`${this.endpoint}${id}/`);
  }

  create(data: Partial<T>): Observable<T> {
    return this.http.post<T>(this.endpoint, data);
  }

  update(id: number, data: Partial<T>): Observable<T> {
    return this.http.put<T>(`${this.endpoint}${id}/`, data);
  }

  patch(id: number, data: Partial<T>): Observable<T> {
    return this.http.patch<T>(`${this.endpoint}${id}/`, data);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}${id}/`);
  }

  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();

    if (!params) return httpParams;

    const { filters, ...rest } = params;

    Object.entries(rest).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        httpParams = httpParams.set(key, value);
      }
    });

    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          httpParams = httpParams.set(key, value);
        }
      });
    }

    return httpParams;
  }
}
