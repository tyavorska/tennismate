import { returnToParam, SignInForm } from '@/features/sign-in';
import { Drawer } from '@/shared/ui';

export default async function Page({ searchParams }: PageProps<'/sign-in'>) {
  const returnTo = returnToParam(await searchParams);
  return (
    <Drawer label="Sign in">
      <SignInForm returnTo={returnTo} />
    </Drawer>
  );
}
