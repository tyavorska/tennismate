'use client';

import type { UseQueryResult } from '@tanstack/react-query';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Input, Label, TextField } from 'react-aria-components';
import {
  formatListTime,
  formatMessageTime,
  type ChatPartner,
  type Conversation,
  type Invite,
  type Message,
} from '@/entities/conversation';
import { toApiError } from '@/shared/api';
import {
  Avatar,
  Button,
  FormAlert,
  Icon,
  SelectField,
  ToggleGroup,
  ToggleItem,
  VisuallyHidden,
} from '@/shared/ui';
import { inviteCourts, inviteSlots } from '../model/inviteOptions';
import { useMarkRead } from '../model/useMarkRead';
import { useIsOnline, useThreadMessages } from '../model/useConversations';
import { useSendMessage } from '../model/useSendMessage';
import styles from './InboxPanel.module.css';

type Viewer = Readonly<{ id: string; timezone: string }>;

const quickReplies = ['Sounds good', 'What time works?', "Let's play"] as const;

type CloseButtonProps = { onClose: () => void };

function CloseButton({ onClose }: CloseButtonProps) {
  return (
    <Button variant="outline" className={styles.round} onPress={onClose} aria-label="Close">
      <Icon name="close" strokeWidth={2.4} />
    </Button>
  );
}

type ConversationListProps = {
  viewer: Viewer;
  conversations: UseQueryResult<readonly Conversation[]>;
  onOpen: (partner: ChatPartner) => void;
  onClose: () => void;
};

function ConversationItem({
  viewer,
  conversation,
  onOpen,
}: {
  viewer: Viewer;
  conversation: Conversation;
  onOpen: (partner: ChatPartner) => void;
}) {
  const isOnline = useIsOnline(conversation.partner.id);
  const isUnread = conversation.unreadCount > 0;
  const { lastMessage } = conversation;

  return (
    <li>
      <button type="button" className={styles.item} onClick={() => onOpen(conversation.partner)}>
        <Avatar
          initials={conversation.partner.initials}
          online={isOnline}
          className={styles.avatar}
        />
        <span className={styles.itemText}>
          <span className={styles.itemTop}>
            <strong className={styles.name}>{conversation.partner.name}</strong>
            <span className={styles.time}>
              {formatListTime(lastMessage.sentAt, viewer.timezone, new Date())}
            </span>
          </span>
          <span className={isUnread ? styles.previewUnread : styles.preview}>
            {lastMessage.senderId === viewer.id ? 'You: ' : ''}
            {lastMessage.text}
          </span>
        </span>
        {isOnline && <VisuallyHidden>Online</VisuallyHidden>}
        {isUnread && (
          <span className={styles.dot}>
            <VisuallyHidden>Unread</VisuallyHidden>
          </span>
        )}
      </button>
    </li>
  );
}

function ConversationList({ viewer, conversations, onOpen, onClose }: ConversationListProps) {
  const { data, error, isPending, refetch } = conversations;

  return (
    <>
      <header className={styles.header}>
        <h2 className={styles.title}>Messages</h2>
        <CloseButton onClose={onClose} />
      </header>
      {isPending && <p className={styles.status}>Loading your messages…</p>}
      {error !== null && data === undefined && (
        <div className={styles.status}>
          <FormAlert referenceId={toApiError(error).requestId}>
            {toApiError(error).message}
          </FormAlert>
          <Button variant="outline" onPress={() => void refetch()}>
            Try again
          </Button>
        </div>
      )}
      {data?.length === 0 && (
        <p className={styles.status}>
          No messages yet. Press &quot;Let&apos;s play&quot; on a player to say hi.
        </p>
      )}
      <ul className={styles.list}>
        {data?.map((conversation) => (
          <ConversationItem
            key={conversation.id}
            viewer={viewer}
            conversation={conversation}
            onOpen={onOpen}
          />
        ))}
      </ul>
    </>
  );
}

type InviteFormProps = {
  onSend: (invite: Invite) => void;
};

function InviteForm({ onSend }: InviteFormProps) {
  const [court, setCourt] = useState(inviteCourts[0]?.id ?? '');
  const [slot, setSlot] = useState<string>(inviteSlots[0]);

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSend({ slot, court });
  }

  return (
    <form className={styles.invite} onSubmit={submit} aria-label="Propose a court">
      <SelectField
        variant="wide"
        label="Court"
        hideLabel
        options={inviteCourts}
        value={court}
        onChange={setCourt}
      />
      <ToggleGroup
        className={styles.slots}
        aria-label="Time"
        selectedKeys={[slot]}
        onSelectionChange={(keys) => {
          const [key] = keys;
          if (typeof key === 'string') setSlot(key);
        }}
      >
        {inviteSlots.map((option) => (
          <ToggleItem key={option} id={option} className={styles.slot}>
            {option}
          </ToggleItem>
        ))}
      </ToggleGroup>
      <Button type="submit" variant="solid" className={styles.sendInvite}>
        Send &quot;let&apos;s play&quot; invite
      </Button>
    </form>
  );
}

type ThreadProps = {
  viewer: Viewer;
  partner: ChatPartner;
  conversation: Conversation | undefined;
  isInviting: boolean;
  onInvitingChange: (isInviting: boolean) => void;
  onBack: () => void;
  onClose: () => void;
};

type Attempt = Readonly<{ text: string; clientMessageId: string }>;

function Bubble({ viewer, message }: { viewer: Viewer; message: Message }) {
  return (
    <li className={message.senderId === viewer.id ? styles.bubbleMine : styles.bubbleTheirs}>
      <p>{message.text}</p>
      <time className={styles.bubbleTime} dateTime={message.sentAt}>
        {formatMessageTime(message.sentAt, viewer.timezone)}
      </time>
    </li>
  );
}

function Thread({
  viewer,
  partner,
  conversation,
  isInviting,
  onInvitingChange,
  onBack,
  onClose,
}: ThreadProps) {
  const [draft, setDraft] = useState('');
  const attempt = useRef<Attempt | undefined>(undefined);
  const listRef = useRef<HTMLUListElement>(null);
  const messages = useThreadMessages(conversation?.id);
  const send = useSendMessage();
  const markRead = useMarkRead();
  const isOnline = useIsOnline(partner.id);
  const loaded = messages.data ?? [];
  const unreadCount = conversation?.unreadCount ?? 0;
  const conversationId = conversation?.id;

  useEffect(() => {
    if (conversationId !== undefined && unreadCount > 0) markRead(conversationId);
  }, [conversationId, unreadCount, markRead]);

  useEffect(() => {
    const list = listRef.current;
    if (list !== null) list.scrollTop = list.scrollHeight;
  }, [loaded.length]);

  // A repeat of a failed send keeps its id, so the server never saves it twice.
  function submit(text: string, onSent: () => void, invite?: Invite): void {
    const trimmed = text.trim();
    if (trimmed === '') return;
    const clientMessageId =
      attempt.current?.text === trimmed ? attempt.current.clientMessageId : crypto.randomUUID();
    attempt.current = { text: trimmed, clientMessageId };
    send.mutate(
      { recipientId: partner.id, clientMessageId, text: trimmed, invite },
      {
        onSuccess: () => {
          attempt.current = undefined;
          onSent();
        },
      },
    );
  }

  function submitDraft(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    submit(draft, () => setDraft(''));
  }

  return (
    <>
      <header className={styles.header}>
        <Button
          variant="outline"
          className={styles.round}
          onPress={onBack}
          aria-label="Back to messages"
        >
          <Icon name="arrowLeft" strokeWidth={2.4} />
        </Button>
        <Avatar initials={partner.initials} online={isOnline} className={styles.threadAvatar} />
        <div className={styles.who}>
          <h2 className={styles.whoName}>{partner.name}</h2>
          <p className={styles.whoSub}>
            {partner.subtitle}
            {isOnline && ' · Online'}
          </p>
        </div>
        <CloseButton onClose={onClose} />
      </header>

      <div className={styles.plan}>
        <p className={styles.planText}>
          {conversation?.plan === undefined
            ? 'No court booked yet'
            : `${conversation.plan.slot} · ${conversation.plan.court}`}
        </p>
        <Button
          variant="solid"
          className={styles.propose}
          aria-expanded={isInviting}
          onPress={() => onInvitingChange(!isInviting)}
        >
          Propose a court
        </Button>
      </div>
      {isInviting && (
        <InviteForm
          onSend={({ slot, court }) =>
            submit(`Let's play at ${court}, ${slot}?`, () => onInvitingChange(false), {
              court,
              slot,
            })
          }
        />
      )}

      <ul
        ref={listRef}
        className={styles.messages}
        aria-label={`Conversation with ${partner.name}`}
      >
        {conversation === undefined && (
          <li className={styles.hint}>Say hi to {firstWord(partner.name)}.</li>
        )}
        {messages.isPending && conversation !== undefined && (
          <li className={styles.hint}>Loading…</li>
        )}
        {messages.error !== null && loaded.length === 0 && (
          <li className={styles.hint}>
            {toApiError(messages.error).message}{' '}
            <Button variant="ghost" onPress={() => void messages.refetch()}>
              Try again
            </Button>
          </li>
        )}
        {loaded.map((message) => (
          <Bubble key={message.id} viewer={viewer} message={message} />
        ))}
      </ul>

      {send.error !== null && (
        <div className={styles.sendError}>
          <FormAlert referenceId={send.error.requestId}>
            {send.error.message} Your message is still in the box.
          </FormAlert>
        </div>
      )}

      <ul className={styles.quick} aria-label="Quick replies">
        {quickReplies.map((reply) => (
          <li key={reply}>
            <Button
              variant="outline"
              className={styles.chip}
              isDisabled={send.isPending}
              onPress={() => submit(reply, () => undefined)}
            >
              {reply}
            </Button>
          </li>
        ))}
      </ul>

      <form className={styles.compose} onSubmit={submitDraft}>
        <TextField
          value={draft}
          onChange={setDraft}
          autoComplete="off"
          className={styles.composeField}
        >
          <Label>
            <VisuallyHidden>Message</VisuallyHidden>
          </Label>
          <Input className={styles.composeInput} placeholder="Write a message…" />
        </TextField>
        <Button type="submit" className={styles.send} aria-label="Send" isDisabled={send.isPending}>
          <Icon name="send" strokeWidth={2.4} />
        </Button>
      </form>
    </>
  );
}

function firstWord(name: string): string {
  return name.split(' ')[0] ?? name;
}

type InboxPanelProps = {
  viewer: Viewer;
  conversations: UseQueryResult<readonly Conversation[]>;
  /** The player the open chat is with, if a chat is open. */
  active: ChatPartner | undefined;
  isInviting: boolean;
  onInvitingChange: (isInviting: boolean) => void;
  onOpenConversation: (partner: ChatPartner) => void;
  onBack: () => void;
  onClose: () => void;
};

export function InboxPanel({
  viewer,
  conversations,
  active,
  isInviting,
  onInvitingChange,
  onOpenConversation,
  onBack,
  onClose,
}: InboxPanelProps) {
  if (active === undefined) {
    return (
      <ConversationList
        viewer={viewer}
        conversations={conversations}
        onOpen={onOpenConversation}
        onClose={onClose}
      />
    );
  }

  return (
    <Thread
      key={active.id}
      viewer={viewer}
      partner={active}
      conversation={conversations.data?.find(({ partner }) => partner.id === active.id)}
      isInviting={isInviting}
      onInvitingChange={onInvitingChange}
      onBack={onBack}
      onClose={onClose}
    />
  );
}
