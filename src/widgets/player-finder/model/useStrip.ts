'use client';

import { useRef, type RefObject } from 'react';

type Strip = readonly [
  ref: RefObject<HTMLUListElement | null>,
  scroll: (direction: 1 | -1) => void,
];

const pageFraction = 0.8;

/** Scrolls a horizontal row of cards by most of its visible width. */
export function useStrip(): Strip {
  const ref = useRef<HTMLUListElement>(null);

  function scroll(direction: 1 | -1): void {
    const strip = ref.current;
    if (strip === null) return;
    strip.scrollBy({ left: direction * strip.clientWidth * pageFraction });
  }

  return [ref, scroll];
}
