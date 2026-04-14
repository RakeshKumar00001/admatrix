import CryptoJS from 'crypto-js';

const KEY = process.env.ENCRYPTION_KEY || 'default-dev-key-32-chars-long!!!';

export function encryptToken(plaintext: string): string {
  return CryptoJS.AES.encrypt(plaintext, KEY).toString();
}

export function decryptToken(ciphertext: string): string {
  const bytes = CryptoJS.AES.decrypt(ciphertext, KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}
