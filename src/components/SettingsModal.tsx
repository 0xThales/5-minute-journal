import { useState, useRef } from 'react';
import { useApp } from '../contexts/AppContext';
import { exportEncrypted, exportPlaintext, importEncrypted, importPlaintext } from '../lib/export';

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useApp();
  const [status, setStatus] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMode, setImportMode] = useState<'encrypted' | 'plaintext' | null>(null);

  const handleExportEncrypted = async () => {
    if (!state.cryptoKey) {
      setStatus('Set up a passphrase first to export encrypted backups.');
      return;
    }
    await exportEncrypted(state.cryptoKey);
    setStatus('Encrypted backup downloaded.');
  };

  const handleExportPlaintext = async () => {
    await exportPlaintext();
    setStatus('Plaintext backup downloaded.');
  };

  const handleImportClick = (mode: 'encrypted' | 'plaintext') => {
    setImportMode(mode);
    fileRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !importMode) return;

    try {
      let count: number;
      if (importMode === 'encrypted') {
        if (!state.cryptoKey) {
          setStatus('Set up a passphrase first to import encrypted backups.');
          return;
        }
        count = await importEncrypted(file, state.cryptoKey);
      } else {
        count = await importPlaintext(file);
      }
      setStatus(`Imported ${count} entries.`);
    } catch {
      setStatus('Import failed. Check the file and try again.');
    }

    // Reset file input
    if (fileRef.current) fileRef.current.value = '';
    setImportMode(null);
  };

  if (!open) return null;

  const linkStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    color: '#6B635B',
    fontFamily: "'Lora', Georgia, serif",
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '0.6rem 0',
    display: 'block',
    width: '100%',
    textAlign: 'left',
    letterSpacing: '0.02em',
  };

  return (
    <div
      className="guide-overlay visible"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="guide" style={{ maxWidth: 400 }}>
        <button className="guide-close" onClick={onClose}>&times;</button>
        <h2>Settings</h2>
        <hr className="guide-divider" />

        <div style={{ marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#A09890', marginBottom: '0.75rem' }}>
            Export
          </p>
          <button style={linkStyle} onClick={handleExportPlaintext}>
            Download my journal (readable)
          </button>
          <button style={linkStyle} onClick={handleExportEncrypted}>
            Download encrypted backup
          </button>
        </div>

        <hr className="guide-divider" />

        <div style={{ marginBottom: '0.5rem' }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 400, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#A09890', marginBottom: '0.75rem' }}>
            Import
          </p>
          <button style={linkStyle} onClick={() => handleImportClick('plaintext')}>
            Import from plaintext backup
          </button>
          <button style={linkStyle} onClick={() => handleImportClick('encrypted')}>
            Import from encrypted backup
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
        </div>

        {status && (
          <>
            <hr className="guide-divider" />
            <p className="guide-privacy">{status}</p>
          </>
        )}
      </div>
    </div>
  );
}
