export interface RegisterRequest {
  username: string;
  password: string;
  email?: string;
  employee_local_id?: number | null;
  group_id: number;
}
