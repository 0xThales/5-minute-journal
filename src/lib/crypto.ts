const PBKDF2_ITERATIONS = 100_000;

/** Deterministic salt derived from passphrase (so same passphrase = same key across devices) */
async function deriveSalt(passphrase: string): Promise<Uint8Array> {
  const encoded = new TextEncoder().encode('5mj:' + passphrase);
  const hash = await crypto.subtle.digest('SHA-256', encoded);
  return new Uint8Array(hash).slice(0, 16);
}

/** Derive an AES-256-GCM key from a passphrase */
export async function deriveKey(passphrase: string): Promise<CryptoKey> {
  const salt = await deriveSalt(passphrase);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/** Double-hashed userId — cannot be reversed to passphrase or encryption key */
export async function computeUserId(passphrase: string): Promise<string> {
  const first = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(passphrase));
  const second = await crypto.subtle.digest('SHA-256', first);
  return Array.from(new Uint8Array(second)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Encrypt plaintext JSON string → base64 blob (IV prepended) */
export async function encrypt(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  // Combine IV + ciphertext into one buffer
  const combined = new Uint8Array(iv.length + ciphertext.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(ciphertext), iv.length);
  return btoa(String.fromCharCode(...combined));
}

/** Decrypt base64 blob → plaintext JSON string */
export async function decrypt(key: CryptoKey, blob: string): Promise<string> {
  const raw = Uint8Array.from(atob(blob), (c) => c.charCodeAt(0));
  const iv = raw.slice(0, 12);
  const ciphertext = raw.slice(12);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}

/** Quick validation: try to encrypt+decrypt a test string */
export async function validateKey(key: CryptoKey): Promise<boolean> {
  try {
    const test = 'fmj-validate';
    const encrypted = await encrypt(key, test);
    const decrypted = await decrypt(key, encrypted);
    return decrypted === test;
  } catch {
    return false;
  }
}
