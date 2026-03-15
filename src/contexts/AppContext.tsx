import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { Entry, Lang, Theme } from '../lib/types';
import { emptyEntry } from '../lib/types';
import { getToday } from '../lib/dates';
import { getMeta, setMeta, migrateFromLocalStorage } from '../lib/db';

interface AppState {
  lang: Lang;
  theme: Theme;
  currentDate: string;
  entry: Entry;
  guided: boolean;
  guideOpen: boolean;
  entryDates: string[];
  ready: boolean;
  cryptoKey: CryptoKey | null;
  userId: string | null;
  authReady: boolean;
}

type Action =
  | { type: 'SET_LANG'; lang: Lang }
  | { type: 'SET_THEME'; theme: Theme }
  | { type: 'SET_DATE'; date: string }
  | { type: 'SET_ENTRY'; entry: Entry }
  | { type: 'SET_GUIDED'; guided: boolean }
  | { type: 'SET_GUIDE_OPEN'; open: boolean }
  | { type: 'SET_ENTRY_DATES'; dates: string[] }
  | { type: 'SET_READY' }
  | { type: 'SET_CRYPTO'; cryptoKey: CryptoKey; userId: string }
  | { type: 'SET_AUTH_READY' }
  | { type: 'CLEAR_CRYPTO' }
  | { type: 'INIT'; state: Partial<AppState> };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_LANG': return { ...state, lang: action.lang };
    case 'SET_THEME': return { ...state, theme: action.theme };
    case 'SET_DATE': return { ...state, currentDate: action.date };
    case 'SET_ENTRY': return { ...state, entry: action.entry };
    case 'SET_GUIDED': return { ...state, guided: action.guided };
    case 'SET_GUIDE_OPEN': return { ...state, guideOpen: action.open };
    case 'SET_ENTRY_DATES': return { ...state, entryDates: action.dates };
    case 'SET_READY': return { ...state, ready: true };
    case 'SET_CRYPTO': return { ...state, cryptoKey: action.cryptoKey, userId: action.userId, authReady: true };
    case 'SET_AUTH_READY': return { ...state, authReady: true };
    case 'CLEAR_CRYPTO': return { ...state, cryptoKey: null, userId: null, authReady: false };
    case 'INIT': return { ...state, ...action.state };
    default: return state;
  }
}

const defaultLang = (): Lang => {
  const stored = localStorage.getItem('journal:lang');
  if (stored === 'en' || stored === 'es') return stored;
  return navigator.language.startsWith('es') ? 'es' : 'en';
};

const initialState: AppState = {
  lang: defaultLang(),
  theme: (localStorage.getItem('journal:theme') as Theme) || 'light',
  currentDate: getToday(),
  entry: emptyEntry(),
  guided: !!localStorage.getItem('journal:guided'),
  guideOpen: false,
  entryDates: [],
  ready: false,
  cryptoKey: null,
  userId: null,
  authReady: false,
};

interface ContextValue {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<ContextValue>({ state: initialState, dispatch: () => {} });

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Migrate localStorage and load persisted preferences from IndexedDB
  useEffect(() => {
    (async () => {
      await migrateFromLocalStorage();
      const [theme, lang, guided] = await Promise.all([
        getMeta('theme'),
        getMeta('lang'),
        getMeta('guided'),
      ]);
      dispatch({
        type: 'INIT',
        state: {
          theme: theme || initialState.theme,
          lang: lang || initialState.lang,
          guided: !!guided,
          guideOpen: !guided,
        },
      });
      dispatch({ type: 'SET_READY' });
    })();
  }, []);

  // Persist theme to body class and IndexedDB
  useEffect(() => {
    document.body.classList.toggle('dark', state.theme === 'dark');
    if (state.ready) setMeta('theme', state.theme);
  }, [state.theme, state.ready]);

  // Persist lang
  useEffect(() => {
    document.documentElement.lang = state.lang;
    if (state.ready) setMeta('lang', state.lang);
  }, [state.lang, state.ready]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  return useContext(AppContext);
}
