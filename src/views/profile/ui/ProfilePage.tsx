import { initialsOf, levelOf, type Player } from '@/entities/player';
import { ChangePasswordForm } from '@/features/change-password';
import { DeleteAccountButton } from '@/features/delete-account';
import { EditProfileForm } from '@/features/edit-profile';
import { NotificationSettings } from '@/features/notification-settings';
import { SignOutButton } from '@/features/sign-out';
import { Avatar, Eyebrow } from '@/shared/ui';
import styles from './ProfilePage.module.css';

type ProfilePageProps = {
  viewer: Player;
  email: string;
};

export function ProfilePage({ viewer, email }: ProfilePageProps) {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Eyebrow>My Let.</Eyebrow>
        <h1 className={styles.title}>Account</h1>
      </header>

      <p className={styles.notice}>
        <strong>Signed in as {email}</strong>
        Email and password. Your password is stored only as a SHA-256 hash, and other players never
        see your email.
      </p>

      <div className={styles.layout}>
        <section className={styles.card} aria-labelledby="profile-name">
          <Avatar initials={initialsOf(viewer.name)} className={styles.avatar} />
          <div className={styles.cardText}>
            <h2 id="profile-name" className={styles.name}>
              {viewer.name}
            </h2>
            <p className={styles.sub}>
              {levelOf(viewer.rating)} · {viewer.rating.toFixed(1)} NTRP · {viewer.neighborhood}
            </p>
          </div>
        </section>

        <div className={styles.main}>
          <section className={styles.section} aria-labelledby="edit-profile">
            <h2 id="edit-profile" className={styles.sectionTitle}>
              Edit profile
            </h2>
            <EditProfileForm viewer={viewer} />
          </section>

          <section className={styles.section} aria-labelledby="change-password">
            <h2 id="change-password" className={styles.sectionTitle}>
              Change password
            </h2>
            <ChangePasswordForm />
          </section>

          <section className={styles.section} aria-labelledby="notifications">
            <h2 id="notifications" className={styles.sectionTitle}>
              Notifications
            </h2>
            <NotificationSettings />
          </section>

          <section className={styles.section} aria-labelledby="account-actions">
            <h2 id="account-actions" className={styles.sectionTitle}>
              Account
            </h2>
            <div className={styles.actions}>
              <SignOutButton />
              <DeleteAccountButton />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
