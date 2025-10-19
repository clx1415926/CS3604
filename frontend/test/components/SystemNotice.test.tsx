import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SystemNotice from '../../src/components/SystemNotice.jsx';

// Mock API calls
const mockGetSystemConfig = vi.fn();
const mockMarkNoticeAsRead = vi.fn();

vi.mock('../../src/api/system', () => ({
  getSystemConfig: mockGetSystemConfig,
  markNoticeAsRead: mockMarkNoticeAsRead,
}));

describe('SystemNotice Component Tests', () => {
  const mockOnNoticeClick = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 设置默认的系统公告响应
    mockGetSystemConfig.mockResolvedValue({
      notices: [
        {
          id: 1,
          title: '春运购票提醒',
          content: '2025年春运火车票将于1月10日开始发售，请提前做好购票准备。',
          type: 'important',
          publishTime: '2025-01-15T10:00:00Z',
          isRead: false,
          priority: 'high',
          validUntil: '2025-03-01T23:59:59Z'
        },
        {
          id: 2,
          title: '系统维护通知',
          content: '系统将于1月20日凌晨2:00-4:00进行维护，期间暂停服务。',
          type: 'maintenance',
          publishTime: '2025-01-18T16:30:00Z',
          isRead: true,
          priority: 'medium',
          validUntil: '2025-01-21T00:00:00Z'
        },
        {
          id: 3,
          title: '新功能上线',
          content: '手机APP新增智能推荐功能，为您推荐最优出行方案。',
          type: 'feature',
          publishTime: '2025-01-16T14:20:00Z',
          isRead: false,
          priority: 'low',
          validUntil: '2025-02-15T23:59:59Z'
        }
      ],
      total: 3,
      hasMore: false
    });

    mockMarkNoticeAsRead.mockResolvedValue({ success: true });
  });

  describe('组件渲染测试', () => {
    it('应该渲染系统公告标题', () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      expect(screen.getByText('系统公告')).toBeInTheDocument();
    });

    it('应该渲染刷新按钮', () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      expect(screen.getByRole('button', { name: /刷新/i })).toBeInTheDocument();
    });

    it('应该渲染查看更多按钮', () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      expect(screen.getByRole('button', { name: /查看更多/i })).toBeInTheDocument();
    });

    it('初始加载时应显示加载状态', () => {
      mockGetSystemConfig.mockImplementation(() => new Promise(() => {})); // 永不resolve

      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('正在加载系统公告...')).toBeInTheDocument();
    });
  });

  describe('系统公告数据加载测试', () => {
    it('组件挂载时应调用API获取系统公告', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledWith(['notices'], {
          limit: 5,
          sortBy: 'publishTime',
          order: 'desc',
          includeExpired: false
        });
      });
    });

    it('应该显示公告列表', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(screen.getByText('春运购票提醒')).toBeInTheDocument();
        expect(screen.getByText('系统维护通知')).toBeInTheDocument();
        expect(screen.getByText('新功能上线')).toBeInTheDocument();
      });
    });

    it('应该显示公告内容摘要', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(screen.getByText(/2025年春运火车票将于1月10日开始发售/)).toBeInTheDocument();
        expect(screen.getByText(/系统将于1月20日凌晨2:00-4:00进行维护/)).toBeInTheDocument();
        expect(screen.getByText(/手机APP新增智能推荐功能/)).toBeInTheDocument();
      });
    });

    it('应该显示公告发布时间', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(screen.getByText('01-15 10:00')).toBeInTheDocument();
        expect(screen.getByText('01-18 16:30')).toBeInTheDocument();
        expect(screen.getByText('01-16 14:20')).toBeInTheDocument();
      });
    });

    it('应该按发布时间倒序排列', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        const noticeItems = screen.getAllByTestId('notice-item');
        expect(noticeItems[0]).toHaveTextContent('系统维护通知'); // 最新的
        expect(noticeItems[1]).toHaveTextContent('新功能上线');
        expect(noticeItems[2]).toHaveTextContent('春运购票提醒'); // 最旧的
      });
    });
  });

  describe('公告类型和优先级显示测试', () => {
    it('应该显示不同类型的公告标识', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(screen.getByTestId('notice-type-important')).toBeInTheDocument();
        expect(screen.getByTestId('notice-type-maintenance')).toBeInTheDocument();
        expect(screen.getByTestId('notice-type-feature')).toBeInTheDocument();
      });
    });

    it('应该显示优先级标识', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(screen.getByTestId('priority-high')).toBeInTheDocument();
        expect(screen.getByTestId('priority-medium')).toBeInTheDocument();
        expect(screen.getByTestId('priority-low')).toBeInTheDocument();
      });
    });

    it('高优先级公告应该有特殊样式', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        const highPriorityNotice = screen.getByText('春运购票提醒').closest('div');
        expect(highPriorityNotice).toHaveClass('high-priority');
      });
    });

    it('重要公告应该有醒目的标识', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(screen.getByText('重要')).toBeInTheDocument();
      });
    });
  });

  describe('已读/未读状态测试', () => {
    it('应该显示未读公告的标识', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        const unreadNotices = screen.getAllByTestId('unread-indicator');
        expect(unreadNotices).toHaveLength(2); // 春运购票提醒和新功能上线
      });
    });

    it('已读公告应该有不同的样式', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        const readNotice = screen.getByText('系统维护通知').closest('div');
        expect(readNotice).toHaveClass('read');
      });
    });

    it('应该显示未读公告数量', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(screen.getByText('2条未读')).toBeInTheDocument();
      });
    });

    it('全部已读时应该显示相应提示', async () => {
      mockGetSystemConfig.mockResolvedValue({
        notices: [
          {
            id: 1,
            title: '测试公告',
            content: '测试内容',
            type: 'normal',
            publishTime: '2025-01-15T10:00:00Z',
            isRead: true,
            priority: 'low'
          }
        ],
        total: 1,
        hasMore: false
      });

      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(screen.getByText('全部已读')).toBeInTheDocument();
      });
    });
  });

  describe('公告点击和查看详情测试', () => {
    it('点击公告时应调用onNoticeClick回调', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        const noticeItem = screen.getByText('春运购票提醒').closest('div');
        fireEvent.click(noticeItem);
      });

      expect(mockOnNoticeClick).toHaveBeenCalledWith({
        id: 1,
        title: '春运购票提醒',
        content: '2025年春运火车票将于1月10日开始发售，请提前做好购票准备。',
        type: 'important',
        publishTime: '2025-01-15T10:00:00Z'
      });
    });

    it('点击未读公告应自动标记为已读', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        const noticeItem = screen.getByText('春运购票提醒').closest('div');
        fireEvent.click(noticeItem);
      });

      expect(mockMarkNoticeAsRead).toHaveBeenCalledWith(1);
    });

    it('点击已读公告不应重复调用标记已读API', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        const noticeItem = screen.getByText('系统维护通知').closest('div');
        fireEvent.click(noticeItem);
      });

      expect(mockMarkNoticeAsRead).not.toHaveBeenCalled();
    });

    it('标记已读成功后应更新UI状态', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        const noticeItem = screen.getByText('春运购票提醒').closest('div');
        expect(noticeItem).toHaveClass('unread');
        
        fireEvent.click(noticeItem);
      });

      await waitFor(() => {
        const noticeItem = screen.getByText('春运购票提醒').closest('div');
        expect(noticeItem).toHaveClass('read');
      });
    });
  });

  describe('刷新功能测试', () => {
    it('点击刷新按钮应重新加载数据', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      // 等待初始加载完成
      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledTimes(1);
      });

      // 点击刷新按钮
      const refreshButton = screen.getByRole('button', { name: /刷新/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledTimes(2);
      });
    });

    it('刷新时应显示加载状态', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      // 等待初始加载完成
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // 设置刷新时的延迟响应
      mockGetSystemConfig.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({
          notices: [],
          total: 0,
          hasMore: false
        }), 100)
      ));

      // 点击刷新按钮
      const refreshButton = screen.getByRole('button', { name: /刷新/i });
      fireEvent.click(refreshButton);

      // 应该显示加载状态
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });

    it('刷新按钮在加载时应该被禁用', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      // 设置延迟响应
      mockGetSystemConfig.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({
          notices: [],
          total: 0,
          hasMore: false
        }), 100)
      ));

      const refreshButton = screen.getByRole('button', { name: /刷新/i });
      fireEvent.click(refreshButton);

      expect(refreshButton).toBeDisabled();
    });
  });

  describe('查看更多功能测试', () => {
    it('当hasMore为true时应显示查看更多按钮', async () => {
      mockGetSystemConfig.mockResolvedValue({
        notices: [],
        total: 20,
        hasMore: true
      });

      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        const moreButton = screen.getByRole('button', { name: /查看更多/i });
        expect(moreButton).toBeInTheDocument();
        expect(moreButton).not.toBeDisabled();
      });
    });

    it('当hasMore为false时应隐藏查看更多按钮', async () => {
      mockGetSystemConfig.mockResolvedValue({
        notices: [],
        total: 3,
        hasMore: false
      });

      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        const moreButton = screen.queryByRole('button', { name: /查看更多/i });
        expect(moreButton).not.toBeInTheDocument();
      });
    });

    it('点击查看更多应加载更多公告', async () => {
      // 初始响应
      mockGetSystemConfig.mockResolvedValueOnce({
        notices: [
          {
            id: 1,
            title: '公告1',
            content: '内容1',
            type: 'normal',
            publishTime: '2025-01-15T10:00:00Z',
            isRead: false,
            priority: 'low'
          }
        ],
        total: 10,
        hasMore: true
      });

      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(screen.getByText('公告1')).toBeInTheDocument();
      });

      // 设置加载更多的响应
      mockGetSystemConfig.mockResolvedValueOnce({
        notices: [
          {
            id: 2,
            title: '公告2',
            content: '内容2',
            type: 'normal',
            publishTime: '2025-01-14T10:00:00Z',
            isRead: false,
            priority: 'low'
          }
        ],
        total: 10,
        hasMore: true
      });

      // 点击查看更多
      const moreButton = screen.getByRole('button', { name: /查看更多/i });
      fireEvent.click(moreButton);

      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledWith(['notices'], {
          limit: 5,
          sortBy: 'publishTime',
          order: 'desc',
          includeExpired: false,
          offset: 1
        });
      });
    });
  });

  describe('过滤功能测试', () => {
    it('应该提供公告类型过滤选项', () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      expect(screen.getByRole('combobox', { name: /公告类型/i })).toBeInTheDocument();
    });

    it('默认应该显示所有类型的公告', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledWith(['notices'], {
          limit: 5,
          sortBy: 'publishTime',
          order: 'desc',
          includeExpired: false
        });
      });
    });

    it('选择特定类型应过滤公告', async () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      // 等待初始加载
      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledTimes(1);
      });

      // 选择重要公告类型
      const typeSelect = screen.getByRole('combobox', { name: /公告类型/i });
      fireEvent.change(typeSelect, { target: { value: 'important' } });

      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledWith(['notices'], {
          limit: 5,
          sortBy: 'publishTime',
          order: 'desc',
          includeExpired: false,
          type: 'important'
        });
      });
    });

    it('应该支持按已读/未读状态过滤', () => {
      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      expect(screen.getByRole('combobox', { name: /阅读状态/i })).toBeInTheDocument();
    });
  });

  describe('空状态处理测试', () => {
    it('当没有公告时应显示空状态', async () => {
      mockGetSystemConfig.mockResolvedValue({
        notices: [],
        total: 0,
        hasMore: false
      });

      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(screen.getByText('暂无系统公告')).toBeInTheDocument();
        expect(screen.getByText('目前没有新的系统公告')).toBeInTheDocument();
      });
    });

    it('空状态时应隐藏操作按钮', async () => {
      mockGetSystemConfig.mockResolvedValue({
        notices: [],
        total: 0,
        hasMore: false
      });

      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /查看更多/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('错误处理测试', () => {
    it('API调用失败时应显示错误信息', async () => {
      mockGetSystemConfig.mockRejectedValue(new Error('网络错误'));

      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(screen.getByText('加载系统公告失败')).toBeInTheDocument();
        expect(screen.getByText('网络连接异常，请检查网络后重试')).toBeInTheDocument();
      });
    });

    it('标记已读失败时应显示错误提示', async () => {
      mockMarkNoticeAsRead.mockRejectedValue(new Error('标记失败'));

      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        const noticeItem = screen.getByText('春运购票提醒').closest('div');
        fireEvent.click(noticeItem);
      });

      await waitFor(() => {
        expect(screen.getByText('标记已读失败，请重试')).toBeInTheDocument();
      });
    });

    it('错误状态时应提供重试按钮', async () => {
      mockGetSystemConfig.mockRejectedValue(new Error('网络错误'));

      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
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

      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      const container = screen.getByTestId('system-notice-container');
      expect(container).toHaveClass('mobile-responsive');
    });

    it('移动端应该使用卡片式布局', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<SystemNotice onNoticeClick={mockOnNoticeClick} />);

      await waitFor(() => {
        const noticeItems = screen.getAllByTestId('notice-item');
        noticeItems.forEach(item => {
          expect(item).toHaveClass('card-layout');
        });
      });
    });
  });

  describe('自动刷新功能测试', () => {
    it('应该定期自动刷新公告', async () => {
      vi.useFakeTimers();

      render(<SystemNotice onNoticeClick={mockOnNoticeClick} autoRefresh={true} />);

      // 等待初始加载
      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledTimes(1);
      });

      // 快进5分钟
      vi.advanceTimersByTime(5 * 60 * 1000);

      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledTimes(2);
      });

      vi.useRealTimers();
    });

    it('组件卸载时应清除自动刷新定时器', () => {
      vi.useFakeTimers();

      const { unmount } = render(<SystemNotice onNoticeClick={mockOnNoticeClick} autoRefresh={true} />);

      unmount();

      // 快进时间，不应该再有API调用
      vi.advanceTimersByTime(10 * 60 * 1000);

      expect(mockGetSystemConfig).toHaveBeenCalledTimes(1); // 只有初始加载

      vi.useRealTimers();
    });
  });
});