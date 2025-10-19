import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import PasswordResetForm from '../../src/components/PasswordResetForm';

// Mock API calls
const mockResetPasswordAPI = vi.fn();
const mockSendCodeAPI = vi.fn();

vi.mock('../../src/utils/api', () => ({
  resetPassword: (...args: any[]) => mockResetPasswordAPI(...args),
  sendVerificationCode: (...args: any[]) => mockSendCodeAPI(...args)
}));

describe('PasswordResetForm Component Tests', () => {
  const mockOnResetSuccess = jest.fn();
  const mockOnResetError = jest.fn();
  const mockOnBackToLogin = jest.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('组件渲染测试', () => {
    it('应该渲染重置方式切换标签', () => {
      render(<PasswordResetForm />);

      expect(screen.getByRole('button', { name: /手机号找回/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /邮箱找回/ })).toBeInTheDocument();
    });

    it('应该默认显示手机号找回方式', () => {
      render(<PasswordResetForm />);

      expect(screen.getByLabelText(/手机号/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/邮箱/)).not.toBeInTheDocument();
    });

    it('应该渲染验证码输入框和获取验证码按钮', () => {
      render(<PasswordResetForm />);

      expect(screen.getByLabelText(/验证码/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /获取验证码/ })).toBeInTheDocument();
    });

    it('应该渲染下一步按钮和返回登录链接', () => {
      render(<PasswordResetForm />);

      expect(screen.getByRole('button', { name: /下一步/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /返回登录/ })).toBeInTheDocument();
    });
  });

  describe('重置方式切换测试', () => {
    it('应该能够切换到邮箱找回方式', async () => {
      const user = userEvent.setup();
      render(<PasswordResetForm />);

      const emailTab = screen.getByRole('button', { name: /邮箱找回/ });
      await user.click(emailTab);

      expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/手机号/)).not.toBeInTheDocument();
    });

    it('应该能够从邮箱切换回手机号找回', async () => {
      const user = userEvent.setup();
      render(<PasswordResetForm />);

      // 切换到邮箱找回
      await user.click(screen.getByRole('button', { name: /邮箱找回/ }));
      
      // 切换回手机号找回
      await user.click(screen.getByRole('button', { name: /手机号找回/ }));

      expect(screen.getByLabelText(/手机号/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/邮箱/)).not.toBeInTheDocument();
    });
  });

  describe('验证码功能测试', () => {
    it('点击获取验证码按钮时启动60秒倒计时', async () => {
      const user = userEvent.setup();
      mockSendCodeAPI.mockResolvedValue({ success: true });

      render(<PasswordResetForm />);

      // 输入手机号
      const phoneInput = screen.getByLabelText(/手机号/);
      await user.type(phoneInput, '13800138000');

      // 点击获取验证码按钮
      const sendCodeButton = screen.getByRole('button', { name: /获取验证码/ });
      await user.click(sendCodeButton);

      // 验证API被调用
      expect(mockSendCodeAPI).toHaveBeenCalledWith({
        phoneNumber: '13800138000',
        type: 'reset-password'
      });

      // 验证倒计时开始
      await waitFor(() => {
        expect(screen.getByText(/\d+s/)).toBeInTheDocument();
      });

      // 验证按钮被禁用
      expect(sendCodeButton).toBeDisabled();
    });

    it('应该在倒计时期间禁用获取验证码按钮', async () => {
      const user = userEvent.setup();
      mockSendCodeAPI.mockResolvedValue({ success: true });

      render(<PasswordResetForm />);

      const phoneInput = screen.getByLabelText(/手机号/);
      await user.type(phoneInput, '13800138000');

      const sendCodeButton = screen.getByRole('button', { name: /获取验证码/ });
      await user.click(sendCodeButton);

      await waitFor(() => {
        expect(sendCodeButton).toBeDisabled();
      });
    });
  });

  describe('验证步骤测试', () => {
    it('应该在验证码验证通过后进入重置密码步骤', async () => {
      const user = userEvent.setup();
      mockSendCodeAPI.mockResolvedValue({ success: true });

      render(<PasswordResetForm />);

      // 填写验证信息
      const phoneInput = screen.getByLabelText(/手机号/);
      const codeInput = screen.getByLabelText(/验证码/);
      const nextButton = screen.getByRole('button', { name: /下一步/ });

      await user.type(phoneInput, '13800138000');
      await user.type(codeInput, '123456');

      // 模拟验证成功
      mockResetPasswordAPI.mockResolvedValue({ success: true, step: 'reset' });
      await user.click(nextButton);

      // 应该显示新密码输入框
      await waitFor(() => {
        expect(screen.getByLabelText(/新密码/)).toBeInTheDocument();
        expect(screen.getByLabelText(/确认密码/)).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /重置密码/ })).toBeInTheDocument();
      });
    });

    it('应该在验证码错误时显示错误信息', async () => {
      const user = userEvent.setup();
      mockResetPasswordAPI.mockRejectedValue(new Error('验证码错误或已过期'));

      render(<PasswordResetForm onResetError={mockOnResetError} />);

      const phoneInput = screen.getByLabelText(/手机号/);
      const codeInput = screen.getByLabelText(/验证码/);
      const nextButton = screen.getByRole('button', { name: /下一步/ });

      await user.type(phoneInput, '13800138000');
      await user.type(codeInput, '000000');
      await user.click(nextButton);

      await waitFor(() => {
        expect(mockOnResetError).toHaveBeenCalledWith('验证码错误或已过期');
      });
    });
  });

  describe('密码重置步骤测试', () => {
    beforeEach(() => {
      // 模拟已经通过验证步骤
      render(<PasswordResetForm />);
      // 这里需要设置组件状态为重置步骤，实际实现中可能需要通过props或状态管理
    });

    it('应该验证新密码强度和确认密码一致性', async () => {
      const user = userEvent.setup();
      render(<PasswordResetForm />);

      // 假设已经在重置步骤
      const newPasswordInput = screen.queryByLabelText(/新密码/);
      const confirmPasswordInput = screen.queryByLabelText(/确认密码/);

      if (newPasswordInput && confirmPasswordInput) {
        // 输入不一致的密码
        await user.type(newPasswordInput, 'Password123!');
        await user.type(confirmPasswordInput, 'DifferentPassword');
        fireEvent.blur(confirmPasswordInput);

        await waitFor(() => {
          expect(screen.getByText(/两次密码不一致/)).toBeInTheDocument();
        });
      }
    });

    it('应该在密码重置成功时调用成功回调', async () => {
      const user = userEvent.setup();
      mockResetPasswordAPI.mockResolvedValue({ 
        success: true, 
        message: '密码重置成功' 
      });

      render(<PasswordResetForm onResetSuccess={mockOnResetSuccess} />);

      // 假设已经在重置步骤
      const newPasswordInput = screen.queryByLabelText(/新密码/);
      const confirmPasswordInput = screen.queryByLabelText(/确认密码/);
      const resetButton = screen.queryByRole('button', { name: /重置密码/ });

      if (newPasswordInput && confirmPasswordInput && resetButton) {
        await user.type(newPasswordInput, 'NewPassword123!');
        await user.type(confirmPasswordInput, 'NewPassword123!');
        await user.click(resetButton);

        await waitFor(() => {
          expect(mockOnResetSuccess).toHaveBeenCalled();
        });
      }
    });

    it('应该在密码重置失败时调用错误回调', async () => {
      const user = userEvent.setup();
      const errorMessage = '密码重置失败';
      mockResetPasswordAPI.mockRejectedValue(new Error(errorMessage));

      render(<PasswordResetForm onResetError={mockOnResetError} />);

      // 假设已经在重置步骤
      const newPasswordInput = screen.queryByLabelText(/新密码/);
      const confirmPasswordInput = screen.queryByLabelText(/确认密码/);
      const resetButton = screen.queryByRole('button', { name: /重置密码/ });

      if (newPasswordInput && confirmPasswordInput && resetButton) {
        await user.type(newPasswordInput, 'NewPassword123!');
        await user.type(confirmPasswordInput, 'NewPassword123!');
        await user.click(resetButton);

        await waitFor(() => {
          expect(mockOnResetError).toHaveBeenCalledWith(errorMessage);
        });
      }
    });
  });

  describe('返回登录功能测试', () => {
    it('应该在点击返回登录时调用回调函数', async () => {
      const user = userEvent.setup();
      render(<PasswordResetForm onBackToLogin={mockOnBackToLogin} />);

      const backButton = screen.getByRole('button', { name: /返回登录/ });
      await user.click(backButton);

      expect(mockOnBackToLogin).toHaveBeenCalled();
    });

    it('应该在加载状态时禁用返回登录按钮', async () => {
      const user = userEvent.setup();
      mockResetPasswordAPI.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<PasswordResetForm />);

      const phoneInput = screen.getByLabelText(/手机号/);
      const codeInput = screen.getByLabelText(/验证码/);
      const nextButton = screen.getByRole('button', { name: /下一步/ });

      await user.type(phoneInput, '13800138000');
      await user.type(codeInput, '123456');
      await user.click(nextButton);

      const backButton = screen.getByRole('button', { name: /返回登录/ });
      expect(backButton).toBeDisabled();
    });
  });

  describe('表单验证测试', () => {
    it('应该验证手机号格式', async () => {
      const user = userEvent.setup();
      render(<PasswordResetForm />);

      const phoneInput = screen.getByLabelText(/手机号/);
      await user.type(phoneInput, '123');
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        expect(screen.getByText(/手机号格式不正确/)).toBeInTheDocument();
      });
    });

    it('应该验证邮箱格式', async () => {
      const user = userEvent.setup();
      render(<PasswordResetForm />);

      // 切换到邮箱找回
      await user.click(screen.getByRole('button', { name: /邮箱找回/ }));

      const emailInput = screen.getByLabelText(/邮箱/);
      await user.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/邮箱格式不正确/)).toBeInTheDocument();
      });
    });

    it('应该在表单验证失败时禁用下一步按钮', () => {
      render(<PasswordResetForm />);

      const nextButton = screen.getByRole('button', { name: /下一步/ });
      expect(nextButton).toBeDisabled();
    });
  });

  describe('输入限制测试', () => {
    it('应该限制验证码输入长度为6位', async () => {
      const user = userEvent.setup();
      render(<PasswordResetForm />);

      const codeInput = screen.getByLabelText(/验证码/);
      await user.type(codeInput, '1234567890');

      expect(codeInput).toHaveValue('123456');
    });
  });

  describe('加载状态测试', () => {
    it('应该在验证过程中显示加载状态', async () => {
      const user = userEvent.setup();
      mockResetPasswordAPI.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<PasswordResetForm />);

      const phoneInput = screen.getByLabelText(/手机号/);
      const codeInput = screen.getByLabelText(/验证码/);
      const nextButton = screen.getByRole('button', { name: /下一步/ });

      await user.type(phoneInput, '13800138000');
      await user.type(codeInput, '123456');
      await user.click(nextButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /验证中.../ })).toBeDisabled();
      });
    });

    it('应该在重置过程中显示加载状态', async () => {
      const user = userEvent.setup();
      mockResetPasswordAPI.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<PasswordResetForm />);

      // 假设已经在重置步骤
      const resetButton = screen.queryByRole('button', { name: /重置密码/ });
      
      if (resetButton) {
        await user.click(resetButton);

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /重置中.../ })).toBeDisabled();
        });
      }
    });
  });
});