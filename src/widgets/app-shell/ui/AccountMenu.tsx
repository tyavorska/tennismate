'use client';

import { firstNameOf, initialsOf, type Player } from '@/entities/player';
import { useSignOut } from '@/features/sign-out';
import { FormAlert, Icon, Menu, MenuItem } from '@/shared/ui';
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
            <span className={styles.name}>{firstNameOf(viewer.name)}</span>
          </>
        }
      >
        <MenuItem href="/profile" textValue="Profile settings">
          <Icon name="user" className={styles.itemIcon} />
          Profile settings
        </MenuItem>
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
