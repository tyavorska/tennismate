'use client';

import { useState } from 'react';
import {
  formatRating,
  ntrpRatingSchema,
  playFormatLabels,
  playFormatSchema,
  type MatchTime,
  type NtrpRating,
  type PlayFormat,
} from '@/entities/player';
import { toggleMember } from '@/shared/lib';
import {
  Button,
  CheckboxDropdown,
  CheckChip,
  Eyebrow,
  Icon,
  SearchField,
  SelectField,
  ToggleChip,
  type SelectOption,
} from '@/shared/ui';
import {
  ladderRungs,
  listIds,
  listLabels,
  placeKeysOf,
  placesFromKeys,
  type LevelFilter,
  type PlaceRow,
  type PlayerFilters,
} from '../model/playerFilters';
import styles from './FilterPanel.module.css';

const timeChips = [
  { id: 'tonight', label: 'Tonight' },
  { id: 'mornings', label: 'Mornings' },
  { id: 'weekends', label: 'Weekends' },
] as const satisfies ReadonlyArray<{ id: MatchTime; label: string }>;

const ratingOptions: readonly SelectOption[] = ladderRungs.map((rating) => ({
  id: String(rating),
  label: formatRating(rating),
}));

const levelOptions: readonly SelectOption[] = [
  { id: 'all', label: 'All levels' },
  ...ratingOptions,
];

type FilterPanelProps = {
  filters: PlayerFilters;
  onChange: (filters: PlayerFilters) => void;
  onClear: () => void;
  viewerRating: NtrpRating;
  onViewerRatingChange: (rating: NtrpRating) => void;
  /** Districts in order, each followed by its courts. */
  places: readonly PlaceRow[];
  playerCount: number;
  gameCount: number;
  /** Opens the level quiz, offered next to "I play at" under More filters. */
  onTakeQuiz: () => void;
};

function levelKey(level: LevelFilter): string {
  return level === 'all' ? 'all' : String(level);
}

function levelFromKey(key: string): LevelFilter | undefined {
  if (key === 'all') return 'all';
  return ladderRungs.find((rating) => String(rating) === key);
}

function placeSummary(filters: PlayerFilters, places: readonly PlaceRow[]): string {
  const keys = placeKeysOf(filters);
  const [first] = keys;
  if (first === undefined) return 'All of Kraków';
  if (keys.size === 1) return places.find((place) => place.key === first)?.label ?? first;
  return `${keys.size} selected`;
}

export function FilterPanel({
  filters,
  onChange,
  onClear,
  viewerRating,
  onViewerRatingChange,
  places,
  playerCount,
  gameCount,
  onTakeQuiz,
}: FilterPanelProps) {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const activeLists = filters.lists.size;

  return (
    <section className={styles.panel} aria-label="Find players">
      <div className={styles.bar}>
        <div className={styles.search}>
          <SearchField
            label="Search players"
            placeholder="Name, district or playing style"
            value={filters.query}
            onChange={(query) => onChange({ ...filters, query })}
          />
        </div>

        <div className={styles.level}>
          <SelectField
            variant="wide"
            label="Level"
            options={levelOptions}
            value={levelKey(filters.level)}
            onChange={(id) => {
              const level = levelFromKey(id);
              if (level !== undefined) onChange({ ...filters, level });
            }}
          />
        </div>

        <div className={styles.group} role="group" aria-labelledby="format-label">
          <Eyebrow as="p" className={styles.groupLabel} id="format-label">
            Format and time
          </Eyebrow>
          <div className={styles.chips}>
            {playFormatSchema.options.map((format: PlayFormat) => (
              <ToggleChip
                key={format}
                isSelected={filters.formats.has(format)}
                onChange={() =>
                  onChange({ ...filters, formats: toggleMember(filters.formats, format) })
                }
              >
                {playFormatLabels[format]}
              </ToggleChip>
            ))}
            {timeChips.map(({ id, label }) => (
              <ToggleChip
                key={id}
                isSelected={filters.times.has(id)}
                onChange={() => onChange({ ...filters, times: toggleMember(filters.times, id) })}
              >
                {label}
              </ToggleChip>
            ))}
          </div>
        </div>

        <div className={styles.place}>
          <Eyebrow as="p" className={styles.groupLabel}>
            District and court
          </Eyebrow>
          <CheckboxDropdown
            label="District and court"
            summary={placeSummary(filters, places)}
            allLabel="All of Kraków"
            rows={places.map((place) => ({
              key: place.key,
              label: place.label,
              kind: place.kind === 'district' ? 'group' : 'item',
            }))}
            selected={placeKeysOf(filters)}
            onChange={(keys) => onChange({ ...filters, ...placesFromKeys(keys) })}
          />
        </div>
      </div>

      <div className={styles.footer}>
        <Button
          variant="ghost"
          className={styles.more}
          aria-expanded={isMoreOpen}
          aria-controls="more-filters"
          onPress={() => setIsMoreOpen(!isMoreOpen)}
        >
          More filters{activeLists > 0 ? ` · ${activeLists}` : ''}
          <Icon name="chevron" className={isMoreOpen ? styles.chevronOpen : styles.chevron} />
        </Button>
        <p role="status" className={styles.results}>
          <strong>{playerCount}</strong> {playerCount === 1 ? 'player' : 'players'} and{' '}
          <strong>{gameCount}</strong> open {gameCount === 1 ? 'game' : 'games'} match
        </p>
        <Button variant="ghost" className={styles.clear} onPress={onClear}>
          Clear filters
        </Button>
      </div>

      {isMoreOpen && (
        <div id="more-filters" className={styles.extra}>
          <div className={styles.group} role="group" aria-labelledby="lists-label">
            <Eyebrow as="p" className={styles.groupLabel} id="lists-label">
              Lists
            </Eyebrow>
            <div className={styles.lists}>
              {listIds.map((list) => (
                <CheckChip
                  key={list}
                  isSelected={filters.lists.has(list)}
                  onChange={() =>
                    onChange({ ...filters, lists: toggleMember(filters.lists, list) })
                  }
                >
                  {listLabels[list]}
                </CheckChip>
              ))}
            </div>
          </div>

          <div className={styles.mine}>
            <SelectField
              variant="pill"
              inlineLabel
              label="I play at"
              options={ratingOptions}
              value={String(viewerRating)}
              onChange={(id) => {
                const rating = ntrpRatingSchema.safeParse(Number(id));
                if (rating.success) onViewerRatingChange(rating.data);
              }}
            />
            <Button variant="ghost" className={styles.quizLink} onPress={onTakeQuiz}>
              Not sure? Take the quiz
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
