'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { unreadConversations, type ChatPartner } from '@/entities/conversation';
import { Drawer } from '@/shared/ui';
import { useConversations } from '../model/useConversations';
import { useInboxEvents } from '../model/useInboxEvents';
import { InboxPanel } from './InboxPanel';

type OpenOptions = {
  /** Opens the chat with this player. A conversation exists only after the first message. */
  player?: ChatPartner;
  /** Also opens the "let's play" invite form. */
  invite?: boolean;
};

type InboxControls = {
  unread: number;
  /** The signed-in player's city time zone, for the times shown in the lists. */
  timezone: string;
  open: (options?: OpenOptions) => void;
};

const InboxContext = createContext<InboxControls | undefined>(undefined);

export function useInboxControls(): InboxControls {
  const controls = useContext(InboxContext);
  if (controls === undefined) throw new Error('Inbox controls need an InboxProvider above them.');
  return controls;
}

type InboxProviderProps = {
  /** The signed-in player: whose messages are "mine", and the time zone times are shown in. */
  viewer: Readonly<{ id: string; timezone: string }>;
  children: ReactNode;
};

/** Holds the drawer and listens for live messages, so any button on the page can open the inbox. */
export function InboxProvider({ viewer, children }: InboxProviderProps) {
  useInboxEvents();
  const conversations = useConversations();
  const [isOpen, setIsOpen] = useState(false);
  const [active, setActive] = useState<ChatPartner | undefined>(undefined);
  const [isInviting, setIsInviting] = useState(false);

  function open(options: OpenOptions = {}): void {
    setActive(options.player);
    setIsInviting(options.invite ?? false);
    setIsOpen(true);
  }

  return (
    <InboxContext
      value={{
        unread: unreadConversations(conversations.data ?? []),
        timezone: viewer.timezone,
        open,
      }}
    >
      {children}
      <Drawer isOpen={isOpen} onOpenChange={setIsOpen} label="Messages">
        {(close) => (
          <InboxPanel
            viewer={viewer}
            conversations={conversations}
            active={active}
            isInviting={isInviting}
            onInvitingChange={setIsInviting}
            onOpenConversation={(partner) => {
              setActive(partner);
              setIsInviting(false);
            }}
            onBack={() => {
              setActive(undefined);
              setIsInviting(false);
            }}
            onClose={close}
          />
        )}
      </Drawer>
    </InboxContext>
  );
}
