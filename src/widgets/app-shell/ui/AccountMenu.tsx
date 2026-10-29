'use client';

import { firstNameOf, formatRating, initialsOf, type Player } from '@/entities/player';
import { useSignOut } from '@/features/sign-out';
import { FormAlert, Menu, MenuItem, MenuSeparator } from '@/shared/ui';
import styles from './AccountMenu.module.css';

type AccountMenuProps = {
  viewer: Player;
};

export function AccountMenu({ viewer }: AccountMenuProps) {
  const signOut = useSignOut();

  return (
    <div className={styles.account}>
      <Menu
        triggerClassName={styles.trigger}
        trigger={
          <>
            <span className={styles.avatar} aria-hidden="true">
              {initialsOf(viewer.name)}
            </span>
            <span className={styles.text}>
              <span className={styles.greeting}>Hi, {firstNameOf(viewer.name)}</span>{' '}
              <span className={styles.rating}>Rating {formatRating(viewer.rating)}</span>
            </span>
          </>
        }
      >
        <MenuItem href="/account">Your profile</MenuItem>
        <MenuSeparator />
        <MenuItem
          isDisabled={signOut.isPending}
          textValue="Sign out"
          onAction={() => signOut.mutate()}
        >
          {signOut.isPending ? 'Signing out…' : 'Sign out'}
        </MenuItem>
      </Menu>

      {signOut.isPending && (
        <p className={styles.notice} role="status">
          Signing out…
        </p>
      )}
      {signOut.error !== null && (
        <div className={styles.notice}>
          <FormAlert>{signOut.error.message}</FormAlert>
        </div>
      )}
    </div>
  );
}
