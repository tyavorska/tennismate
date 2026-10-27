import { SignUpForm } from '@/features/sign-up';
import { Drawer } from '@/shared/ui';

export default function Page() {
  return (
    <Drawer label="Create account">
      <SignUpForm />
    </Drawer>
  );
}
