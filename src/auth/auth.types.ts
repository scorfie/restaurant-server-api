export interface AuthUser {
  sub: number;
  type: 'customer' | 'staff';
  role?: 'admin' | 'manager' | 'staff';
}
