import test from 'node:test';
import assert from 'node:assert/strict';
import { encryptSecret, decryptSecret } from './crypto.ts';

test('encryptSecret and decryptSecret roundtrip with AES-256-GCM', async () => {
  const secretText = 'DATABASE_URL=postgres://user:example@localhost:5432/dev\nMENSAGEM=Olá, ação 🔐\nPORT=8080';
  
  const encrypted = await encryptSecret(secretText);
  
  assert.ok(encrypted.ciphertext, 'Ciphertext should not be empty');
  assert.ok(encrypted.iv, 'IV should not be empty');
  assert.ok(encrypted.keyBase64, 'KeyBase64 should not be empty');
  assert.notEqual(encrypted.ciphertext, secretText, 'Ciphertext must not be plaintext');
  
  const decrypted = await decryptSecret(encrypted.ciphertext, encrypted.iv, encrypted.keyBase64);
  assert.equal(decrypted, secretText, 'Decrypted text must match original secret exactly');
});

test('decryptSecret fails with authentication tag error when ciphertext is tampered', async () => {
  const secretText = 'Confidential Bank Token #1234';
  const encrypted = await encryptSecret(secretText);
  
  // Tamper ciphertext
  const bytes = Buffer.from(encrypted.ciphertext, 'base64');
  bytes[0] ^= 1;
  const tamperedCiphertext = bytes.toString('base64');
  
  await assert.rejects(
    async () => {
      await decryptSecret(tamperedCiphertext, encrypted.iv, encrypted.keyBase64);
    },
    /operation failed|tag/i,
    'Decryption of tampered ciphertext should be rejected'
  );
});
