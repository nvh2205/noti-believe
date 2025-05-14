import process from 'process';
import _ from 'lodash';
import * as CryptoJS from 'crypto-js';

export const isProduction = () => {
  return process.env.APP_ENV == 'production';
};

export const isStaging = () => {
  return process.env.APP_ENV == 'develop';
};

export const isMainnet = () => {
  return Boolean(Number(process.env.IS_MAINNET || 0) == 1);
};

export const isTesting = () => {
  return !isProduction();
};

export function encryptPrivateKey(
  privateKey: string,
  secretKey: string,
): string {
  return CryptoJS.AES.encrypt(privateKey, secretKey).toString();
}

export function decryptPrivateKey(
  encryptedPrivateKey: string,
  secretKey: string,
): string {
  const bytes = CryptoJS.AES.decrypt(encryptedPrivateKey, secretKey);
  return bytes.toString(CryptoJS.enc.Utf8);
}
