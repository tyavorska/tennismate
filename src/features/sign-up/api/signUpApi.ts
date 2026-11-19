import { userSchema, type SignUpRequest, type User } from '@/entities/user';
import { apiFetch } from '@/shared/api';
import { apiRoutes } from '@/shared/config';

export function signUp(request: SignUpRequest): Promise<User> {
  return apiFetch(apiRoutes.signUp, { method: 'POST', body: request, schema: userSchema });
}
