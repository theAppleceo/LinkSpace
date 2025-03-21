import CryptoJS from 'crypto-js';
secretKey = import.meta.env.VITE_AES_KEY;

// Encrypt a message
export const encryptMessage = (message) => {
    return CryptoJS.AES.encrypt(message, secretKey).toString();
}

// Decrypt a message
export const decryptMessage = (encryptedMessage) => {
    const bytes = CryptoJS.AES.decrypt(encryptedMessage, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
};