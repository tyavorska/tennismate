import { redirect } from 'next/navigation';
import { routes } from '@/shared/config';

export default function Page(): never {
  redirect(routes.players);
}
