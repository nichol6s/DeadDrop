/**
 * DeadDrop Zero-Knowledge Client-Side Cryptography Module (TypeScript)
 * Uses standard Web Crypto API (AES-GCM 256 bits).
 */

export interface EncryptedSecret {
  ciphertext: string;
  iv: string;
  keyBase64: string;
}

export function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

export function base64ToBase64Url(base64: string): string {
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function base64UrlToBase64(base64url: string): string {
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  return base64;
}

export async function encryptSecret(plaintext: string): Promise<EncryptedSecret> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const subtle = cryptoObj.subtle;

  const key = await subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = cryptoObj.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(plaintext);
  const ciphertextBuffer = await subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    encodedText
  );

  const rawKeyBuffer = await subtle.exportKey('raw', key);
  const keyBase64 = base64ToBase64Url(bufferToBase64(rawKeyBuffer));

  return {
    ciphertext: bufferToBase64(ciphertextBuffer),
    iv: bufferToBase64(iv.buffer),
    keyBase64,
  };
}

export async function decryptSecret(ciphertextBase64: string, ivBase64: string, keyBase64Url: string): Promise<string> {
  const cryptoObj = typeof window !== 'undefined' ? window.crypto : globalThis.crypto;
  const subtle = cryptoObj.subtle;

  const rawKeyBuffer = base64ToBuffer(base64UrlToBase64(keyBase64Url));
  const key = await subtle.importKey(
    'raw',
    rawKeyBuffer,
    { name: 'AES-GCM' },
    false,
    ['decrypt']
  );

  const ciphertextBuffer = base64ToBuffer(ciphertextBase64);
  const ivBuffer = base64ToBuffer(ivBase64);

  const decryptedBuffer = await subtle.decrypt(
    { name: 'AES-GCM', iv: new Uint8Array(ivBuffer) },
    key,
    ciphertextBuffer
  );

  return new TextDecoder().decode(decryptedBuffer);
}
