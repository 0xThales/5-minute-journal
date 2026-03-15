import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { deriveKey, computeUserId } from '../lib/crypto';
import { getMeta, setMeta } from '../lib/db';

export function PassphraseModal() {
  const { state, dispatch } = useApp();
  const [passphrase, setPassphrase] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSetup, setIsSetup] = useState<boolean | null>(null);

  // Determine if this is first setup or returning user
  useState(() => {
    getMeta('hasPassphrase').then((v) => setIsSetup(!v));
  });

  if (state.authReady || isSetup === null) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');

    if (!passphrase) {
      setError('Please enter a passphrase.');
      return;
    }

    if (isSetup && passphrase !== confirm) {
      setError('Passphrases do not match.');
      return;
    }

    setLoading(true);
    try {
      const key = await deriveKey(passphrase);
      const userId = await computeUserId(passphrase);

      // If returning user, validate against stored userId
      if (!isSetup) {
        const storedUserId = await getMeta('userId');
        if (storedUserId && storedUserId !== userId) {
          setError('Wrong passphrase.');
          setLoading(false);
          return;
        }
      }

      // Store markers (never the passphrase or key)
      await setMeta('hasPassphrase', true);
      await setMeta('userId', userId);

      dispatch({ type: 'SET_CRYPTO', cryptoKey: key, userId });
    } catch {
      setError('Something went wrong. Please try again.');
    }
    setLoading(false);
  };

  const handleSkip = () => {
    dispatch({ type: 'SET_AUTH_READY' });
  };

  return (
    <div className="guide-overlay visible">
      <div className="guide">
        <h2>{isSetup ? 'Keep your journal private' : 'Welcome back'}</h2>
        <p className="guide-subtitle">
          {isSetup
            ? 'Choose a passphrase to protect your journal. Only you can read your entries — not us, not anyone. Use the same passphrase on any device to access your journal everywhere.'
            : 'Enter your passphrase to access your journal.'}
        </p>
        {isSetup && (
          <p className="guide-privacy" style={{ marginBottom: '1.5rem' }}>
            Please remember your passphrase. Since we never store it, we can&apos;t help you recover it.
          </p>
        )}
        <hr className="guide-divider" />
        <form onSubmit={handleSubmit} style={{ maxWidth: 360, margin: '0 auto' }}>
          <div style={{ marginBottom: '1rem', position: 'relative' }}>
            <input
              type={showPassphrase ? 'text' : 'password'}
              value={passphrase}
              onChange={(e) => setPassphrase(e.target.value)}
              placeholder="Passphrase"
              autoFocus
              style={{
                width: '100%',
                border: 'none',
                borderBottom: '1px solid #C8C0B8',
                background: 'transparent',
                fontFamily: "'Lora', Georgia, serif",
                fontSize: '1rem',
                color: 'inherit',
                padding: '0.3rem 1.5rem 0.3rem 0',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassphrase(!showPassphrase)}
              aria-label={showPassphrase ? 'Hide passphrase' : 'Show passphrase'}
              style={{
                position: 'absolute',
                right: 0,
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.25rem',
                fontSize: '0.85rem',
                color: '#A09890',
                fontFamily: 'inherit',
                lineHeight: 1,
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
                {showPassphrase && <path d="M1 1l22 22" />}
              </svg>
            </button>
          </div>
          {isSetup && (
            <div style={{ marginBottom: '1rem', position: 'relative' }}>
              <input
                type={showConfirm ? 'text' : 'password'}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Confirm passphrase"
                style={{
                  width: '100%',
                  border: 'none',
                  borderBottom: '1px solid #C8C0B8',
                  background: 'transparent',
                  fontFamily: "'Lora', Georgia, serif",
                  fontSize: '1rem',
                  color: 'inherit',
                  padding: '0.3rem 1.5rem 0.3rem 0',
                  outline: 'none',
                }}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                aria-label={showConfirm ? 'Hide passphrase' : 'Show passphrase'}
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.25rem',
                  fontSize: '0.85rem',
                  color: '#A09890',
                  fontFamily: 'inherit',
                  lineHeight: 1,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                  {showConfirm && <path d="M1 1l22 22" />}
                </svg>
              </button>
            </div>
          )}
          {error && (
            <p style={{ color: '#C44', fontSize: '0.8rem', marginBottom: '1rem', textAlign: 'center' }}>
              {error}
            </p>
          )}
          <button
            type="submit"
            className="guide-start"
            disabled={loading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {loading ? '...' : isSetup ? 'Get started' : 'Unlock'}
          </button>
        </form>
        <button
          onClick={handleSkip}
          style={{
            display: 'block',
            margin: '1.25rem auto 0',
            background: 'none',
            border: 'none',
            color: '#A09890',
            fontFamily: "'Lora', Georgia, serif",
            fontSize: '0.75rem',
            cursor: 'pointer',
            letterSpacing: '0.05em',
          }}
        >
          Just use on this device
        </button>
      </div>
    </div>
  );
}
