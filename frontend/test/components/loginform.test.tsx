import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import LoginForm from '../../src/components/LoginForm';

// Mock API calls
const mockLoginAPI = vi.fn();

vi.mock('../../src/utils/api', () => ({
  login: (...args: any[]) => mockLoginAPI(...args)
}));

describe('LoginForm Component Tests', () => {
  const mockOnLoginSuccess = vi.fn();
  const mockOnLoginError = vi.fn();
  const mockOnForgotPassword = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  describe('组件渲染测试', () => {
    it('应该渲染登录方式切换标签', () => {
      render(<LoginForm />);

      expect(screen.getByRole('button', { name: /手机号登录/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /邮箱登录/ })).toBeInTheDocument();
    });

    it('应该默认显示手机号登录方式', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/手机号/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/邮箱/)).not.toBeInTheDocument();
    });

    it('应该渲染密码输入框和记住我选项', () => {
      render(<LoginForm />);

      expect(screen.getByLabelText(/密码/)).toBeInTheDocument();
      expect(screen.getByRole('checkbox', { name: /记住我/ })).toBeInTheDocument();
    });

    it('应该渲染登录按钮和忘记密码链接', () => {
      render(<LoginForm />);

      expect(screen.getByRole('button', { name: /登录/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /忘记密码/ })).toBeInTheDocument();
    });
  });

  describe('登录方式切换测试', () => {
    it('应该能够切换到邮箱登录方式', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const emailTab = screen.getByRole('button', { name: /邮箱登录/ });
      await user.click(emailTab);

      expect(screen.getByLabelText(/邮箱/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/手机号/)).not.toBeInTheDocument();
    });

    it('应该能够从邮箱切换回手机号登录', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // 切换到邮箱登录
      await user.click(screen.getByRole('button', { name: /邮箱登录/ }));
      
      // 切换回手机号登录
      await user.click(screen.getByRole('button', { name: /手机号登录/ }));

      expect(screen.getByLabelText(/手机号/)).toBeInTheDocument();
      expect(screen.queryByLabelText(/邮箱/)).not.toBeInTheDocument();
    });
  });

  describe('记住我功能测试', () => {
    it('应该在勾选记住我时保存到localStorage', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const rememberCheckbox = screen.getByRole('checkbox', { name: /记住我/ });
      await user.click(rememberCheckbox);

      expect(localStorage.setItem).toHaveBeenCalledWith('rememberMe', 'true');
    });

    it('应该在取消勾选记住我时从localStorage移除', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const rememberCheckbox = screen.getByRole('checkbox', { name: /记住我/ });
      
      // 先勾选
      await user.click(rememberCheckbox);
      // 再取消勾选
      await user.click(rememberCheckbox);

      expect(localStorage.removeItem).toHaveBeenCalledWith('rememberMe');
    });

    it('应该在页面加载时从localStorage恢复记住我状态', () => {
      localStorage.getItem = vi.fn().mockReturnValue('true');
      
      render(<LoginForm />);

      const rememberCheckbox = screen.getByRole('checkbox', { name: /记住我/ });
      expect(rememberCheckbox).toBeChecked();
    });
  });

  describe('登录失败处理测试', () => {
    it('应该在连续登录失败3次后显示验证码', async () => {
      const user = userEvent.setup();
      mockLoginAPI.mockRejectedValue(new Error('用户名或密码错误'));

      render(<LoginForm onLoginError={mockOnLoginError} />);

      const phoneInput = screen.getByLabelText(/手机号/);
      const passwordInput = screen.getByLabelText(/密码/);
      const loginButton = screen.getByRole('button', { name: /登录/ });

      // 模拟3次登录失败
      for (let i = 0; i < 3; i++) {
        await user.clear(phoneInput);
        await user.clear(passwordInput);
        await user.type(phoneInput, '13800138000');
        await user.type(passwordInput, 'wrongpassword');
        await user.click(loginButton);

        await waitFor(() => {
          expect(mockOnLoginError).toHaveBeenCalled();
        });
      }

      // 第4次尝试应该显示验证码
      await waitFor(() => {
        expect(screen.getByLabelText(/验证码/)).toBeInTheDocument();
      });
    });

    it('应该在显示验证码后要求验证码验证', async () => {
      const user = userEvent.setup();
      mockLoginAPI.mockRejectedValue(new Error('验证码错误'));

      render(<LoginForm onLoginError={mockOnLoginError} />);

      // 假设已经显示验证码（通过设置组件状态或props）
      // 这里需要根据实际实现调整
      const phoneInput = screen.getByLabelText(/手机号/);
      const passwordInput = screen.getByLabelText(/密码/);
      const loginButton = screen.getByRole('button', { name: /登录/ });

      await user.type(phoneInput, '13800138000');
      await user.type(passwordInput, 'password123');
      
      // 如果验证码输入框存在
      const captchaInput = screen.queryByLabelText(/验证码/);
      if (captchaInput) {
        await user.type(captchaInput, 'wrong');
      }
      
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockOnLoginError).toHaveBeenCalledWith('验证码错误');
      });
    });
  });

  describe('成功登录测试', () => {
    it('应该在登录成功时调用成功回调并保存JWT token', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 1,
            phoneNumber: '13800138000',
            email: 'test@example.com',
            realName: '张三'
          }
        }
      };

      mockLoginAPI.mockResolvedValue(mockResponse);

      render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);

      const phoneInput = screen.getByLabelText(/手机号/);
      const passwordInput = screen.getByLabelText(/密码/);
      const loginButton = screen.getByRole('button', { name: /登录/ });

      await user.type(phoneInput, '13800138000');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockLoginAPI).toHaveBeenCalledWith({
          phoneNumber: '13800138000',
          password: 'password123'
        });
        expect(mockOnLoginSuccess).toHaveBeenCalledWith(mockResponse.data);
        expect(localStorage.setItem).toHaveBeenCalledWith('token', 'mock-jwt-token');
        expect(localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockResponse.data.user));
      });
    });

    it('应该在邮箱登录成功时正确处理', async () => {
      const user = userEvent.setup();
      const mockResponse = {
        success: true,
        data: {
          token: 'mock-jwt-token',
          user: {
            id: 1,
            email: 'test@example.com',
            realName: '张三'
          }
        }
      };

      mockLoginAPI.mockResolvedValue(mockResponse);

      render(<LoginForm onLoginSuccess={mockOnLoginSuccess} />);

      // 切换到邮箱登录
      await user.click(screen.getByRole('button', { name: /邮箱登录/ }));

      const emailInput = screen.getByLabelText(/邮箱/);
      const passwordInput = screen.getByLabelText(/密码/);
      const loginButton = screen.getByRole('button', { name: /登录/ });

      await user.type(emailInput, 'test@example.com');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockLoginAPI).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123'
        });
        expect(mockOnLoginSuccess).toHaveBeenCalledWith(mockResponse.data);
      });
    });
  });

  describe('加载状态测试', () => {
    it('应该在登录过程中显示加载状态', async () => {
      const user = userEvent.setup();
      mockLoginAPI.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<LoginForm />);

      const phoneInput = screen.getByLabelText(/手机号/);
      const passwordInput = screen.getByLabelText(/密码/);
      const loginButton = screen.getByRole('button', { name: /登录/ });

      await user.type(phoneInput, '13800138000');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /登录中.../ })).toBeDisabled();
      });
    });

    it('应该在加载状态时禁用所有输入', async () => {
      const user = userEvent.setup();
      mockLoginAPI.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(<LoginForm />);

      const phoneInput = screen.getByLabelText(/手机号/);
      const passwordInput = screen.getByLabelText(/密码/);
      const loginButton = screen.getByRole('button', { name: /登录/ });

      await user.type(phoneInput, '13800138000');
      await user.type(passwordInput, 'password123');
      await user.click(loginButton);

      await waitFor(() => {
        expect(phoneInput).toBeDisabled();
        expect(passwordInput).toBeDisabled();
        expect(loginButton).toBeDisabled();
      });
    });
  });

  describe('错误回调测试', () => {
    it('应该在登录失败时调用错误回调', async () => {
      const user = userEvent.setup();
      const errorMessage = '用户名或密码错误';
      mockLoginAPI.mockRejectedValue(new Error(errorMessage));

      render(<LoginForm onLoginError={mockOnLoginError} />);

      const phoneInput = screen.getByLabelText(/手机号/);
      const passwordInput = screen.getByLabelText(/密码/);
      const loginButton = screen.getByRole('button', { name: /登录/ });

      await user.type(phoneInput, '13800138000');
      await user.type(passwordInput, 'wrongpassword');
      await user.click(loginButton);

      await waitFor(() => {
        expect(mockOnLoginError).toHaveBeenCalledWith(errorMessage);
      });
    });
  });

  describe('忘记密码功能测试', () => {
    it('应该在点击忘记密码时调用回调函数', async () => {
      const user = userEvent.setup();
      render(<LoginForm onForgotPassword={mockOnForgotPassword} />);

      const forgotPasswordButton = screen.getByRole('button', { name: /忘记密码/ });
      await user.click(forgotPasswordButton);

      expect(mockOnForgotPassword).toHaveBeenCalled();
    });
  });

  describe('表单验证测试', () => {
    it('应该验证手机号格式', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const phoneInput = screen.getByLabelText(/手机号/);
      await user.type(phoneInput, '123');
      fireEvent.blur(phoneInput);

      await waitFor(() => {
        expect(screen.getByText(/手机号格式不正确/)).toBeInTheDocument();
      });
    });

    it('应该验证邮箱格式', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      // 切换到邮箱登录
      await user.click(screen.getByRole('button', { name: /邮箱登录/ }));

      const emailInput = screen.getByLabelText(/邮箱/);
      await user.type(emailInput, 'invalid-email');
      fireEvent.blur(emailInput);

      await waitFor(() => {
        expect(screen.getByText(/邮箱格式不正确/)).toBeInTheDocument();
      });
    });

    it('应该验证密码不为空', async () => {
      const user = userEvent.setup();
      render(<LoginForm />);

      const passwordInput = screen.getByLabelText(/密码/);
      await user.click(passwordInput);
      fireEvent.blur(passwordInput);

      await waitFor(() => {
        expect(screen.getByText(/请输入密码/)).toBeInTheDocument();
      });
    });

    it('应该在表单验证失败时禁用登录按钮', () => {
      render(<LoginForm />);

      const loginButton = screen.getByRole('button', { name: /登录/ });
      expect(loginButton).toBeDisabled();
    });
  });
});