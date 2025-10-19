import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import RegisterForm from '../../src/components/RegisterForm.jsx';

// Mock API calls
const mockRegisterAPI = vi.fn();
const mockSendCodeAPI = vi.fn();

vi.mock('../../src/utils/api', () => ({
  register: (...args: any[]) => mockRegisterAPI(...args),
  sendVerificationCode: (...args: any[]) => mockSendCodeAPI(...args)
}));

describe('RegisterForm Component Tests', () => {
  const mockOnRegisterSuccess = vi.fn();
  const mockOnRegisterError = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('组件渲染测试', () => {
    it('应该渲染所有必需的输入字段', () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/手机号/)).toBeInTheDocument();
      expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
      expect(screen.getByLabelText(/验证码/)).toBeInTheDocument();
      expect(screen.getByLabelText(/密码/)).toBeInTheDocument();
      expect(screen.getByLabelText(/确认密码/)).toBeInTheDocument();
      expect(screen.getByLabelText(/真实姓名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/身份证号/)).toBeInTheDocument();
    });

    it('应该渲染获取验证码按钮和注册按钮', () => {
      render(<RegisterForm />);

      expect(screen.getByRole('button', { name: /获取验证码/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /注册/ })).toBeInTheDocument();
    });
  });

  describe('验证码功能测试', () => {
    it('点击获取验证码按钮时启动60秒倒计时', async () => {
      const user = userEvent.setup();
      mockSendCodeAPI.mockResolvedValue({ success: true });

      render(<RegisterForm />);

      // 输入手机号
      const phoneInput = screen.getByLabelText(/手机号/);
      await user.type(phoneInput, '13800138000');

      // 点击获取验证码按钮
      const sendCodeButton = screen.getByRole('button', { name: /获取验证码/ });
      await user.click(sendCodeButton);

      // 验证API被调用
      expect(mockSendCodeAPI).toHaveBeenCalledWith({
        phoneNumber: '13800138000',
        type: 'register'
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

      render(<RegisterForm />);

      const phoneInput = screen.getByLabelText(/手机号/);
      await user.type(phoneInput, '13800138000');

      const sendCodeButton = screen.getByRole('button', { name: /获取验证码/ });
      await user.click(sendCodeButton);

      await waitFor(() => {
        expect(sendCodeButton).toBeDisabled();
      });
    });

    it('应该在手机号为空时禁用获取验证码按钮', () => {
      render(<RegisterForm />);

      const sendCodeButton = screen.getByRole('button', { name: /获取验证码/ });
      expect(sendCodeButton).toBeDisabled();
    });
  });

  describe('表单验证测试', () => {
    it('应该验证手机号格式', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const phoneInput = screen.getByLabelText(/手机号/);
      await user.type(phoneInput, '123');
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        expect(screen.getByText(/手机号格式不正确/)).toBeInTheDocument();
      });
    });

    it('应该验证邮箱格式', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const emailInput = screen.getByLabelText(/邮箱/);
      await user.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/邮箱格式不正确/)).toBeInTheDocument();
      });
    });

    it('应该验证密码强度', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^密码$/);
      await user.type(passwordInput, '123');
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/密码至少8位，包含字母和数字/)).toBeInTheDocument();
      });
    });

    it('应该验证确认密码一致性', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const passwordInput = screen.getByLabelText(/^密码$/);
      const confirmPasswordInput = screen.getByLabelText(/确认密码/);

      await user.type(passwordInput, 'Password123!');
      await user.type(confirmPasswordInput, 'DifferentPassword');
      fireEvent.blur(confirmPasswordInput);

      await waitFor(() => {
        expect(screen.getByText(/两次密码不一致/)).toBeInTheDocument();
      });
    });

    it('应该验证身份证号格式', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const idCardInput = screen.getByLabelText(/身份证号/);
      await user.type(idCardInput, '123456');
      fireEvent.blur(idCardInput);

      await waitFor(() => {
        expect(screen.getByText(/身份证号格式不正确/)).toBeInTheDocument();
      });
    });

    it('应该验证所有必填字段', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const registerButton = screen.getByRole('button', { name: /注册/ });
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByText(/请输入手机号/)).toBeInTheDocument();
        expect(screen.getByText(/请输入邮箱/)).toBeInTheDocument();
        expect(screen.getByText(/请输入验证码/)).toBeInTheDocument();
        expect(screen.getByText(/请输入密码/)).toBeInTheDocument();
        expect(screen.getByText(/请输入真实姓名/)).toBeInTheDocument();
        expect(screen.getByText(/请输入身份证号/)).toBeInTheDocument();
      });
    });
  });

  describe('注册提交测试', () => {
    it('应该在表单验证通过时调用注册API', async () => {
      const user = userEvent.setup();
      const mockUserData = {
        phoneNumber: '13800138000',
        email: 'test@example.com',
        verificationCode: '123456',
        password: 'Password123!',
        realName: '张三',
        idCard: '110101199001011234'
      };

      mockRegisterAPI.mockResolvedValue({
        success: true,
        data: { userId: 1, token: 'mock-token' }
      });

      render(<RegisterForm onRegisterSuccess={mockOnRegisterSuccess} />);

      // 填写表单
      await user.type(screen.getByLabelText(/手机号/), mockUserData.phoneNumber);
      await user.type(screen.getByLabelText(/邮箱/), mockUserData.email);
      await user.type(screen.getByLabelText(/验证码/), mockUserData.verificationCode);
      await user.type(screen.getByLabelText(/^密码$/), mockUserData.password);
      await user.type(screen.getByLabelText(/确认密码/), mockUserData.password);
      await user.type(screen.getByLabelText(/真实姓名/), mockUserData.realName);
      await user.type(screen.getByLabelText(/身份证号/), mockUserData.idCard);

      // 提交表单
      const registerButton = screen.getByRole('button', { name: /注册/ });
      await user.click(registerButton);

      // 验证API调用
      await waitFor(() => {
        expect(mockRegisterAPI).toHaveBeenCalledWith(mockUserData);
        expect(mockOnRegisterSuccess).toHaveBeenCalledWith({
          userId: 1,
          token: 'mock-token'
        });
      });
    });

    it('应该在注册过程中显示加载状态', async () => {
      const user = userEvent.setup();
      mockRegisterAPI.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<RegisterForm />);

      // 填写有效表单数据
      await user.type(screen.getByLabelText(/手机号/), '13800138000');
      await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
      await user.type(screen.getByLabelText(/验证码/), '123456');
      await user.type(screen.getByLabelText(/^密码$/), 'Password123!');
      await user.type(screen.getByLabelText(/确认密码/), 'Password123!');
      await user.type(screen.getByLabelText(/真实姓名/), '张三');
      await user.type(screen.getByLabelText(/身份证号/), '110101199001011234');

      const registerButton = screen.getByRole('button', { name: /注册/ });
      await user.click(registerButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /注册中.../ })).toBeDisabled();
      });
    });

    it('应该在注册失败时调用错误回调', async () => {
      const user = userEvent.setup();
      const errorMessage = '手机号已被注册';
      mockRegisterAPI.mockRejectedValue(new Error(errorMessage));

      render(<RegisterForm onRegisterError={mockOnRegisterError} />);

      // 填写有效表单数据
      await user.type(screen.getByLabelText(/手机号/), '13800138000');
      await user.type(screen.getByLabelText(/邮箱/), 'test@example.com');
      await user.type(screen.getByLabelText(/验证码/), '123456');
      await user.type(screen.getByLabelText(/^密码$/), 'Password123!');
      await user.type(screen.getByLabelText(/确认密码/), 'Password123!');
      await user.type(screen.getByLabelText(/真实姓名/), '张三');
      await user.type(screen.getByLabelText(/身份证号/), '110101199001011234');

      const registerButton = screen.getByRole('button', { name: /注册/ });
      await user.click(registerButton);

      await waitFor(() => {
        expect(mockOnRegisterError).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('输入限制测试', () => {
    it('应该限制手机号输入长度为11位', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const phoneInput = screen.getByLabelText(/手机号/);
      await user.type(phoneInput, '138001380001234');

      expect(phoneInput).toHaveValue('13800138000');
    });

    it('应该限制验证码输入长度为6位', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const codeInput = screen.getByLabelText(/验证码/);
      await user.type(codeInput, '1234567890');

      expect(codeInput).toHaveValue('123456');
    });

    it('应该限制身份证号输入长度为18位', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const idCardInput = screen.getByLabelText(/身份证号/);
      await user.type(idCardInput, '11010119900101123412345');

      expect(idCardInput).toHaveValue('110101199001011234');
    });
  });

  describe('无障碍测试', () => {
    it('应该为所有输入字段提供正确的标签', () => {
      render(<RegisterForm />);

      expect(screen.getByLabelText(/手机号/)).toBeInTheDocument();
      expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
      expect(screen.getByLabelText(/验证码/)).toBeInTheDocument();
      expect(screen.getByLabelText(/^密码$/)).toBeInTheDocument();
      expect(screen.getByLabelText(/确认密码/)).toBeInTheDocument();
      expect(screen.getByLabelText(/真实姓名/)).toBeInTheDocument();
      expect(screen.getByLabelText(/身份证号/)).toBeInTheDocument();
    });

    it('应该为错误信息提供适当的aria属性', async () => {
      const user = userEvent.setup();
      render(<RegisterForm />);

      const phoneInput = screen.getByLabelText(/手机号/);
      await user.type(phoneInput, '123');
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        const errorMessage = screen.getByText(/手机号格式不正确/);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});