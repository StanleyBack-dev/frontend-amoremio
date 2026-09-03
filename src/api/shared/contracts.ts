export interface PaginationMeta {
  total: number;
  currentPage: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
}

export interface ListQueryParams {
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> extends PaginationMeta {
  items: T[];
}
