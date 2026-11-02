'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';
import { unreadCount, type Conversation } from '@/entities/conversation';
import { Drawer } from '@/shared/ui';
import { useInbox, type ChatPlayer } from '../model/useInbox';
import { InboxPanel } from './InboxPanel';

type OpenOptions = {
  /** Opens this conversation instead of the list. */
  conversationId?: string;
  /** Opens the chat with this player, starting one if there is none yet. */
  player?: ChatPlayer;
  /** Also opens the "let's play" invite form. */
  invite?: boolean;
};

type InboxControls = {
  unread: number;
  open: (options?: OpenOptions) => void;
};

const InboxContext = createContext<InboxControls | undefined>(undefined);

export function useInboxControls(): InboxControls {
  const controls = useContext(InboxContext);
  if (controls === undefined) throw new Error('Inbox controls need an InboxProvider above them.');
  return controls;
}

type InboxProviderProps = {
  conversations: readonly Conversation[];
  children: ReactNode;
};

/** Holds the conversations and the drawer, so any button on the page can open the inbox. */
export function InboxProvider({ conversations, children }: InboxProviderProps) {
  const inbox = useInbox(conversations);
  const [isOpen, setIsOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | undefined>(undefined);
  const [isInviting, setIsInviting] = useState(false);

  function open(options: OpenOptions = {}): void {
    if (options.player !== undefined) inbox.ensure(options.player);
    const id = options.player?.id ?? options.conversationId;
    if (id !== undefined) inbox.markRead(id);
    setActiveId(id);
    setIsInviting(options.invite ?? false);
    setIsOpen(true);
  }

  return (
    <InboxContext value={{ unread: unreadCount(inbox.conversations), open }}>
      {children}
      <Drawer isOpen={isOpen} onOpenChange={setIsOpen} label="Messages">
        {(close) => (
          <InboxPanel
            inbox={inbox}
            activeId={activeId}
            isInviting={isInviting}
            onInvitingChange={setIsInviting}
            onOpenConversation={(id) => {
              inbox.markRead(id);
              setActiveId(id);
              setIsInviting(false);
            }}
            onBack={() => {
              setActiveId(undefined);
              setIsInviting(false);
            }}
            onClose={close}
          />
        )}
      </Drawer>
    </InboxContext>
  );
}
