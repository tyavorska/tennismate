'use client';

import type { ReactNode } from 'react';
import type { ChatPartner } from '@/entities/conversation';
import { Button } from '@/shared/ui';
import { useInboxControls } from './InboxProvider';
import styles from './InboxLinks.module.css';

type OpenInboxButtonProps = {
  className?: string;
};

/** Link-style button that opens the full inbox. */
export function OpenInboxButton({ className }: OpenInboxButtonProps) {
  const { open } = useInboxControls();

  return (
    <Button
      variant="ghost"
      className={[styles.link, className].filter(Boolean).join(' ')}
      onPress={() => open()}
    >
      Open all
    </Button>
  );
}

type LetsPlayButtonProps = {
  player: ChatPartner;
  className?: string;
};

/** Opens the chat with a player and the invite form, ready to propose a court. */
export function LetsPlayButton({ player, className }: LetsPlayButtonProps) {
  const { open } = useInboxControls();

  return (
    <Button
      variant="ball"
      className={[styles.letsPlay, className].filter(Boolean).join(' ')}
      aria-label={`Let's play with ${player.name}`}
      onPress={() => open({ player, invite: true })}
    >
      Let&apos;s play
    </Button>
  );
}

type OpenChatButtonProps = {
  partner: ChatPartner;
  className?: string;
  children: ReactNode;
};

/** Wraps a row, such as an inbox item, so that pressing it opens the chat with that player. */
export function OpenChatButton({ partner, className, children }: OpenChatButtonProps) {
  const { open } = useInboxControls();

  return (
    <Button
      variant="ghost"
      className={[styles.chat, className].filter(Boolean).join(' ')}
      onPress={() => open({ player: partner })}
    >
      {children}
    </Button>
  );
}
