import { userSchema, type User } from '@/entities/user';
import { apiFetch } from '@/shared/api';
import type { SignInInput } from '../model/signInSchema';
import { apiRoutes } from '@/shared/config';

export function signIn(input: SignInInput): Promise<User> {
  return apiFetch(apiRoutes.signIn, { method: 'POST', body: input, schema: userSchema });
}
