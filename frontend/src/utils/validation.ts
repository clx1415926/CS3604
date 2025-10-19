// 手机号验证
export const validatePhoneNumber = (phoneNumber: string): boolean => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phoneNumber);
};

// 邮箱验证
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

// 密码强度验证
export const validatePassword = (password: string): boolean => {
  // 至少8位，包含大小写字母、数字和特殊字符
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return passwordRegex.test(password);
};

// 身份证号验证
export const validateIdCard = (idCard: string): boolean => {
  const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\d{3}[0-9Xx]$/;
  return idCardRegex.test(idCard);
};

// 真实姓名验证
export const validateRealName = (realName: string): boolean => {
  const nameRegex = /^[\u4e00-\u9fa5]{2,10}$/;
  return nameRegex.test(realName);
};

// 验证码验证
export const validateVerificationCode = (code: string): boolean => {
  const codeRegex = /^\d{6}$/;
  return codeRegex.test(code);
};

// 获取验证错误消息
export const getValidationError = (field: string, value: string): string => {
  switch (field) {
    case 'phoneNumber':
      if (!value) return '手机号不能为空';
      if (!validatePhoneNumber(value)) return '手机号格式不正确';
      break;
    case 'email':
      if (!value) return '邮箱不能为空';
      if (!validateEmail(value)) return '邮箱格式不正确';
      break;
    case 'password':
      if (!value) return '密码不能为空';
      if (!validatePassword(value)) return '密码至少8位，包含大小写字母、数字和特殊字符';
      break;
    case 'realName':
      if (!value) return '真实姓名不能为空';
      if (!validateRealName(value)) return '请输入2-10位中文姓名';
      break;
    case 'idCard':
      if (!value) return '身份证号不能为空';
      if (!validateIdCard(value)) return '身份证号格式不正确';
      break;
    case 'verificationCode':
      if (!value) return '验证码不能为空';
      if (!validateVerificationCode(value)) return '验证码格式不正确';
      break;
    default:
      return '';
  }
  return '';
};