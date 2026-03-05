import { QueryParams } from './query-params';

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
  params?: QueryParams;
}
