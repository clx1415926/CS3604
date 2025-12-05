const crypto = require('crypto');

const ENCRYPTION_KEY = '12306-USER-CENTER-SECRET-KEY-32B'; // Must be 32 chars
const IV_LENGTH = 16;

/**
 * 加密文本
 */
function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

/**
 * 解密文本
 */
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

/**
 * 验证18位身份证号码
 * 包含校验码验证和日期验证
 */
function validateIdCard18(id) {
  if (!/^\d{17}[\dXx]$/.test(id)) return false;
  
  // 加权因子
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  // 校验码
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id[i]) * weights[i];
  }
  const last = codes[sum % 11];
  if (last !== id[17].toUpperCase()) return false;

  // 日期验证
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

/**
 * 将15位身份证转换为18位
 * 15位身份证格式: LLLLLLYYMMDDXXX
 * 转换为18位: LLLLLLYYYYMMDDXXXC (19YY年)
 */
function convert15to18(id) {
  if (id.length !== 15) return id;
  
  const id17 = id.substring(0, 6) + '19' + id.substring(6);
  
  // 计算校验码
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const codes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id17[i]) * weights[i];
  }
  return id17 + codes[sum % 11];
}

/**
 * 验证手机号码
 * 支持中国大陆、香港、澳门、台湾及国际手机号
 */
function validatePhone(code, number) {
  if (code === '+86' || !code) { // Default to +86 if no code provided or explicit +86
    // 中国大陆手机号
    // China Mobile: 134-139, 147, 150-152, 157-159, 178, 182-184, 187-188, 198
    // China Unicom: 130-132, 145, 155-156, 166, 171, 175-176, 185-186
    // China Telecom: 133, 149, 153, 173, 177, 180-181, 189, 199
    // CBN: 192
    // MVNOs included in ranges like 170, 171
    const cnRegex = /^1(3\d|4[014-9]|5[0-35-9]|6[2567]|7[0-8]|8\d|9[0-35-9])\d{8}$/;
    return cnRegex.test(number);
  }
  if (code === '+852') {
    // 香港手机号: 5/6/8/9开头的8位数字
    return /^[5689]\d{7}$/.test(number);
  }
  if (code === '+853') {
    // 澳门手机号: 6开头的8位数字
    return /^6\d{7}$/.test(number);
  }
  if (code === '+886') {
    // 台湾手机号: 09开头的10位数字
    return /^09\d{8}$/.test(number);
  }
  // 其他国家/地区的手机号: 5-15位数字
  return /^\d{5,15}$/.test(number);
}

module.exports = {
  encrypt,
  decrypt,
  validateIdCard18,
  convert15to18,
  validatePhone
};
