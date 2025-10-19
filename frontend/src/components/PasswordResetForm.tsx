import React, { useState, useEffect } from 'react';
import { authAPI } from '../utils/api';
import { getValidationError } from '../utils/validation';

interface PasswordResetFormProps {
  onResetSuccess?: () => void;
  onResetError?: (error: string) => void;
  onBackToLogin?: () => void;
  initialValues?: any;
}

interface PasswordResetFormState {
  resetType: 'phone' | 'email';
  phoneNumber: string;
  email: string;
  verificationCode: string;
  newPassword: string;
  confirmPassword: string;
  isLoading: boolean;
  errors: Record<string, string>;
  codeCountdown: number;
  step: 'verify' | 'reset'; // 验证身份 -> 重置密码
}

const PasswordResetForm: React.FC<PasswordResetFormProps> = ({
  onResetSuccess,
  onResetError,
  onBackToLogin,
  initialValues
}) => {
  const [state, setState] = useState<PasswordResetFormState>({
    resetType: initialValues?.resetType || 'phone',
    phoneNumber: initialValues?.phoneNumber || '',
    email: initialValues?.email || '',
    verificationCode: '',
    newPassword: '',
    confirmPassword: '',
    isLoading: false,
    errors: {},
    codeCountdown: 0,
    step: 'verify'
  });

  // 验证码倒计时
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state.codeCountdown > 0) {
      timer = setTimeout(() => {
        setState(prev => ({ ...prev, codeCountdown: prev.codeCountdown - 1 }));
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [state.codeCountdown]);

  const handleInputChange = (field: keyof PasswordResetFormState, value: string) => {
    setState(prev => ({
      ...prev,
      [field]: value,
      errors: { ...prev.errors, [field]: '' }
    }));
  };

  const handleResetTypeChange = (type: 'phone' | 'email') => {
    setState(prev => ({
      ...prev,
      resetType: type,
      errors: {}
    }));
  };

  const handleSendVerificationCode = async () => {
    const target = state.resetType === 'phone' ? state.phoneNumber : state.email;
    const fieldName = state.resetType === 'phone' ? 'phoneNumber' : 'email';
    const validationType = state.resetType === 'phone' ? 'phoneNumber' : 'email';
    
    const error = getValidationError(validationType, target);
    if (error) {
      setState(prev => ({ ...prev, errors: { ...prev.errors, [fieldName]: error } }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true }));
    try {
      if (state.resetType === 'phone') {
        await authAPI.sendVerificationCode(state.phoneNumber);
      } else {
        await authAPI.sendEmailVerificationCode(state.email);
      }
      setState(prev => ({ ...prev, codeCountdown: 60 }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        errors: { ...prev.errors, [fieldName]: error.message || '发送验证码失败' }
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleVerifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    
    const target = state.resetType === 'phone' ? state.phoneNumber : state.email;
    const fieldName = state.resetType === 'phone' ? 'phoneNumber' : 'email';
    const validationType = state.resetType === 'phone' ? 'phoneNumber' : 'email';
    
    const targetError = getValidationError(validationType, target);
    if (targetError) errors[fieldName] = targetError;
    
    const codeError = getValidationError('verificationCode', state.verificationCode);
    if (codeError) errors.verificationCode = codeError;

    if (Object.keys(errors).length > 0) {
      setState(prev => ({ ...prev, errors }));
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      if (state.resetType === 'phone') {
        await authAPI.verifyResetCode(state.phoneNumber, state.verificationCode);
      } else {
        await authAPI.verifyEmailResetCode(state.email, state.verificationCode);
      }
      setState(prev => ({ ...prev, step: 'reset', errors: {} }));
    } catch (error: any) {
      setState(prev => ({ 
        ...prev, 
        errors: { verificationCode: error.message || '验证码错误' }
      }));
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const errors: Record<string, string> = {};
    
    const passwordError = getValidationError('password', state.newPassword);
    if (passwordError) errors.newPassword = passwordError;
    
    if (state.newPassword !== state.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致';
    }

    if (Object.keys(errors).length > 0) {
      setState(prev => ({ ...prev, errors }));
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true }));
    
    try {
      const target = state.resetType === 'phone' ? state.phoneNumber : state.email;
      if (state.resetType === 'phone') {
        await authAPI.resetPassword(state.phoneNumber, state.verificationCode, state.newPassword);
      } else {
        await authAPI.resetPasswordByEmail(state.email, state.verificationCode, state.newPassword);
      }
      onResetSuccess?.();
    } catch (error: any) {
      onResetError?.(error.message || '密码重置失败');
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const validateVerifyForm = () => {
    const target = state.resetType === 'phone' ? state.phoneNumber : state.email;
    const validationType = state.resetType === 'phone' ? 'phoneNumber' : 'email';
    
    const targetError = getValidationError(validationType, target);
    const codeError = getValidationError('verificationCode', state.verificationCode);
    
    return !targetError && !codeError && target.trim() !== '' && state.verificationCode.trim() !== '';
  };

  const validateResetForm = () => {
    const passwordError = getValidationError('password', state.newPassword);
    const passwordsMatch = state.newPassword === state.confirmPassword;
    
    return !passwordError && passwordsMatch && state.newPassword.trim() !== '' && state.confirmPassword.trim() !== '';
  };

  const handleBackToLogin = () => {
    if (onBackToLogin) {
      onBackToLogin();
    }
  };

  return (
    <div className="password-reset-form">
      <h2>找回密码</h2>
      
      {state.step === 'verify' && (
        <>
          {/* 重置方式切换 */}
          <div className="reset-type-tabs">
            <button
              type="button"
              className={`tab ${state.resetType === 'phone' ? 'active' : ''}`}
              onClick={() => handleResetTypeChange('phone')}
              disabled={state.isLoading}
            >
              手机号找回
            </button>
            <button
              type="button"
              className={`tab ${state.resetType === 'email' ? 'active' : ''}`}
              onClick={() => handleResetTypeChange('email')}
              disabled={state.isLoading}
            >
              邮箱找回
            </button>
          </div>

          <form onSubmit={handleVerifyCode}>
            {/* 手机号输入框 */}
            {state.resetType === 'phone' && (
              <div className="form-group">
                <label htmlFor="phoneNumber">手机号</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  value={state.phoneNumber}
                  onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                  placeholder="请输入注册时的手机号"
                  disabled={state.isLoading}
                />
                {state.errors.phoneNumber && (
                  <span className="error">{state.errors.phoneNumber}</span>
                )}
              </div>
            )}

            {/* 邮箱输入框 */}
            {state.resetType === 'email' && (
              <div className="form-group">
                <label htmlFor="email">邮箱</label>
                <input
                  type="email"
                  id="email"
                  value={state.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="请输入注册时的邮箱地址"
                  disabled={state.isLoading}
                />
                {state.errors.email && (
                  <span className="error">{state.errors.email}</span>
                )}
              </div>
            )}

            {/* 验证码输入框 */}
            <div className="form-group">
              <label htmlFor="verificationCode">验证码</label>
              <div className="verification-code-group">
                <input
                  type="text"
                  id="verificationCode"
                  value={state.verificationCode}
                  onChange={(e) => handleInputChange('verificationCode', e.target.value)}
                  placeholder="请输入验证码"
                  disabled={state.isLoading}
                  maxLength={6}
                />
                <button
                  type="button"
                  onClick={handleSendVerificationCode}
                  disabled={state.isLoading || state.codeCountdown > 0}
                >
                  {state.codeCountdown > 0 ? `${state.codeCountdown}s` : '获取验证码'}
                </button>
              </div>
              {state.errors.verificationCode && (
                <span className="error">{state.errors.verificationCode}</span>
              )}
            </div>

            {/* 验证按钮 */}
            <button
              type="submit"
              className="verify-button"
              disabled={state.isLoading}
            >
              {state.isLoading ? '验证中...' : '下一步'}
            </button>
          </form>
        </>
      )}

      {state.step === 'reset' && (
        <form onSubmit={handleResetPassword}>
          {/* 新密码输入框 */}
          <div className="form-group">
            <label htmlFor="newPassword">新密码</label>
            <input
              type="password"
              id="newPassword"
              value={state.newPassword}
              onChange={(e) => handleInputChange('newPassword', e.target.value)}
              placeholder="请设置新密码"
              disabled={state.isLoading}
            />
            {state.errors.newPassword && (
              <span className="error">{state.errors.newPassword}</span>
            )}
          </div>

          {/* 确认密码输入框 */}
          <div className="form-group">
            <label htmlFor="confirmPassword">确认密码</label>
            <input
              type="password"
              id="confirmPassword"
              value={state.confirmPassword}
              onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              placeholder="请再次输入新密码"
              disabled={state.isLoading}
            />
            {state.errors.confirmPassword && (
              <span className="error">{state.errors.confirmPassword}</span>
            )}
          </div>

          {/* 重置密码按钮 */}
            <button
              type="submit"
              className="reset-button"
              disabled={state.isLoading}
            >
              {state.isLoading ? '重置中...' : '重置密码'}
            </button>
        </form>
      )}

      {/* 返回登录 */}
      <button
        type="button"
        className="back-to-login-link"
        onClick={handleBackToLogin}
        disabled={state.isLoading}
      >
        返回登录
      </button>
    </div>
  );
};

export default PasswordResetForm;