import type { City } from '@/entities/city';
import { ChooseCityForm } from '@/features/choose-city';
import styles from './ChooseCityPage.module.css';

type ChooseCityPageProps = {
  cities: readonly City[];
};

export function ChooseCityPage({ cities }: ChooseCityPageProps) {
  return (
    <main className={styles.page}>
      <ChooseCityForm cities={cities} />
    </main>
  );
}
