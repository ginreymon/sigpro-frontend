export interface QueryParams {
  page?: number;
  page_size?: number;
  ordering?: string;
  search?: string;
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
  [key: string]: any;
}
