import { userSchema, type Credentials, type User } from '@/entities/user';
import { apiFetch } from '@/shared/api';

export function signUp(credentials: Credentials): Promise<User> {
  return apiFetch('/api/auth/sign-up', { method: 'POST', body: credentials, schema: userSchema });
}
