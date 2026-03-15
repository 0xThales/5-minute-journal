import { useApp } from '../contexts/AppContext';
import { getDayOfYear } from '../lib/dates';
import { QUOTES } from '../lib/quotes';

export function Quote() {
  const { state } = useApp();
  const dayOfYear = getDayOfYear(state.currentDate);
  const quote = QUOTES[(dayOfYear - 1) % QUOTES.length];
  const text = state.lang === 'es' && quote.es ? quote.es : quote.text;

  return (
    <div className="quote">
      <p>&ldquo;{text}&rdquo;</p>
      <cite>&mdash; {quote.author}</cite>
    </div>
  );
}
