import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { t } from '../lib/i18n';
import { SettingsModal } from './SettingsModal';

export function FixedButtons() {
  const { state, dispatch } = useApp();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const toggleTheme = () => {
    dispatch({ type: 'SET_THEME', theme: state.theme === 'dark' ? 'light' : 'dark' });
  };

  const toggleLang = () => {
    dispatch({ type: 'SET_LANG', lang: state.lang === 'en' ? 'es' : 'en' });
  };

  const openGuide = () => {
    dispatch({ type: 'SET_GUIDE_OPEN', open: true });
  };

  return (
    <>
      <button className="fixed-btn theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
        {state.theme === 'dark' ? '☼' : '☽'}
      </button>
      <button className="fixed-btn help-toggle" onClick={openGuide} aria-label="How to use">
        ?
      </button>
      <button className="fixed-btn lang-toggle" onClick={toggleLang}>
        {t(state.lang, 'langSwitch')}
      </button>
      <button
        className="fixed-btn settings-toggle"
        onClick={() => setSettingsOpen(true)}
        aria-label="Settings"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>
      <SettingsModal open={settingsOpen} onClose={() => setSettingsOpen(false)} />
    </>
  );
}
