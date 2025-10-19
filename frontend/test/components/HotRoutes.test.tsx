import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import HotRoutes from '../../src/components/HotRoutes.jsx';

// Mock API calls
const mockGetHotRoutes = vi.fn();

vi.mock('../../src/api/homepage', () => ({
  getHotRoutes: mockGetHotRoutes,
}));

describe('HotRoutes Component Tests', () => {
  const mockOnRouteSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 设置默认的热门路线响应
    mockGetHotRoutes.mockResolvedValue({
      routes: [
        {
          id: 1,
          origin: '北京',
          destination: '上海',
          popularity: 95,
          priceRange: '553-1748',
          duration: '4h28m',
          frequency: 'high'
        },
        {
          id: 2,
          origin: '广州',
          destination: '深圳',
          popularity: 88,
          priceRange: '75-99',
          duration: '1h20m',
          frequency: 'high'
        },
        {
          id: 3,
          origin: '杭州',
          destination: '南京',
          popularity: 76,
          priceRange: '134-423',
          duration: '2h15m',
          frequency: 'medium'
        }
      ],
      total: 3,
      hasMore: false
    });
  });

  describe('组件渲染测试', () => {
    it('应该渲染热门路线标题', () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      expect(screen.getByText('热门路线')).toBeInTheDocument();
    });

    it('应该渲染刷新按钮', () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      expect(screen.getByRole('button', { name: /刷新/i })).toBeInTheDocument();
    });

    it('应该渲染查看更多按钮', () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      expect(screen.getByRole('button', { name: /查看更多/i })).toBeInTheDocument();
    });

    it('初始加载时应显示加载状态', () => {
      mockGetHotRoutes.mockImplementation(() => new Promise(() => {})); // 永不resolve

      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
      expect(screen.getByText('正在加载热门路线...')).toBeInTheDocument();
    });
  });

  describe('热门路线数据加载测试', () => {
    it('组件挂载时应调用API获取热门路线', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        expect(mockGetHotRoutes).toHaveBeenCalledWith({
          limit: 10,
          sortBy: 'popularity'
        });
      });
    });

    it('应该显示热门路线列表', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        expect(screen.getByText('北京 → 上海')).toBeInTheDocument();
        expect(screen.getByText('广州 → 深圳')).toBeInTheDocument();
        expect(screen.getByText('杭州 → 南京')).toBeInTheDocument();
      });
    });

    it('应该显示路线的价格范围', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        expect(screen.getByText('¥553-1748')).toBeInTheDocument();
        expect(screen.getByText('¥75-99')).toBeInTheDocument();
        expect(screen.getByText('¥134-423')).toBeInTheDocument();
      });
    });

    it('应该显示路线的行程时间', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        expect(screen.getByText('4h28m')).toBeInTheDocument();
        expect(screen.getByText('1h20m')).toBeInTheDocument();
        expect(screen.getByText('2h15m')).toBeInTheDocument();
      });
    });

    it('应该显示路线的热度指标', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        expect(screen.getByText('热度: 95%')).toBeInTheDocument();
        expect(screen.getByText('热度: 88%')).toBeInTheDocument();
        expect(screen.getByText('热度: 76%')).toBeInTheDocument();
      });
    });

    it('应该显示班次频率标识', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        const highFrequencyBadges = screen.getAllByText('班次密集');
        expect(highFrequencyBadges).toHaveLength(2); // 北京-上海和广州-深圳
        expect(screen.getByText('班次适中')).toBeInTheDocument(); // 杭州-南京
      });
    });
  });

  describe('路线选择功能测试', () => {
    it('点击路线时应调用onRouteSelect回调', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        const routeItem = screen.getByText('北京 → 上海').closest('div');
        fireEvent.click(routeItem);
      });

      expect(mockOnRouteSelect).toHaveBeenCalledWith({
        origin: '北京',
        destination: '上海',
        routeId: 1
      });
    });

    it('点击不同路线应传递正确的参数', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        const routeItem = screen.getByText('广州 → 深圳').closest('div');
        fireEvent.click(routeItem);
      });

      expect(mockOnRouteSelect).toHaveBeenCalledWith({
        origin: '广州',
        destination: '深圳',
        routeId: 2
      });
    });

    it('路线项应该有正确的可点击样式', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        const routeItems = screen.getAllByTestId('route-item');
        routeItems.forEach(item => {
          expect(item).toHaveClass('clickable');
          expect(item).toHaveAttribute('role', 'button');
        });
      });
    });
  });

  describe('刷新功能测试', () => {
    it('点击刷新按钮应重新加载数据', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      // 等待初始加载完成
      await waitFor(() => {
        expect(mockGetHotRoutes).toHaveBeenCalledTimes(1);
      });

      // 点击刷新按钮
      const refreshButton = screen.getByRole('button', { name: /刷新/i });
      fireEvent.click(refreshButton);

      await waitFor(() => {
        expect(mockGetHotRoutes).toHaveBeenCalledTimes(2);
      });
    });

    it('刷新时应显示加载状态', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      // 等待初始加载完成
      await waitFor(() => {
        expect(screen.queryByTestId('loading-spinner')).not.toBeInTheDocument();
      });

      // 设置刷新时的延迟响应
      mockGetHotRoutes.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({
          routes: [],
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
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      // 设置延迟响应
      mockGetHotRoutes.mockImplementation(() => new Promise(resolve => 
        setTimeout(() => resolve({
          routes: [],
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
      mockGetHotRoutes.mockResolvedValue({
        routes: [],
        total: 20,
        hasMore: true
      });

      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        const moreButton = screen.getByRole('button', { name: /查看更多/i });
        expect(moreButton).toBeInTheDocument();
        expect(moreButton).not.toBeDisabled();
      });
    });

    it('当hasMore为false时应隐藏查看更多按钮', async () => {
      mockGetHotRoutes.mockResolvedValue({
        routes: [],
        total: 5,
        hasMore: false
      });

      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        const moreButton = screen.queryByRole('button', { name: /查看更多/i });
        expect(moreButton).not.toBeInTheDocument();
      });
    });

    it('点击查看更多应加载更多路线', async () => {
      // 初始响应
      mockGetHotRoutes.mockResolvedValueOnce({
        routes: [
          {
            id: 1,
            origin: '北京',
            destination: '上海',
            popularity: 95,
            priceRange: '553-1748',
            duration: '4h28m',
            frequency: 'high'
          }
        ],
        total: 20,
        hasMore: true
      });

      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        expect(screen.getByText('北京 → 上海')).toBeInTheDocument();
      });

      // 设置加载更多的响应
      mockGetHotRoutes.mockResolvedValueOnce({
        routes: [
          {
            id: 2,
            origin: '广州',
            destination: '深圳',
            popularity: 88,
            priceRange: '75-99',
            duration: '1h20m',
            frequency: 'high'
          }
        ],
        total: 20,
        hasMore: true
      });

      // 点击查看更多
      const moreButton = screen.getByRole('button', { name: /查看更多/i });
      fireEvent.click(moreButton);

      await waitFor(() => {
        expect(mockGetHotRoutes).toHaveBeenCalledWith({
          limit: 10,
          sortBy: 'popularity',
          offset: 1
        });
      });
    });
  });

  describe('排序功能测试', () => {
    it('应该提供排序选项', () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      expect(screen.getByRole('combobox', { name: /排序方式/i })).toBeInTheDocument();
    });

    it('默认应该按热度排序', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        expect(mockGetHotRoutes).toHaveBeenCalledWith({
          limit: 10,
          sortBy: 'popularity'
        });
      });
    });

    it('切换排序方式应重新加载数据', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      // 等待初始加载
      await waitFor(() => {
        expect(mockGetHotRoutes).toHaveBeenCalledTimes(1);
      });

      // 切换到按价格排序
      const sortSelect = screen.getByRole('combobox', { name: /排序方式/i });
      fireEvent.change(sortSelect, { target: { value: 'price' } });

      await waitFor(() => {
        expect(mockGetHotRoutes).toHaveBeenCalledWith({
          limit: 10,
          sortBy: 'price'
        });
      });
    });

    it('应该支持按热度、价格、时长排序', () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      const sortSelect = screen.getByRole('combobox', { name: /排序方式/i });
      
      expect(screen.getByRole('option', { name: /热度/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /价格/i })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: /时长/i })).toBeInTheDocument();
    });
  });

  describe('空状态处理测试', () => {
    it('当没有热门路线时应显示空状态', async () => {
      mockGetHotRoutes.mockResolvedValue({
        routes: [],
        total: 0,
        hasMore: false
      });

      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        expect(screen.getByText('暂无热门路线')).toBeInTheDocument();
        expect(screen.getByText('请稍后再试或刷新页面')).toBeInTheDocument();
      });
    });

    it('空状态时应显示刷新建议', async () => {
      mockGetHotRoutes.mockResolvedValue({
        routes: [],
        total: 0,
        hasMore: false
      });

      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /重新加载/i })).toBeInTheDocument();
      });
    });
  });

  describe('错误处理测试', () => {
    it('API调用失败时应显示错误信息', async () => {
      mockGetHotRoutes.mockRejectedValue(new Error('网络错误'));

      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        expect(screen.getByText('加载热门路线失败')).toBeInTheDocument();
        expect(screen.getByText('网络连接异常，请检查网络后重试')).toBeInTheDocument();
      });
    });

    it('错误状态时应提供重试按钮', async () => {
      mockGetHotRoutes.mockRejectedValue(new Error('网络错误'));

      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /重试/i })).toBeInTheDocument();
      });
    });

    it('点击重试按钮应重新加载数据', async () => {
      mockGetHotRoutes.mockRejectedValueOnce(new Error('网络错误'));

      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        expect(screen.getByText('加载热门路线失败')).toBeInTheDocument();
      });

      // 设置重试成功的响应
      mockGetHotRoutes.mockResolvedValue({
        routes: [],
        total: 0,
        hasMore: false
      });

      // 点击重试
      const retryButton = screen.getByRole('button', { name: /重试/i });
      fireEvent.click(retryButton);

      await waitFor(() => {
        expect(mockGetHotRoutes).toHaveBeenCalledTimes(2);
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

      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      const container = screen.getByTestId('hot-routes-container');
      expect(container).toHaveClass('mobile-responsive');
    });

    it('移动端应该使用卡片式布局', async () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        const routeItems = screen.getAllByTestId('route-item');
        routeItems.forEach(item => {
          expect(item).toHaveClass('card-layout');
        });
      });
    });
  });

  describe('性能优化测试', () => {
    it('应该支持虚拟滚动（当路线数量较多时）', async () => {
      const manyRoutes = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        origin: `城市${i + 1}`,
        destination: `城市${i + 2}`,
        popularity: 90 - i,
        priceRange: '100-500',
        duration: '2h30m',
        frequency: 'medium'
      }));

      mockGetHotRoutes.mockResolvedValue({
        routes: manyRoutes,
        total: 100,
        hasMore: false
      });

      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        const virtualContainer = screen.getByTestId('virtual-scroll-container');
        expect(virtualContainer).toBeInTheDocument();
      });
    });

    it('应该实现路线项的懒加载', async () => {
      render(<HotRoutes onRouteSelect={mockOnRouteSelect} />);

      await waitFor(() => {
        const lazyImages = screen.getAllByTestId('lazy-image');
        lazyImages.forEach(img => {
          expect(img).toHaveAttribute('loading', 'lazy');
        });
      });
    });
  });
});