import { useEffect } from 'react';
import { useApp } from './contexts/AppContext';
import { getToday, addDays } from './lib/dates';
import { useJournal } from './hooks/useJournal';
import { Header } from './components/Header';
import { DateNav } from './components/DateNav';
import { Quote } from './components/Quote';
import { JournalSection } from './components/JournalSection';
import { FixedButtons } from './components/FixedButtons';
import { GuideModal } from './components/GuideModal';
import { PassphraseModal } from './components/PassphraseModal';
import { useSync } from './hooks/useSync';

const MORNING_PROMPTS = [
  { field: 'grateful', labelKey: 'grateful' as const, count: 3, numbered: true },
  { field: 'great', labelKey: 'great' as const, count: 3, numbered: true },
  { field: 'affirmation', labelKey: 'affirmation' as const, count: 2, numbered: false },
];

const EVENING_PROMPTS = [
  { field: 'amazing', labelKey: 'amazing' as const, count: 3, numbered: true },
  { field: 'better', labelKey: 'better' as const, count: 2, numbered: false },
];

export default function App() {
  const { state, dispatch } = useApp();
  const { updateField } = useJournal();
  useSync();
  const isToday = state.currentDate === getToday();

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT') return;
      const today = getToday();
      if (e.key === 'ArrowLeft') {
        const prev = addDays(state.currentDate, -1);
        const firstEntry = state.entryDates[0] || today;
        if (prev >= firstEntry) dispatch({ type: 'SET_DATE', date: prev });
      }
      if (e.key === 'ArrowRight') {
        const next = addDays(state.currentDate, 1);
        if (next <= today) dispatch({ type: 'SET_DATE', date: next });
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [state.currentDate, state.entryDates, dispatch]);

  // Past entry body class
  useEffect(() => {
    document.body.classList.toggle('past-entry', !isToday);
  }, [isToday]);

  if (!state.ready) return null;

  return (
    <>
      <div id="app">
        <Header />
        <DateNav />
        <Quote />
        <JournalSection section="morning" prompts={MORNING_PROMPTS} onFieldChange={updateField} />
        <JournalSection section="evening" prompts={EVENING_PROMPTS} onFieldChange={updateField} />
      </div>
      <FixedButtons />
      <GuideModal />
      <PassphraseModal />
    </>
  );
}
