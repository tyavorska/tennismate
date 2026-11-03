import { userSchema, type SignUpRequest, type User } from '@/entities/user';
import { apiFetch } from '@/shared/api';

export function signUp(request: SignUpRequest): Promise<User> {
  return apiFetch('/api/auth/sign-up', { method: 'POST', body: request, schema: userSchema });
}
