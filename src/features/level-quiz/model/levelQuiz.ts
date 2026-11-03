import { ntrpRatingSchema, type NtrpRating } from '@/entities/player';

export type QuizOption = {
  readonly label: string;
  readonly rating: number;
};

export type QuizQuestion = {
  readonly question: string;
  readonly options: readonly QuizOption[];
};

export const quizQuestions = [
  {
    question: 'How long have you been playing?',
    options: [
      { label: 'Less than 6 months', rating: 2.5 },
      { label: '6 months to 2 years', rating: 3 },
      { label: '2 to 5 years', rating: 3.5 },
      { label: '5+ years, playing every week', rating: 4 },
      { label: 'I played juniors or league tennis', rating: 4.5 },
    ],
  },
  {
    question: 'How do your baseline rallies go?',
    options: [
      { label: 'I can keep 3 or 4 slow shots going', rating: 2.5 },
      { label: 'About 10 shots at medium pace', rating: 3 },
      { label: 'Consistent, with some direction and depth', rating: 3.5 },
      { label: 'I change spin and pace on purpose', rating: 4 },
      { label: 'I hurt opponents with pace and placement', rating: 4.5 },
    ],
  },
  {
    question: 'What is your serve like?',
    options: [
      { label: 'A soft serve that mostly goes in', rating: 2.5 },
      { label: 'Solid first serve, weak second serve', rating: 3 },
      { label: 'I can place it and add some spin', rating: 3.5 },
      { label: 'Reliable kick or slice second serve', rating: 4 },
      { label: 'My serve wins me free points', rating: 5 },
    ],
  },
  {
    question: 'How comfortable are you at the net?',
    options: [
      { label: 'I rarely come to the net', rating: 2.5 },
      { label: 'I can volley if the ball comes to me', rating: 3 },
      { label: 'Comfortable volleying in doubles', rating: 3.5 },
      { label: 'I approach and finish points at the net', rating: 4 },
      { label: 'Solid volleys, overheads and drop volleys', rating: 4.5 },
    ],
  },
  {
    question: 'What is your backhand like?',
    options: [
      { label: 'I avoid it when I can', rating: 2.5 },
      { label: 'I can rally with it', rating: 3 },
      { label: 'Consistent, with some direction', rating: 3.5 },
      { label: 'I can attack with it', rating: 4 },
      { label: 'As strong as my forehand', rating: 4.5 },
    ],
  },
  {
    question: 'What kind of matches do you play?',
    options: [
      { label: 'I have never played a match', rating: 2.5 },
      { label: 'Friendly matches with friends', rating: 3 },
      { label: 'Regular matches, I win some', rating: 3.5 },
      { label: 'Club leagues or local tournaments', rating: 4 },
      { label: 'Ranked tournaments', rating: 5 },
    ],
  },
] as const satisfies readonly QuizQuestion[];

const lowestRating = 2.5;
const highestRating = 5;

/** The mean of the answers, rounded to the nearest half step and kept between 2.5 and 5. */
export function estimateRating(answers: readonly number[]): NtrpRating {
  const mean = answers.reduce((sum, answer) => sum + answer, 0) / Math.max(1, answers.length);
  const rounded = Math.round(mean * 2) / 2;
  return ntrpRatingSchema.parse(Math.min(highestRating, Math.max(lowestRating, rounded)));
}

const levelDescriptions: Readonly<Record<number, string>> = {
  2.5: 'Learning the basics. You can rally slowly and are building a consistent serve.',
  3: 'Fairly consistent at medium pace. Working on direction, depth and a reliable serve.',
  3.5: 'Consistent rallies with direction, starting to use spin and come to the net. The most common club level in Kraków.',
  4: 'Dependable strokes with spin and placement, a reliable second serve and solid doubles play.',
  4.5: 'Power and spin as weapons, strong footwork and tactics. You compete in leagues or tournaments.',
  5: 'Advanced tournament player with weapons on serve and groundstrokes.',
};

export function describeRating(rating: NtrpRating): string {
  return levelDescriptions[rating] ?? '';
}
