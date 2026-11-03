'use client';

import { useState, type FormEvent } from 'react';
import { Input, Label, TextField } from 'react-aria-components';
import type { Conversation } from '@/entities/conversation';
import {
  Avatar,
  Button,
  Icon,
  SelectField,
  ToggleGroup,
  ToggleItem,
  VisuallyHidden,
} from '@/shared/ui';
import { inviteCourts, inviteSlots } from '../model/inviteOptions';
import type { Inbox, Invite } from '../model/useInbox';
import styles from './InboxPanel.module.css';

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
  conversations: readonly Conversation[];
  onOpen: (conversation: Conversation) => void;
  onClose: () => void;
};

function ConversationList({ conversations, onOpen, onClose }: ConversationListProps) {
  return (
    <>
      <header className={styles.header}>
        <h2 className={styles.title}>Messages</h2>
        <CloseButton onClose={onClose} />
      </header>
      <ul className={styles.list}>
        {conversations
          .filter((conversation) => conversation.messages.length > 0)
          .map((conversation) => (
            <li key={conversation.id}>
              <button type="button" className={styles.item} onClick={() => onOpen(conversation)}>
                <Avatar
                  initials={conversation.initials}
                  online={conversation.online}
                  className={styles.avatar}
                />
                <span className={styles.itemText}>
                  <span className={styles.itemTop}>
                    <strong className={styles.name}>{conversation.name}</strong>
                    <span className={styles.time}>{conversation.lastAt}</span>
                  </span>
                  <span className={conversation.unread ? styles.previewUnread : styles.preview}>
                    {conversation.preview}
                  </span>
                </span>
                {conversation.unread && (
                  <span className={styles.dot}>
                    <VisuallyHidden>Unread</VisuallyHidden>
                  </span>
                )}
              </button>
            </li>
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
  conversation: Conversation;
  isInviting: boolean;
  onInvitingChange: (isInviting: boolean) => void;
  onSend: (text: string) => void;
  onInvite: (invite: Invite) => void;
  onBack: () => void;
  onClose: () => void;
};

function Thread({
  conversation,
  isInviting,
  onInvitingChange,
  onSend,
  onInvite,
  onBack,
  onClose,
}: ThreadProps) {
  const [draft, setDraft] = useState('');

  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault();
    onSend(draft);
    setDraft('');
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
        <Avatar initials={conversation.initials} className={styles.threadAvatar} />
        <div className={styles.who}>
          <h2 className={styles.whoName}>{conversation.name}</h2>
          <p className={styles.whoSub}>{conversation.subtitle}</p>
        </div>
        <CloseButton onClose={onClose} />
      </header>

      <div className={styles.plan}>
        <p className={styles.planText}>{conversation.plan ?? 'No court booked yet'}</p>
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
          onSend={(invite) => {
            onInvite(invite);
            onInvitingChange(false);
          }}
        />
      )}

      <ul className={styles.messages} aria-label={`Conversation with ${conversation.name}`}>
        {conversation.messages.length === 0 && (
          <li className={styles.hint}>
            Say hi to {conversation.name.split(' ')[0]}. Your first message arrives as a request.
          </li>
        )}
        {conversation.messages.map((message) => (
          <li
            key={message.id}
            className={message.from === 'me' ? styles.bubbleMine : styles.bubbleTheirs}
          >
            <p>{message.text}</p>
            <time className={styles.bubbleTime}>{message.time}</time>
          </li>
        ))}
      </ul>

      <ul className={styles.quick} aria-label="Quick replies">
        {quickReplies.map((reply) => (
          <li key={reply}>
            <Button variant="outline" className={styles.chip} onPress={() => onSend(reply)}>
              {reply}
            </Button>
          </li>
        ))}
      </ul>

      <form className={styles.compose} onSubmit={submit}>
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
        <Button type="submit" className={styles.send} aria-label="Send">
          <Icon name="send" strokeWidth={2.4} />
        </Button>
      </form>
    </>
  );
}

type InboxPanelProps = {
  inbox: Inbox;
  activeId: string | undefined;
  isInviting: boolean;
  onInvitingChange: (isInviting: boolean) => void;
  onOpenConversation: (id: string) => void;
  onBack: () => void;
  onClose: () => void;
};

export function InboxPanel({
  inbox,
  activeId,
  isInviting,
  onInvitingChange,
  onOpenConversation,
  onBack,
  onClose,
}: InboxPanelProps) {
  const active = inbox.conversations.find((conversation) => conversation.id === activeId);

  if (active === undefined) {
    return (
      <ConversationList
        conversations={inbox.conversations}
        onOpen={(conversation) => onOpenConversation(conversation.id)}
        onClose={onClose}
      />
    );
  }

  return (
    <Thread
      conversation={active}
      isInviting={isInviting}
      onInvitingChange={onInvitingChange}
      onSend={(text) => inbox.send(active.id, text)}
      onInvite={(invite) => inbox.invite(active.id, invite)}
      onBack={onBack}
      onClose={onClose}
    />
  );
}
