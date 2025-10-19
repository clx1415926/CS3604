import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import ServiceEntries from '../../src/components/ServiceEntries.jsx';

// Mock API calls
const mockGetSystemConfig = vi.fn();

vi.mock('../../src/api/system', () => ({
  getSystemConfig: mockGetSystemConfig,
}));

// Mock external services
const mockOpenCustomerService = vi.fn();
const mockCallHotline = vi.fn();
const mockOpenFAQ = vi.fn();
const mockOpenUserGuide = vi.fn();

vi.mock('../../src/utils/externalServices', () => ({
  openCustomerService: mockOpenCustomerService,
  callHotline: mockCallHotline,
  openFAQ: mockOpenFAQ,
  openUserGuide: mockOpenUserGuide,
}));

describe('ServiceEntries Component Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // 设置默认的系统配置响应
    mockGetSystemConfig.mockResolvedValue({
      customerService: {
        enabled: true,
        url: 'https://service.12306.cn/chat',
        workingHours: '7:00-23:00',
        description: '在线客服为您提供7×16小时服务'
      },
      hotline: {
        enabled: true,
        number: '95105105',
        workingHours: '24小时',
        description: '全国统一客服热线'
      },
      faq: {
        enabled: true,
        url: 'https://www.12306.cn/mormhweb/faq/',
        categories: ['购票', '退改签', '账户', '其他'],
        description: '常见问题解答'
      },
      userGuide: {
        enabled: true,
        url: 'https://www.12306.cn/mormhweb/guide/',
        sections: ['新手指南', '购票流程', '支付方式', '常用功能'],
        description: '详细使用指南'
      }
    });
  });

  describe('组件渲染测试', () => {
    it('应该渲染服务入口标题', () => {
      render(<ServiceEntries />);

      expect(screen.getByText('客户服务')).toBeInTheDocument();
    });

    it('应该渲染所有服务入口', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('在线客服')).toBeInTheDocument();
        expect(screen.getByText('客服热线')).toBeInTheDocument();
        expect(screen.getByText('常见问题')).toBeInTheDocument();
        expect(screen.getByText('使用指南')).toBeInTheDocument();
      });
    });

    it('应该显示服务描述信息', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('在线客服为您提供7×16小时服务')).toBeInTheDocument();
        expect(screen.getByText('全国统一客服热线')).toBeInTheDocument();
        expect(screen.getByText('常见问题解答')).toBeInTheDocument();
        expect(screen.getByText('详细使用指南')).toBeInTheDocument();
      });
    });

    it('应该显示服务工作时间', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('服务时间: 7:00-23:00')).toBeInTheDocument();
        expect(screen.getByText('服务时间: 24小时')).toBeInTheDocument();
      });
    });

    it('初始加载时应显示加载状态', () => {
      mockGetSystemConfig.mockImplementation(() => new Promise(() => {})); // 永不resolve

      render(<ServiceEntries />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('正在加载服务信息...')).toBeInTheDocument();
    });
  });

  describe('系统配置加载测试', () => {
    it('组件挂载时应调用API获取系统配置', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledWith([
          'customerService',
          'hotline',
          'faq',
          'userGuide'
        ]);
      });
    });

    it('应该根据配置显示或隐藏服务入口', async () => {
      mockGetSystemConfig.mockResolvedValue({
        customerService: { enabled: true, url: 'https://service.12306.cn/chat' },
        hotline: { enabled: false, number: '95105105' },
        faq: { enabled: true, url: 'https://www.12306.cn/faq/' },
        userGuide: { enabled: false, url: 'https://www.12306.cn/guide/' }
      });

      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('在线客服')).toBeInTheDocument();
        expect(screen.queryByText('客服热线')).not.toBeInTheDocument();
        expect(screen.getByText('常见问题')).toBeInTheDocument();
        expect(screen.queryByText('使用指南')).not.toBeInTheDocument();
      });
    });

    it('应该显示服务入口的图标', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByTestId('customer-service-icon')).toBeInTheDocument();
        expect(screen.getByTestId('hotline-icon')).toBeInTheDocument();
        expect(screen.getByTestId('faq-icon')).toBeInTheDocument();
        expect(screen.getByTestId('user-guide-icon')).toBeInTheDocument();
      });
    });
  });

  describe('在线客服功能测试', () => {
    it('点击在线客服应调用相应的服务', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        const customerServiceButton = screen.getByRole('button', { name: /在线客服/i });
        fireEvent.click(customerServiceButton);
      });

      expect(mockOpenCustomerService).toHaveBeenCalledWith('https://service.12306.cn/chat');
    });

    it('在线客服不可用时应显示提示信息', async () => {
      mockGetSystemConfig.mockResolvedValue({
        customerService: {
          enabled: false,
          url: '',
          unavailableReason: '系统维护中'
        }
      });

      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('系统维护中')).toBeInTheDocument();
      });
    });

    it('应该显示在线客服的状态指示器', async () => {
      mockGetSystemConfig.mockResolvedValue({
        customerService: {
          enabled: true,
          url: 'https://service.12306.cn/chat',
          status: 'online',
          queueLength: 5
        }
      });

      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByTestId('service-status-online')).toBeInTheDocument();
        expect(screen.getByText('当前排队: 5人')).toBeInTheDocument();
      });
    });
  });

  describe('客服热线功能测试', () => {
    it('点击客服热线应调用相应的服务', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        const hotlineButton = screen.getByRole('button', { name: /客服热线/i });
        fireEvent.click(hotlineButton);
      });

      expect(mockCallHotline).toHaveBeenCalledWith('95105105');
    });

    it('应该显示热线号码', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('95105105')).toBeInTheDocument();
      });
    });

    it('移动端应该支持直接拨打电话', async () => {
      // 模拟移动端环境
      Object.defineProperty(navigator, 'userAgent', {
        value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
        configurable: true
      });

      render(<ServiceEntries />);

      await waitFor(() => {
        const hotlineButton = screen.getByRole('button', { name: /客服热线/i });
        expect(hotlineButton.closest('a')).toHaveAttribute('href', 'tel:95105105');
      });
    });

    it('应该显示热线的忙碌状态', async () => {
      mockGetSystemConfig.mockResolvedValue({
        hotline: {
          enabled: true,
          number: '95105105',
          status: 'busy',
          estimatedWaitTime: '约15分钟'
        }
      });

      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('线路繁忙')).toBeInTheDocument();
        expect(screen.getByText('约15分钟')).toBeInTheDocument();
      });
    });
  });

  describe('常见问题功能测试', () => {
    it('点击常见问题应调用相应的服务', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        const faqButton = screen.getByRole('button', { name: /常见问题/i });
        fireEvent.click(faqButton);
      });

      expect(mockOpenFAQ).toHaveBeenCalledWith('https://www.12306.cn/mormhweb/faq/');
    });

    it('应该显示FAQ分类', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('购票')).toBeInTheDocument();
        expect(screen.getByText('退改签')).toBeInTheDocument();
        expect(screen.getByText('账户')).toBeInTheDocument();
        expect(screen.getByText('其他')).toBeInTheDocument();
      });
    });

    it('点击FAQ分类应跳转到对应页面', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        const categoryButton = screen.getByRole('button', { name: /购票/i });
        fireEvent.click(categoryButton);
      });

      expect(mockOpenFAQ).toHaveBeenCalledWith('https://www.12306.cn/mormhweb/faq/#购票');
    });

    it('应该显示热门问题快速入口', async () => {
      mockGetSystemConfig.mockResolvedValue({
        faq: {
          enabled: true,
          url: 'https://www.12306.cn/faq/',
          hotQuestions: [
            { title: '如何退票？', url: '/faq/refund' },
            { title: '忘记密码怎么办？', url: '/faq/password' }
          ]
        }
      });

      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('如何退票？')).toBeInTheDocument();
        expect(screen.getByText('忘记密码怎么办？')).toBeInTheDocument();
      });
    });
  });

  describe('使用指南功能测试', () => {
    it('点击使用指南应调用相应的服务', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        const guideButton = screen.getByRole('button', { name: /使用指南/i });
        fireEvent.click(guideButton);
      });

      expect(mockOpenUserGuide).toHaveBeenCalledWith('https://www.12306.cn/mormhweb/guide/');
    });

    it('应该显示指南章节', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('新手指南')).toBeInTheDocument();
        expect(screen.getByText('购票流程')).toBeInTheDocument();
        expect(screen.getByText('支付方式')).toBeInTheDocument();
        expect(screen.getByText('常用功能')).toBeInTheDocument();
      });
    });

    it('点击指南章节应跳转到对应页面', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        const sectionButton = screen.getByRole('button', { name: /新手指南/i });
        fireEvent.click(sectionButton);
      });

      expect(mockOpenUserGuide).toHaveBeenCalledWith('https://www.12306.cn/mormhweb/guide/#新手指南');
    });

    it('应该显示视频教程入口', async () => {
      mockGetSystemConfig.mockResolvedValue({
        userGuide: {
          enabled: true,
          url: 'https://www.12306.cn/guide/',
          videoTutorials: [
            { title: '购票教程', url: '/video/booking' },
            { title: '退改签教程', url: '/video/refund' }
          ]
        }
      });

      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('视频教程')).toBeInTheDocument();
        expect(screen.getByText('购票教程')).toBeInTheDocument();
        expect(screen.getByText('退改签教程')).toBeInTheDocument();
      });
    });
  });

  describe('服务状态显示测试', () => {
    it('应该显示各服务的实时状态', async () => {
      mockGetSystemConfig.mockResolvedValue({
        customerService: { enabled: true, status: 'online' },
        hotline: { enabled: true, status: 'busy' },
        faq: { enabled: true, status: 'normal' },
        userGuide: { enabled: true, status: 'normal' }
      });

      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByTestId('status-online')).toBeInTheDocument();
        expect(screen.getByTestId('status-busy')).toBeInTheDocument();
        expect(screen.getAllByTestId('status-normal')).toHaveLength(2);
      });
    });

    it('服务维护时应显示维护提示', async () => {
      mockGetSystemConfig.mockResolvedValue({
        customerService: {
          enabled: false,
          status: 'maintenance',
          maintenanceMessage: '系统升级中，预计2小时后恢复'
        }
      });

      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('系统升级中，预计2小时后恢复')).toBeInTheDocument();
      });
    });

    it('应该定期刷新服务状态', async () => {
      vi.useFakeTimers();

      render(<ServiceEntries />);

      // 等待初始加载
      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledTimes(1);
      });

      // 快进30秒
      vi.advanceTimersByTime(30000);

      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });
  });

  describe('快捷操作功能测试', () => {
    it('应该提供快捷操作按钮', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /意见反馈/i })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /投诉建议/i })).toBeInTheDocument();
      });
    });

    it('点击意见反馈应打开反馈表单', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        const feedbackButton = screen.getByRole('button', { name: /意见反馈/i });
        fireEvent.click(feedbackButton);
      });

      expect(screen.getByText('意见反馈')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('请输入您的意见或建议...')).toBeInTheDocument();
    });

    it('点击投诉建议应打开投诉表单', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        const complaintButton = screen.getByRole('button', { name: /投诉建议/i });
        fireEvent.click(complaintButton);
      });

      expect(screen.getByText('投诉建议')).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /投诉类型/i })).toBeInTheDocument();
    });
  });

  describe('错误处理测试', () => {
    it('系统配置加载失败时应显示错误信息', async () => {
      mockGetSystemConfig.mockRejectedValue(new Error('网络错误'));

      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('加载服务信息失败')).toBeInTheDocument();
        expect(screen.getByText('网络连接异常，请检查网络后重试')).toBeInTheDocument();
      });
    });

    it('服务调用失败时应显示错误提示', async () => {
      mockOpenCustomerService.mockRejectedValue(new Error('服务不可用'));

      render(<ServiceEntries />);

      await waitFor(() => {
        const customerServiceButton = screen.getByRole('button', { name: /在线客服/i });
        fireEvent.click(customerServiceButton);
      });

      await waitFor(() => {
        expect(screen.getByText('服务暂时不可用，请稍后重试')).toBeInTheDocument();
      });
    });

    it('错误状态时应提供重试按钮', async () => {
      mockGetSystemConfig.mockRejectedValue(new Error('网络错误'));

      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
      });
    });

    it('点击重试按钮应重新加载配置', async () => {
      mockGetSystemConfig.mockRejectedValueOnce(new Error('网络错误'));

      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('加载服务信息失败')).toBeInTheDocument();
      });

      // 设置重试成功的响应
      mockGetSystemConfig.mockResolvedValue({
        customerService: { enabled: true }
      });

      // 点击重试
      const retryButton = screen.getByRole('button', { name: /重试/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('响应式设计测试', () => {
    it('应该在移动端自适应显示', () => {
      // 模拟移动端视口
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ServiceEntries />);

      const container = screen.getByTestId('service-entries-container');
      expect(container).toHaveClass('mobile-responsive');
    });

    it('移动端应该使用网格布局', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<ServiceEntries />);

      await waitFor(() => {
        const serviceGrid = screen.getByTestId('service-grid');
        expect(serviceGrid).toHaveClass('mobile-grid');
      });
    });

    it('桌面端应该使用列表布局', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      render(<ServiceEntries />);

      await waitFor(() => {
        const serviceGrid = screen.getByTestId('service-grid');
        expect(serviceGrid).toHaveClass('desktop-list');
      });
    });
  });

  describe('无障碍访问测试', () => {
    it('所有服务入口应该有正确的ARIA标签', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        const customerServiceButton = screen.getByRole('button', { name: /在线客服/i });
        expect(customerServiceButton).toHaveAttribute('aria-label', '打开在线客服');
        
        const hotlineButton = screen.getByRole('button', { name: /客服热线/i });
        expect(hotlineButton).toHaveAttribute('aria-label', '拨打客服热线95105105');
      });
    });

    it('应该支持键盘导航', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        buttons.forEach(button => {
          expect(button).toHaveAttribute('tabIndex', '0');
        });
      });
    });

    it('应该提供屏幕阅读器友好的描述', async () => {
      render(<ServiceEntries />);

      await waitFor(() => {
        expect(screen.getByText('客户服务入口，包含在线客服、热线电话等多种联系方式')).toBeInTheDocument();
      });
    });
  });
});