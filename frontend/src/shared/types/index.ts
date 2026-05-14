export interface UserInfo {
  id: string;
  username: string;
  fullName: string;
  email: string;
  roles: string[];
}

export interface ApiError {
  message: string;
  status: number;
}

export interface Paged<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}
