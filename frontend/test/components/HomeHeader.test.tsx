import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import HomeHeader from '../../src/components/HomeHeader.jsx';

// Mock fetch
global.fetch = vi.fn();

describe('HomeHeader Component Tests', () => {
  const mockOnLoginClick = vi.fn();
  const mockOnRegisterClick = vi.fn();
  const mockOnUserMenuClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch.mockClear();
  });

  describe('未登录状态测试', () => {
    it('未登录时应显示登录/注册按钮', () => {
      render(
        <HomeHeader
          userInfo={null}
          onLoginClick={mockOnLoginClick}
          onRegisterClick={mockOnRegisterClick}
          onUserMenuClick={mockOnUserMenuClick}
        />
      );

      expect(screen.getByText('登录')).toBeInTheDocument();
      expect(screen.getByText('注 册')).toBeInTheDocument();
    });

    it('点击登录按钮应调用回调函数', () => {
      render(
        <HomeHeader
          userInfo={null}
          onLoginClick={mockOnLoginClick}
          onRegisterClick={mockOnRegisterClick}
          onUserMenuClick={mockOnUserMenuClick}
        />
      );

      fireEvent.click(screen.getByText('登录'));
      expect(mockOnLoginClick).toHaveBeenCalledTimes(1);
    });

    it('点击注册按钮应调用回调函数', () => {
      render(
        <HomeHeader
          userInfo={null}
          onLoginClick={mockOnLoginClick}
          onRegisterClick={mockOnRegisterClick}
          onUserMenuClick={mockOnUserMenuClick}
        />
      );

      fireEvent.click(screen.getByText('注 册'));
      expect(mockOnRegisterClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('已登录状态测试', () => {
    const loggedUserInfo = {
      id: 1,
      username: 'testuser',
      realName: '测试用户',
      phone: '13800138000'
    };

    beforeEach(() => {
      // Mock localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => 'mock-token'),
          setItem: vi.fn(),
          removeItem: vi.fn(),
          clear: vi.fn(),
        },
        writable: true,
      });
    });

    it('已登录时应显示用户头像和用户名', () => {
      render(
        <HomeHeader
          userInfo={loggedUserInfo}
          onLoginClick={mockOnLoginClick}
          onRegisterClick={mockOnRegisterClick}
          onUserMenuClick={mockOnUserMenuClick}
        />
      );

      expect(screen.getByText('测试用户')).toBeInTheDocument();
      expect(screen.queryByText('登录')).not.toBeInTheDocument();
      expect(screen.queryByText('注 册')).not.toBeInTheDocument();
    });

    it('应该显示通知图标', () => {
      render(
        <HomeHeader
          userInfo={loggedUserInfo}
          onLoginClick={mockOnLoginClick}
          onRegisterClick={mockOnRegisterClick}
          onUserMenuClick={mockOnUserMenuClick}
        />
      );

      // 通知图标应该存在
      const notificationIcon = screen.getByRole('img', { name: /bell/i });
      expect(notificationIcon).toBeInTheDocument();
    });

    it('应该加载通知数量', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ count: 5 })
      });

      render(
        <HomeHeader
          userInfo={loggedUserInfo}
          onLoginClick={mockOnLoginClick}
          onRegisterClick={mockOnRegisterClick}
          onUserMenuClick={mockOnUserMenuClick}
        />
      );

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith('/api/user/notifications/count', {
          headers: {
            'Authorization': 'Bearer mock-token'
          }
        });
      });
    });
  });

  describe('响应式设计测试', () => {
    it('在小屏幕上应该正确显示', () => {
      // Mock window.innerWidth
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 768,
      });

      render(
        <HomeHeader
          userInfo={null}
          onLoginClick={mockOnLoginClick}
          onRegisterClick={mockOnRegisterClick}
          onUserMenuClick={mockOnUserMenuClick}
        />
      );

      // 基本功能应该仍然可用
      expect(screen.getByText('登录')).toBeInTheDocument();
      expect(screen.getByText('注 册')).toBeInTheDocument();
    });
  });

  describe('错误处理测试', () => {
    it('获取通知数量失败时应该正确处理', async () => {
      const loggedUserInfo = {
        id: 1,
        username: 'testuser',
        realName: '测试用户',
        phone: '13800138000'
      };

      global.fetch.mockRejectedValueOnce(new Error('Network error'));
      
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      render(
        <HomeHeader
          userInfo={loggedUserInfo}
          onLoginClick={mockOnLoginClick}
          onRegisterClick={mockOnRegisterClick}
          onUserMenuClick={mockOnUserMenuClick}
        />
      );

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('获取通知数量失败:', expect.any(Error));
      });

      consoleSpy.mockRestore();
    });
  });
});