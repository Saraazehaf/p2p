import CryptoJS from 'crypto-js';

class AESCipher {
  constructor(key, iv) {
    this.key = CryptoJS.enc.Hex.parse(key);
    this.iv = CryptoJS.enc.Hex.parse(iv);
  }

  encrypt(text) {
    const encrypted = CryptoJS.AES.encrypt(text, this.key, { iv: this.iv });
    return encrypted.toString();
  }

  decrypt(encryptedText) {
    const decrypted = CryptoJS.AES.decrypt(encryptedText, this.key, { iv: this.iv });
    return decrypted.toString(CryptoJS.enc.Utf8);
  }
}

export { AESCipher };
