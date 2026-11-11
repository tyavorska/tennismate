import { isoDateSchema, MonthCalendar } from '@/widgets/month-calendar';
import styles from './CalendarPage.module.css';

type CalendarPageProps = {
  /** Today in Kraków as `YYYY-MM-DD`. */
  today: string;
  /** The day to open, from the `day` query parameter. */
  day?: string;
};

export function CalendarPage({ today, day }: CalendarPageProps) {
  const todayIso = isoDateSchema.parse(today);
  const initialDay = isoDateSchema.safeParse(day);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerText}>
          <p className={styles.eyebrow}>My calendar</p>
          <h1 className={styles.title}>Your bookings</h1>
        </div>
        <p className={styles.lead}>
          Your games, open games, tournaments and your own notes. Pick a day to see details and add
          a note.
        </p>
      </header>

      <MonthCalendar
        todayIso={todayIso}
        initialDay={initialDay.success ? initialDay.data : undefined}
      />
    </div>
  );
}
