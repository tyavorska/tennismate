import Link from 'next/link';
import {
  formatInviteDay,
  formatMessageTime,
  type Invite,
  type InviteResponseRequest,
} from '@/entities/conversation';
import { Button } from '@/shared/ui';
import styles from './InviteCard.module.css';

type InviteCardProps = {
  invite: Invite;
  /** When the invite was sent. */
  sentAt: string;
  viewerId: string;
  /** First name of the other player. */
  partnerName: string;
  timeZone: string;
  isResponding: boolean;
  onRespond: (action: InviteResponseRequest['action']) => void;
};

type FooterProps = Pick<
  InviteCardProps,
  'invite' | 'partnerName' | 'isResponding' | 'onRespond'
> & {
  isProposer: boolean;
};

function Footer({ invite, isProposer, partnerName, isResponding, onRespond }: FooterProps) {
  if (invite.status === 'accepted') {
    return (
      <p className={styles.confirmed}>
        <span aria-hidden="true">✓ </span>
        Confirmed by both ·{' '}
        <Link href={`/calendar?day=${invite.date}`} className={styles.calendarLink}>
          in your calendar
        </Link>
      </p>
    );
  }
  if (invite.status === 'pending' && isProposer) {
    return (
      <div className={styles.actions}>
        <p className={styles.waiting}>Waiting for {partnerName}</p>
        <Button variant="outline" isDisabled={isResponding} onPress={() => onRespond('cancel')}>
          Cancel invite
        </Button>
      </div>
    );
  }
  if (invite.status === 'pending') {
    return (
      <div className={styles.actions}>
        <Button variant="solid" isDisabled={isResponding} onPress={() => onRespond('accept')}>
          Accept
        </Button>
        <Button variant="outline" isDisabled={isResponding} onPress={() => onRespond('decline')}>
          Decline
        </Button>
      </div>
    );
  }
  const closed = { declined: 'Declined', cancelled: 'Cancelled', expired: 'Expired' } as const;
  return <p className={styles.closed}>{closed[invite.status]}</p>;
}

/** A "let's play" invite in the thread: the day, the court, and what can be done with it now. */
export function InviteCard({
  invite,
  sentAt,
  viewerId,
  partnerName,
  timeZone,
  isResponding,
  onRespond,
}: InviteCardProps) {
  const isProposer = invite.proposerId === viewerId;

  return (
    <li className={isProposer ? styles.mine : styles.theirs}>
      <article className={styles.card} aria-label="Let's play invite">
        <header className={styles.top}>
          <span>Let&apos;s play</span>
          <time dateTime={sentAt}>{formatMessageTime(sentAt, timeZone)}</time>
        </header>
        <div className={styles.body}>
          <p className={styles.when}>
            {formatInviteDay(invite.date)} · {invite.time}
          </p>
          <p className={styles.court}>{invite.court}</p>
        </div>
        <div className={styles.footer}>
          <Footer
            invite={invite}
            isProposer={isProposer}
            partnerName={partnerName}
            isResponding={isResponding}
            onRespond={onRespond}
          />
        </div>
      </article>
    </li>
  );
}
