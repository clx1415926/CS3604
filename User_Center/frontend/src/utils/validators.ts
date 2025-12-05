/**
 * 验证18位身份证号码
 */
export function validateIdCard18(id: string): boolean {
  if (!/^\d{17}[\dXx]$/.test(id)) return false;
  
  // 加权因子
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  // 校验码
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id[i]) * weights[i];
  }
  
  const checkCode = checkCodes[sum % 11];
  return id[17].toUpperCase() === checkCode;
}

/**
 * 将15位身份证转换为18位
 */
export function convert15to18(id15: string): string {
  if (id15.length !== 15) return id15;
  
  // 15位身份证格式: LLLLLLYYMMDDXXX
  // 转换为18位: LLLLLLYYYYMMDDXXXC (19YY年)
  const id17 = id15.substring(0, 6) + '19' + id15.substring(6);
  
  // 计算校验码
  const weights = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
  const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
  
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    sum += parseInt(id17[i]) * weights[i];
  }
  
  const checkCode = checkCodes[sum % 11];
  return id17 + checkCode;
}

/**
 * 验证手机号码
 */
export function validatePhone(countryCode: string, phoneNumber: string): boolean {
  if (countryCode === '+86') {
    // 中国大陆手机号: 1开头的11位数字
    return /^1[3-9]\d{9}$/.test(phoneNumber);
  }
  if (countryCode === '+852') {
    // 香港手机号: 5/6/8/9开头的8位数字
    return /^[5689]\d{7}$/.test(phoneNumber);
  }
  if (countryCode === '+853') {
    // 澳门手机号: 6开头的8位数字
    return /^6\d{7}$/.test(phoneNumber);
  }
  if (countryCode === '+886') {
    // 台湾手机号: 09开头的10位数字
    return /^09\d{8}$/.test(phoneNumber);
  }
  // 其他国家/地区的手机号暂不验证
  return phoneNumber.length >= 5 && phoneNumber.length <= 15;
}
