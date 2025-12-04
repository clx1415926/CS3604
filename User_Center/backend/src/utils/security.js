const crypto = require('crypto');

const ENCRYPTION_KEY = '12306-USER-CENTER-SECRET-KEY-32B'; // Must be 32 chars
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text || !text.includes(':')) return text;
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (e) {
    return text; // Return original if fail (backward compatibility)
  }
}

// ID Card Validators
function validateIdCard18(id) {
  if (!/^\d{17}[\dXx]$/.test(id)) return false;
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id[i]) * weights[i];
  }
  const last = codes[sum % 11];
  if (last !== id[17].toUpperCase()) return false;

  // Date validation
  const year = parseInt(id.substring(6, 10));
  const month = parseInt(id.substring(10, 12));
  const day = parseInt(id.substring(12, 14));
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() + 1 !== month || date.getDate() !== day) {
    return false;
  }
  if (date > new Date()) return false;
  if (year < 1900) return false;

  return true;
}

function convert15to18(id) {
  if (id.length !== 15) return id;
  let id17 = id.substring(0, 6) + '19' + id.substring(6);
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id17[i]) * weights[i];
  }
  return id17 + codes[sum % 11];
}

function validatePhone(code, number) {
  if (code === '+86' || !code) { // Default to +86 if no code provided or explicit +86
    // China Mobile: 134-139, 147, 150-152, 157-159, 178, 182-184, 187-188, 198
    // China Unicom: 130-132, 145, 155-156, 166, 171, 175-176, 185-186
    // China Telecom: 133, 149, 153, 173, 177, 180-181, 189, 199
    // CBN: 192
    // MVNOs included in ranges like 170, 171
    // Regex covers: 13x, 14[0,1,4-9], 15[0-3,5-9], 16[2,5,6,7], 17[0-8], 18x, 19[0-3,5-9]
    const cnRegex = /^1(3\d|4[014-9]|5[0-35-9]|6[2567]|7[0-8]|8\d|9[0-35-9])\d{8}$/;
    return cnRegex.test(number);
  }
  // Basic check for international: 5-15 digits
  return /^\d{5,15}$/.test(number);
}

module.exports = {
  encrypt,
  decrypt,
  validateIdCard18,
  convert15to18,
  validatePhone
};
