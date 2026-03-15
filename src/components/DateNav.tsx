import { useApp } from '../contexts/AppContext';
import { displayDate, addDays, getToday } from '../lib/dates';
import { t } from '../lib/i18n';

export function DateNav() {
  const { state, dispatch } = useApp();
  const today = getToday();
  const isToday = state.currentDate === today;
  const firstEntry = state.entryDates[0] || today;
  const canGoPrev = state.currentDate > firstEntry;

  const goTo = (date: string) => {
    if (date > today) return;
    if (date < firstEntry) return;
    dispatch({ type: 'SET_DATE', date });
  };

  return (
    <nav className="date-nav">
      <button
        onClick={() => goTo(addDays(state.currentDate, -1))}
        disabled={!canGoPrev}
        aria-label="Previous day"
      >
        &larr;
      </button>
      <span className="date-display">
        {displayDate(state.currentDate, t(state.lang, 'dateLang'))}
        <input
          type="date"
          className="date-picker"
          value={state.currentDate}
          max={today}
          min={firstEntry}
          onChange={(e) => goTo(e.target.value)}
        />
      </span>
      <button
        onClick={() => goTo(addDays(state.currentDate, 1))}
        disabled={isToday}
        aria-label="Next day"
      >
        &rarr;
      </button>
    </nav>
  );
}
