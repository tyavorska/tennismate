'use client';

import { useState } from 'react';
import { ProgressBar } from 'react-aria-components';
import { formatRating, type NtrpRating } from '@/entities/player';
import { Button, Icon, Modal } from '@/shared/ui';
import { describeRating, estimateRating, quizQuestions } from '../model/levelQuiz';
import styles from './LevelQuizDialog.module.css';

type LevelQuizDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  /** How many players are within half a level of the rating. */
  countNear: (rating: NtrpRating) => number;
  onUse: (rating: NtrpRating) => void;
};

type ProgressProps = { step: number };

function Progress({ step }: ProgressProps) {
  return (
    <ProgressBar
      aria-label="Quiz progress"
      value={step}
      minValue={0}
      maxValue={quizQuestions.length}
      className={styles.progress}
    >
      {({ percentage }) => <div className={styles.fill} style={{ width: `${percentage}%` }} />}
    </ProgressBar>
  );
}

export function LevelQuizDialog({ isOpen, onOpenChange, countNear, onUse }: LevelQuizDialogProps) {
  const [answers, setAnswers] = useState<readonly number[]>([]);
  const step = answers.length;
  const current = quizQuestions[step];

  function close(isOpenNow: boolean): void {
    onOpenChange(isOpenNow);
    if (!isOpenNow) setAnswers([]);
  }

  if (current === undefined) {
    const rating = estimateRating(answers);
    const nearby = countNear(rating);
    return (
      <Modal
        isOpen={isOpen}
        onOpenChange={close}
        size="narrow"
        eyebrow="Your estimated level"
        title="Level quiz result"
        hideTitle
        meta={<Progress step={step} />}
      >
        <div className={styles.result}>
          <p className={styles.big}>{formatRating(rating)}</p>
          <p className={styles.scale}>NTRP</p>
          <p className={styles.description}>{describeRating(rating)}</p>
          <p className={styles.nearby}>
            <strong>{nearby === 1 ? '1 player' : `${nearby} players`}</strong> in Kraków{' '}
            {nearby === 1 ? 'is' : 'are'} within half a level of you.
          </p>
        </div>
        <div className={styles.actions}>
          <Button
            variant="ball"
            onPress={() => {
              onUse(rating);
              close(false);
            }}
          >
            Use NTRP {formatRating(rating)}
          </Button>
          <Button variant="outline" onPress={() => setAnswers([])}>
            Retake
          </Button>
        </div>
        <p className={styles.note}>Your level keeps updating as you log confirmed match results.</p>
      </Modal>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={close}
      size="narrow"
      eyebrow={`What's my level? · ${step + 1} of ${quizQuestions.length}`}
      title={current.question}
      meta={<Progress step={step} />}
    >
      <ul className={styles.options}>
        {current.options.map((option) => (
          <li key={option.label}>
            <Button
              variant="secondary"
              className={styles.option}
              onPress={() => setAnswers([...answers, option.rating])}
            >
              {option.label}
            </Button>
          </li>
        ))}
      </ul>
      {step > 0 && (
        <Button
          variant="ghost"
          className={styles.back}
          onPress={() => setAnswers(answers.slice(0, -1))}
        >
          <Icon name="arrowLeft" /> Back
        </Button>
      )}
    </Modal>
  );
}
