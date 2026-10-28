import { userSchema, type User } from '@/entities/user';
import { apiFetch } from '@/shared/api';
import type { SignInInput } from '../model/signInSchema';

export function signIn(input: SignInInput): Promise<User> {
  return apiFetch('/api/auth/sign-in', { method: 'POST', body: input, schema: userSchema });
}
