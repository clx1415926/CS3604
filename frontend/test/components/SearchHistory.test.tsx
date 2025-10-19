import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import SearchHistory from '../../src/components/SearchHistory.jsx';

// Mock API calls
const mockGetUserSearchHistory = vi.fn();
const mockDeleteSearchHistoryItem = vi.fn();
const mockClearSearchHistory = vi.fn();
const mockSaveUserSearchHistory = vi.fn();

vi.mock('../../src/api/user', () => ({
  getUserSearchHistory: mockGetUserSearchHistory,
  deleteSearchHistoryItem: mockDeleteSearchHistoryItem,
  clearSearchHistory: mockClearSearchHistory,
  saveUserSearchHistory: mockSaveUserSearchHistory,
}));

describe('SearchHistory Component Tests', () => {
  const mockOnHistorySelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 设置默认的搜索历史响应
    mockGetUserSearchHistory.mockResolvedValue({
      history: [
        {
          id: 1,
          origin: '北京',
          destination: '上海',
          searchTime: '2025-01-20T10:30:00Z',
          frequency: 5
        },
        {
          id: 2,
          origin: '广州',
          destination: '深圳',
          searchTime: '2025-01-19T15:20:00Z',
          frequency: 3
        },
        {
          id: 3,
          origin: '杭州',
          destination: '南京',
          searchTime: '2025-01-18T09:15:00Z',
          frequency: 1
        }
      ],
      total: 3,
      hasMore: false
    });

    mockDeleteSearchHistoryItem.mockResolvedValue({ success: true });
    mockClearSearchHistory.mockResolvedValue({ success: true });
  });

  describe('组件渲染测试', () => {
    it('应该渲染搜索历史标题', () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      expect(screen.getByText('搜索历史')).toBeInTheDocument();
    });

    it('应该渲染清空历史按钮', () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      expect(screen.getByRole('button', { name: /清空历史/i })).toBeInTheDocument();
    });

    it('初始加载时应显示加载状态', () => {
      mockGetUserSearchHistory.mockImplementation(() => new Promise(() => {})); // 永不resolve

      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('正在加载搜索历史...')).toBeInTheDocument();
    });
  });

  describe('搜索历史数据加载测试', () => {
    it('组件挂载时应调用API获取搜索历史', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        expect(mockGetUserSearchHistory).toHaveBeenCalledWith({
          limit: 20,
          sortBy: 'searchTime',
          order: 'desc'
        });
      });
    });

    it('应该显示搜索历史列表', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        expect(screen.getByText('北京 → 上海')).toBeInTheDocument();
        expect(screen.getByText('广州 → 深圳')).toBeInTheDocument();
        expect(screen.getByText('杭州 → 南京')).toBeInTheDocument();
      });
    });

    it('应该显示搜索时间', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        expect(screen.getByText('01-20 10:30')).toBeInTheDocument();
        expect(screen.getByText('01-19 15:20')).toBeInTheDocument();
        expect(screen.getByText('01-18 09:15')).toBeInTheDocument();
      });
    });

    it('应该显示搜索频次', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        expect(screen.getByText('搜索5次')).toBeInTheDocument();
        expect(screen.getByText('搜索3次')).toBeInTheDocument();
        expect(screen.getByText('搜索1次')).toBeInTheDocument();
      });
    });

    it('应该按搜索时间倒序排列', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        const historyItems = screen.getAllByTestId('history-item');
        expect(historyItems[0]).toHaveTextContent('北京 → 上海'); // 最新的
        expect(historyItems[1]).toHaveTextContent('广州 → 深圳');
        expect(historyItems[2]).toHaveTextContent('杭州 → 南京'); // 最旧的
      });
    });
  });

  describe('历史记录选择功能测试', () => {
    it('点击历史记录时应调用onHistorySelect回调', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        const historyItem = screen.getByText('北京 → 上海').closest('div');
        fireEvent.click(historyItem);
      });

      expect(mockOnHistorySelect).toHaveBeenCalledWith({
        origin: '北京',
        destination: '上海',
        historyId: 1
      });
    });

    it('点击不同历史记录应传递正确的参数', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        const historyItem = screen.getByText('广州 → 深圳').closest('div');
        fireEvent.click(historyItem);
      });

      expect(mockOnHistorySelect).toHaveBeenCalledWith({
        origin: '广州',
        destination: '深圳',
        historyId: 2
      });
    });

    it('历史记录项应该有正确的可点击样式', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        const historyItems = screen.getAllByTestId('history-item');
        historyItems.forEach(item => {
          expect(item).toHaveClass('clickable');
          expect(item).toHaveAttribute('role', 'button');
        });
      });
    });
  });

  describe('删除单个历史记录功能测试', () => {
    it('每个历史记录项应该有删除按钮', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /删除/i });
        expect(deleteButtons).toHaveLength(3);
      });
    });

    it('点击删除按钮应调用删除API', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /删除/i });
        fireEvent.click(deleteButtons[0]);
      });

      expect(mockDeleteSearchHistoryItem).toHaveBeenCalledWith(1);
    });

    it('删除成功后应从列表中移除该项', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        expect(screen.getByText('北京 → 上海')).toBeInTheDocument();
      });

      // 点击删除按钮
      const deleteButtons = screen.getAllByRole('button', { name: /删除/i });
      fireEvent.click(deleteButtons[0]);

      await waitFor(() => {
        expect(screen.queryByText('北京 → 上海')).not.toBeInTheDocument();
      });
    });

    it('删除时应显示确认对话框', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /删除/i });
        fireEvent.click(deleteButtons[0]);
      });

      expect(screen.getByText('确认删除这条搜索记录吗？')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /确认/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /取消/i })).toBeInTheDocument();
    });

    it('点击取消应关闭确认对话框', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /删除/i });
        fireEvent.click(deleteButtons[0]);
      });

      const cancelButton = screen.getByRole('button', { name: /取消/i });
      fireEvent.click(cancelButton);

      expect(screen.queryByText('确认删除这条搜索记录吗？')).not.toBeInTheDocument();
    });
  });

  describe('清空历史记录功能测试', () => {
    it('点击清空历史按钮应显示确认对话框', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      const clearButton = screen.getByRole('button', { name: /清空历史/i });
      fireEvent.click(clearButton);

      expect(screen.getByText('确认清空所有搜索历史吗？')).toBeInTheDocument();
      expect(screen.getByText('此操作不可恢复')).toBeInTheDocument();
    });

    it('确认清空应调用清空API', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      const clearButton = screen.getByRole('button', { name: /清空历史/i });
      fireEvent.click(clearButton);

      const confirmButton = screen.getByRole('button', { name: /确认清空/i });
      fireEvent.click(confirmButton);

      expect(mockClearSearchHistory).toHaveBeenCalled();
    });

    it('清空成功后应显示空状态', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      // 等待初始数据加载
      await waitFor(() => {
        expect(screen.getByText('北京 → 上海')).toBeInTheDocument();
      });

      // 点击清空历史
      const clearButton = screen.getByRole('button', { name: /清空历史/i });
      fireEvent.click(clearButton);

      const confirmButton = screen.getByRole('button', { name: /确认清空/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('暂无搜索历史')).toBeInTheDocument();
      });
    });

    it('当历史记录为空时应隐藏清空按钮', async () => {
      mockGetUserSearchHistory.mockResolvedValue({
        history: [],
        total: 0,
        hasMore: false
      });

      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /清空历史/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('排序功能测试', () => {
    it('应该提供排序选项', () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      expect(screen.getByRole('combobox', { name: /排序方式/i })).toBeInTheDocument();
    });

    it('默认应该按时间倒序排序', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        expect(mockGetUserSearchHistory).toHaveBeenCalledWith({
          limit: 20,
          sortBy: 'searchTime',
          order: 'desc'
        });
      });
    });

    it('切换到按频次排序应重新加载数据', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      // 等待初始加载
      await waitFor(() => {
        expect(mockGetUserSearchHistory).toHaveBeenCalledTimes(1);
      });

      // 切换到按频次排序
      const sortSelect = screen.getByRole('combobox', { name: /排序方式/i });
      fireEvent.change(sortSelect, { target: { value: 'frequency' } });

      await waitFor(() => {
        expect(mockGetUserSearchHistory).toHaveBeenCalledWith({
          limit: 20,
          sortBy: 'frequency',
          order: 'desc'
        });
      });
    });

    it('应该支持按时间、频次排序', () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      const sortSelect = screen.getByRole('combobox', { name: /排序方式/i });
      
      expect(screen.getByRole('option', { name: /时间/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /频次/i })).toBeInTheDocument();
    });
  });

  describe('搜索过滤功能测试', () => {
    it('应该提供搜索输入框', () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      expect(screen.getByPlaceholderText('搜索历史记录...')).toBeInTheDocument();
    });

    it('输入关键词应过滤历史记录', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      // 等待初始数据加载
      await waitFor(() => {
        expect(screen.getByText('北京 → 上海')).toBeInTheDocument();
        expect(screen.getByText('广州 → 深圳')).toBeInTheDocument();
      });

      // 输入搜索关键词
      const searchInput = screen.getByPlaceholderText('搜索历史记录...');
      fireEvent.change(searchInput, { target: { value: '北京' } });

      // 应该只显示包含"北京"的记录
      expect(screen.getByText('北京 → 上海')).toBeInTheDocument();
      expect(screen.queryByText('广州 → 深圳')).not.toBeInTheDocument();
    });

    it('清空搜索框应显示所有历史记录', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      // 输入搜索关键词
      const searchInput = screen.getByPlaceholderText('搜索历史记录...');
      fireEvent.change(searchInput, { target: { value: '北京' } });

      // 清空搜索框
      fireEvent.change(searchInput, { target: { value: '' } });

      await waitFor(() => {
        expect(screen.getByText('北京 → 上海')).toBeInTheDocument();
        expect(screen.getByText('广州 → 深圳')).toBeInTheDocument();
      });
    });
  });

  describe('空状态处理测试', () => {
    it('当没有搜索历史时应显示空状态', async () => {
      mockGetUserSearchHistory.mockResolvedValue({
        history: [],
        total: 0,
        hasMore: false
      });

      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        expect(screen.getByText('暂无搜索历史')).toBeInTheDocument();
        expect(screen.getByText('开始搜索车票，系统会自动保存您的搜索记录')).toBeInTheDocument();
      });
    });

    it('空状态时应显示搜索建议', async () => {
      mockGetUserSearchHistory.mockResolvedValue({
        history: [],
        total: 0,
        hasMore: false
      });

      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        expect(screen.getByText('热门路线推荐')).toBeInTheDocument();
      });
    });
  });

  describe('错误处理测试', () => {
    it('API调用失败时应显示错误信息', async () => {
      mockGetUserSearchHistory.mockRejectedValue(new Error('网络错误'));

      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        expect(screen.getByText('加载搜索历史失败')).toBeInTheDocument();
        expect(screen.getByText('网络连接异常，请检查网络后重试')).toBeInTheDocument();
      });
    });

    it('删除失败时应显示错误提示', async () => {
      mockDeleteSearchHistoryItem.mockRejectedValue(new Error('删除失败'));

      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        const deleteButtons = screen.getAllByRole('button', { name: /删除/i });
        fireEvent.click(deleteButtons[0]);
      });

      const confirmButton = screen.getByRole('button', { name: /确认/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('删除失败，请重试')).toBeInTheDocument();
      });
    });

    it('清空失败时应显示错误提示', async () => {
      mockClearSearchHistory.mockRejectedValue(new Error('清空失败'));

      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      const clearButton = screen.getByRole('button', { name: /清空历史/i });
      fireEvent.click(clearButton);

      const confirmButton = screen.getByRole('button', { name: /确认清空/i });
      fireEvent.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText('清空失败，请重试')).toBeInTheDocument();
      });
    });

    it('错误状态时应提供重试按钮', async () => {
      mockGetUserSearchHistory.mockRejectedValue(new Error('网络错误'));

      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
      });
    });
  });

  describe('用户认证状态测试', () => {
    it('未登录用户应显示登录提示', async () => {
      mockGetUserSearchHistory.mockRejectedValue(new Error('未登录'));

      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        expect(screen.getByText('请先登录查看搜索历史')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: /立即登录/i })).toBeInTheDocument();
      });
    });

    it('点击登录按钮应触发登录流程', async () => {
      const mockOnLogin = vi.fn();
      mockGetUserSearchHistory.mockRejectedValue(new Error('未登录'));

      render(<SearchHistory onHistorySelect={mockOnHistorySelect} onLogin={mockOnLogin} />);

      await waitFor(() => {
        const loginButton = screen.getByRole('button', { name: /立即登录/i });
        fireEvent.click(loginButton);
      });

      expect(mockOnLogin).toHaveBeenCalled();
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

      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      const container = screen.getByTestId('search-history-container');
      expect(container).toHaveClass('mobile-responsive');
    });

    it('移动端应该使用简化的历史记录项布局', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        const historyItems = screen.getAllByTestId('history-item');
        historyItems.forEach(item => {
          expect(item).toHaveClass('mobile-layout');
        });
      });
    });
  });

  describe('性能优化测试', () => {
    it('应该支持虚拟滚动（当历史记录较多时）', async () => {
      const manyHistory = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        origin: `城市${i + 1}`,
        destination: `城市${i + 2}`,
        searchTime: new Date(Date.now() - i * 86400000).toISOString(),
        frequency: Math.floor(Math.random() * 10) + 1
      }));

      mockGetUserSearchHistory.mockResolvedValue({
        history: manyHistory,
        total: 100,
        hasMore: false
      });

      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      await waitFor(() => {
        const virtualContainer = screen.getByTestId('virtual-scroll-container');
        expect(virtualContainer).toBeInTheDocument();
      });
    });

    it('应该实现搜索防抖', async () => {
      render(<SearchHistory onHistorySelect={mockOnHistorySelect} />);

      const searchInput = screen.getByPlaceholderText('搜索历史记录...');
      
      // 快速输入多个字符
      fireEvent.change(searchInput, { target: { value: '北' } });
      fireEvent.change(searchInput, { target: { value: '北京' } });
      fireEvent.change(searchInput, { target: { value: '北京上' } });

      // 等待防抖延迟
      await waitFor(() => {
        // 应该只触发一次过滤
        expect(screen.queryByText('广州 → 深圳')).not.toBeInTheDocument();
      }, { timeout: 500 });
    });
  });
});