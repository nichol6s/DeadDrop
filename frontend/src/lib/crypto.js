/**
 * DeadDrop Zero-Knowledge Client-Side Cryptography Module
 * Uses standard Web Crypto API (AES-GCM 256 bits).
 */

// Helper: Uint8Array to Base64
export function bufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Base64 to Uint8Array
export function base64ToBuffer(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

// Helper: Base64 to Base64URL
export function base64ToBase64Url(base64) {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Helper: Base64URL to Base64
export function base64UrlToBase64(base64url) {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return base64;
}

/**
 * Encrypts a plaintext string on the client.
 * Returns the ciphertext (base64), initialization vector (base64) and raw key (base64url).
 */
export async function encryptSecret(plaintext) {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const subtle = cryptoObj.subtle;

  // 1. Generate 256-bit symmetric AES-GCM key
  const key = await subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  // 2. Generate random 12-byte IV
  const iv = cryptoObj.getRandomValues(new Uint8Array(12));

  // 3. Encrypt payload
  const encodedText = new TextEncoder().encode(plaintext);
  const ciphertextBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedText
  );

  // 4. Export raw key bytes and convert to base64url for URL fragment safety
  const rawKeyBuffer = await subtle.exportKey('raw', key);
  const keyBase64 = base64ToBase64Url(bufferToBase64(rawKeyBuffer));

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer),
    keyBase64,
  };
}

/**
 * Decrypts a ciphertext with IV and raw key.
 */
export async function decryptSecret(ciphertextBase64, ivBase64, keyBase64Url) {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const subtle = cryptoObj.subtle;

  // 1. Convert base64url key to raw buffer and import key
  const rawKeyBuffer = base64ToBuffer(base64UrlToBase64(keyBase64Url));
  const key = await subtle.importKey(
    'raw',
    rawKeyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  // 2. Decode ciphertext and IV
  const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
  const ivBuffer = base64ToBuffer(ivBase64);

  // 3. Decrypt
  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
    key,
    ciphertextBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}
