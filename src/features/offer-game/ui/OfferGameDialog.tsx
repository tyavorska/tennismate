'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Form } from 'react-aria-components';
import { Controller, useForm, useWatch, type Control } from 'react-hook-form';
import {
  formatRating,
  gameDaySchema,
  gameFormatLabels,
  gameFormatSchema,
  type NtrpRating,
} from '@/entities/player';
import { Avatar, Button, FormTextField, Modal, SelectField, type SelectOption } from '@/shared/ui';
import {
  lookingForLabels,
  lookingForSchema,
  offerGameSchema,
  offerTimes,
  type OfferGameInput,
} from '../model/offerGameSchema';
import type { CourtOption } from '../model/offerToGame';
import styles from './OfferGameDialog.module.css';

type OfferGameDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  viewerRating: NtrpRating;
  courts: readonly CourtOption[];
  ratings: readonly NtrpRating[];
  onPost: (offer: OfferGameInput) => void;
};

function toOptions<T extends string>(
  ids: readonly T[],
  labelOf: (id: T) => string,
): readonly SelectOption[] {
  return ids.map((id) => ({ id, label: labelOf(id) }));
}

const dayOptions = toOptions(gameDaySchema.options, (day) => day);
const timeOptions = toOptions(offerTimes, (time) => time);
const formatOptions = toOptions(gameFormatSchema.options, (format) => gameFormatLabels[format]);
const lookingForOptions = toOptions(lookingForSchema.options, (option) => lookingForLabels[option]);

type OfferSelectProps = {
  control: Control<OfferGameInput>;
  name: 'day' | 'time' | 'format' | 'rating' | 'court' | 'lookingFor';
  label: string;
  options: readonly SelectOption[];
};

function OfferSelect({ control, name, label, options }: OfferSelectProps) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <SelectField
          label={label}
          options={options}
          value={field.value}
          onChange={field.onChange}
        />
      )}
    />
  );
}

export function OfferGameDialog({
  isOpen,
  onOpenChange,
  viewerRating,
  courts,
  ratings,
  onPost,
}: OfferGameDialogProps) {
  const defaultCourt = courts[0]?.name ?? '';
  const { control, handleSubmit, reset } = useForm<OfferGameInput>({
    resolver: zodResolver(offerGameSchema),
    defaultValues: {
      day: 'Today',
      time: '18:30',
      format: 'singles',
      rating: String(viewerRating),
      court: defaultCourt,
      lookingFor: 'nearLevel',
      note: '',
    },
  });
  const [day, time, format, rating, court] = useWatch({
    control,
    name: ['day', 'time', 'format', 'rating', 'court'],
  });

  const ratingOptions = toOptions(ratings.map(String), (value) => formatRating(Number(value)));
  const courtOptions = toOptions(
    courts.map((option) => option.name),
    (name) => name,
  );

  function onSubmit(values: OfferGameInput): void {
    onPost(values);
    reset();
    onOpenChange(false);
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={onOpenChange}
      eyebrow="Players"
      title="Offer myself as a player"
    >
      <Form className={styles.form} onSubmit={handleSubmit(onSubmit)} validationBehavior="aria">
        <div className={styles.grid}>
          <OfferSelect control={control} name="day" label="Day" options={dayOptions} />
          <OfferSelect control={control} name="time" label="Time" options={timeOptions} />
          <OfferSelect control={control} name="format" label="Format" options={formatOptions} />
          <OfferSelect control={control} name="rating" label="Your level" options={ratingOptions} />
          <OfferSelect control={control} name="court" label="Court" options={courtOptions} />
          <OfferSelect
            control={control}
            name="lookingFor"
            label="Looking for"
            options={lookingForOptions}
          />
        </div>

        <FormTextField
          control={control}
          name="note"
          label="Note"
          placeholder="e.g. One hour, then a set. I'll bring new balls."
        />

        <div className={styles.footer}>
          <div className={styles.preview}>
            <Avatar initials="You" className={styles.avatar} />
            <p className={styles.previewText}>
              <strong>
                {day} · {time}
              </strong>
              <span>
                {gameFormatLabels[format]} · NTRP {formatRating(Number(rating))} · {court}
              </span>
            </p>
          </div>
          <Button type="submit" variant="ball">
            Post my game
          </Button>
        </div>
      </Form>
    </Modal>
  );
}
