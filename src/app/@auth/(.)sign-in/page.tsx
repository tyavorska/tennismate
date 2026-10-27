import { SignInForm } from '@/features/sign-in';
import { Drawer } from '@/shared/ui';

export default function Page() {
  return (
    <Drawer label="Sign in">
      <SignInForm />
    </Drawer>
  );
}
