import { useApp } from '../contexts/AppContext';
import { t } from '../lib/i18n';

export function Header() {
  const { state } = useApp();
  return (
    <header>
      <h1>{t(state.lang, 'title')}</h1>
    </header>
  );
}
