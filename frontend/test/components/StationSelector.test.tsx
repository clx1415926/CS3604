import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import StationSelector from '../../src/components/StationSelector.jsx';

// Mock API calls
const mockSearchStations = vi.fn();
const mockGetHotCities = vi.fn();
const mockGetUserRecentStations = vi.fn();

vi.mock('../../src/api/station', () => ({
  searchStations: mockSearchStations,
  getHotCities: mockGetHotCities,
  getUserRecentStations: mockGetUserRecentStations,
}));

describe('StationSelector Component Tests', () => {
  const mockOnSelect = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 设置默认的API响应
    mockGetHotCities.mockResolvedValue([
      { code: 'BJS', name: '北京', pinyin: 'beijing' },
      { code: 'SHH', name: '上海', pinyin: 'shanghai' },
      { code: 'GZQ', name: '广州', pinyin: 'guangzhou' }
    ]);
    
    mockGetUserRecentStations.mockResolvedValue([
      { code: 'TJP', name: '天津', pinyin: 'tianjin' },
      { code: 'SJP', name: '石家庄', pinyin: 'shijiazhuang' }
    ]);
    
    mockSearchStations.mockResolvedValue([
      { code: 'BJS', name: '北京', pinyin: 'beijing' },
      { code: 'BJP', name: '北京西', pinyin: 'beijingxi' }
    ]);
  });

  describe('组件渲染测试', () => {
    it('应该渲染搜索输入框', () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByPlaceholderText(/请输入车站名/i)).toBeInTheDocument();
    });

    it('应该渲染热门城市标签页', () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('tab', { name: /热门城市/i })).toBeInTheDocument();
    });

    it('应该渲染最近车站标签页', () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('tab', { name: /最近车站/i })).toBeInTheDocument();
    });

    it('应该渲染关闭按钮', () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /关闭/i })).toBeInTheDocument();
    });

    it('当isOpen为false时不应该渲染组件', () => {
      render(
        <StationSelector
          isOpen={false}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByPlaceholderText(/请输入车站名/i)).not.toBeInTheDocument();
    });
  });

  describe('搜索功能测试', () => {
    it('输入关键词时应调用API-GET-StationsSearch接口', async () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const searchInput = screen.getByPlaceholderText(/请输入车站名/i);
      fireEvent.change(searchInput, { target: { value: '北京' } });

      await waitFor(() => {
        expect(mockSearchStations).toHaveBeenCalledWith({
          keyword: '北京',
          limit: 10
        });
      });
    });

    it('应该显示搜索结果列表', async () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const searchInput = screen.getByPlaceholderText(/请输入车站名/i);
      fireEvent.change(searchInput, { target: { value: '北京' } });

      await waitFor(() => {
        expect(screen.getByText('北京')).toBeInTheDocument();
        expect(screen.getByText('北京西')).toBeInTheDocument();
      });
    });

    it('搜索结果为空时应显示无结果提示', async () => {
      mockSearchStations.mockResolvedValue([]);

      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const searchInput = screen.getByPlaceholderText(/请输入车站名/i);
      fireEvent.change(searchInput, { target: { value: '不存在的车站' } });

      await waitFor(() => {
        expect(screen.getByText(/未找到相关车站/i)).toBeInTheDocument();
      });
    });

    it('搜索过程中应显示加载状态', async () => {
      // 模拟API调用延迟
      mockSearchStations.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const searchInput = screen.getByPlaceholderText(/请输入车站名/i);
      fireEvent.change(searchInput, { target: { value: '北京' } });

      await waitFor(() => {
        expect(screen.getByText(/搜索中.../i)).toBeInTheDocument();
      });
    });

    it('点击搜索结果时应调用onSelect回调', async () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const searchInput = screen.getByPlaceholderText(/请输入车站名/i);
      fireEvent.change(searchInput, { target: { value: '北京' } });

      await waitFor(() => {
        const stationItem = screen.getByText('北京');
        fireEvent.click(stationItem);
      });

      expect(mockOnSelect).toHaveBeenCalledWith({
        code: 'BJS',
        name: '北京',
        pinyin: 'beijing'
      });
    });
  });

  describe('热门城市功能测试', () => {
    it('应该调用API-GET-HotCities接口获取热门城市', async () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockGetHotCities).toHaveBeenCalled();
      });
    });

    it('应该显示热门城市列表', async () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      // 点击热门城市标签页
      const hotCitiesTab = screen.getByRole('tab', { name: /热门城市/i });
      fireEvent.click(hotCitiesTab);

      await waitFor(() => {
        expect(screen.getByText('北京')).toBeInTheDocument();
        expect(screen.getByText('上海')).toBeInTheDocument();
        expect(screen.getByText('广州')).toBeInTheDocument();
      });
    });

    it('点击热门城市时应调用onSelect回调', async () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const hotCitiesTab = screen.getByRole('tab', { name: /热门城市/i });
      fireEvent.click(hotCitiesTab);

      await waitFor(() => {
        const cityItem = screen.getByText('北京');
        fireEvent.click(cityItem);
      });

      expect(mockOnSelect).toHaveBeenCalledWith({
        code: 'BJS',
        name: '北京',
        pinyin: 'beijing'
      });
    });

    it('热门城市按使用频率排序显示', async () => {
      const sortedHotCities = [
        { code: 'SHH', name: '上海', pinyin: 'shanghai', frequency: 100 },
        { code: 'BJS', name: '北京', pinyin: 'beijing', frequency: 90 },
        { code: 'GZQ', name: '广州', pinyin: 'guangzhou', frequency: 80 }
      ];
      
      mockGetHotCities.mockResolvedValue(sortedHotCities);

      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const hotCitiesTab = screen.getByRole('tab', { name: /热门城市/i });
      fireEvent.click(hotCitiesTab);

      await waitFor(() => {
        const cityItems = screen.getAllByTestId('city-item');
        expect(cityItems[0]).toHaveTextContent('上海');
        expect(cityItems[1]).toHaveTextContent('北京');
        expect(cityItems[2]).toHaveTextContent('广州');
      });
    });
  });

  describe('最近车站功能测试', () => {
    it('应该调用API-GET-UserRecentStations接口获取最近车站', async () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      // 点击最近车站标签页
      const recentStationsTab = screen.getByRole('tab', { name: /最近车站/i });
      fireEvent.click(recentStationsTab);

      await waitFor(() => {
        expect(mockGetUserRecentStations).toHaveBeenCalled();
      });
    });

    it('应该显示最近车站列表', async () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const recentStationsTab = screen.getByRole('tab', { name: /最近车站/i });
      fireEvent.click(recentStationsTab);

      await waitFor(() => {
        expect(screen.getByText('天津')).toBeInTheDocument();
        expect(screen.getByText('石家庄')).toBeInTheDocument();
      });
    });

    it('点击最近车站时应调用onSelect回调', async () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const recentStationsTab = screen.getByRole('tab', { name: /最近车站/i });
      fireEvent.click(recentStationsTab);

      await waitFor(() => {
        const stationItem = screen.getByText('天津');
        fireEvent.click(stationItem);
      });

      expect(mockOnSelect).toHaveBeenCalledWith({
        code: 'TJP',
        name: '天津',
        pinyin: 'tianjin'
      });
    });

    it('未登录用户应显示登录提示', async () => {
      mockGetUserRecentStations.mockRejectedValue(new Error('未登录'));

      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const recentStationsTab = screen.getByRole('tab', { name: /最近车站/i });
      fireEvent.click(recentStationsTab);

      await waitFor(() => {
        expect(screen.getByText(/请先登录查看最近车站/i)).toBeInTheDocument();
      });
    });

    it('最近车站按时间倒序显示', async () => {
      const sortedRecentStations = [
        { code: 'SJP', name: '石家庄', pinyin: 'shijiazhuang', lastUsed: '2025-01-18' },
        { code: 'TJP', name: '天津', pinyin: 'tianjin', lastUsed: '2025-01-17' }
      ];
      
      mockGetUserRecentStations.mockResolvedValue(sortedRecentStations);

      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const recentStationsTab = screen.getByRole('tab', { name: /最近车站/i });
      fireEvent.click(recentStationsTab);

      await waitFor(() => {
        const stationItems = screen.getAllByTestId('station-item');
        expect(stationItems[0]).toHaveTextContent('石家庄');
        expect(stationItems[1]).toHaveTextContent('天津');
      });
    });
  });

  describe('交互功能测试', () => {
    it('点击关闭按钮时应调用onClose回调', () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /关闭/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('点击遮罩层时应调用onClose回调', () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const overlay = screen.getByTestId('selector-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('按ESC键时应调用onClose回调', () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('标签页切换测试', () => {
    it('应该支持在热门城市和最近车站之间切换', () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const hotCitiesTab = screen.getByRole('tab', { name: /热门城市/i });
      const recentStationsTab = screen.getByRole('tab', { name: /最近车站/i });

      // 默认应该显示热门城市
      expect(hotCitiesTab).toHaveAttribute('aria-selected', 'true');
      expect(recentStationsTab).toHaveAttribute('aria-selected', 'false');

      // 切换到最近车站
      fireEvent.click(recentStationsTab);
      expect(hotCitiesTab).toHaveAttribute('aria-selected', 'false');
      expect(recentStationsTab).toHaveAttribute('aria-selected', 'true');
    });

    it('切换标签页时应清空搜索结果', async () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      // 先进行搜索
      const searchInput = screen.getByPlaceholderText(/请输入车站名/i);
      fireEvent.change(searchInput, { target: { value: '北京' } });

      await waitFor(() => {
        expect(screen.getByText('北京')).toBeInTheDocument();
      });

      // 切换标签页
      const recentStationsTab = screen.getByRole('tab', { name: /最近车站/i });
      fireEvent.click(recentStationsTab);

      // 搜索结果应该被清空
      expect(screen.queryByText('北京西')).not.toBeInTheDocument();
    });
  });

  describe('键盘导航测试', () => {
    it('应该支持上下箭头键导航搜索结果', async () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const searchInput = screen.getByPlaceholderText(/请输入车站名/i);
      fireEvent.change(searchInput, { target: { value: '北京' } });

      await waitFor(() => {
        expect(screen.getByText('北京')).toBeInTheDocument();
      });

      // 按下箭头键应该高亮第一个结果
      fireEvent.keyDown(searchInput, { key: 'ArrowDown', code: 'ArrowDown' });
      
      const firstResult = screen.getByText('北京');
      expect(firstResult).toHaveClass('highlighted');
    });

    it('按Enter键应该选择当前高亮的结果', async () => {
      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const searchInput = screen.getByPlaceholderText(/请输入车站名/i);
      fireEvent.change(searchInput, { target: { value: '北京' } });

      await waitFor(() => {
        expect(screen.getByText('北京')).toBeInTheDocument();
      });

      // 按下箭头键高亮第一个结果
      fireEvent.keyDown(searchInput, { key: 'ArrowDown', code: 'ArrowDown' });
      
      // 按Enter键选择
      fireEvent.keyDown(searchInput, { key: 'Enter', code: 'Enter' });

      expect(mockOnSelect).toHaveBeenCalledWith({
        code: 'BJS',
        name: '北京',
        pinyin: 'beijing'
      });
    });
  });

  describe('错误处理测试', () => {
    it('API调用失败时应显示错误提示', async () => {
      mockSearchStations.mockRejectedValue(new Error('网络错误'));

      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      const searchInput = screen.getByPlaceholderText(/请输入车站名/i);
      fireEvent.change(searchInput, { target: { value: '北京' } });

      await waitFor(() => {
        expect(screen.getByText(/搜索失败，请重试/i)).toBeInTheDocument();
      });
    });

    it('热门城市加载失败时应显示错误提示', async () => {
      mockGetHotCities.mockRejectedValue(new Error('网络错误'));

      render(
        <StationSelector
          isOpen={true}
          onSelect={mockOnSelect}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/加载热门城市失败/i)).toBeInTheDocument();
      });
    });
  });
});