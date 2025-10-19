import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import DatePicker from '../../src/components/DatePicker.jsx';

// Mock API calls
const mockGetSystemConfig = vi.fn();

vi.mock('../../src/api.js', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('DatePicker Component Tests', () => {
  const mockOnDateSelect = vi.fn();
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 设置默认的系统配置响应
    mockGetSystemConfig.mockResolvedValue({
      holidays: ['2025-01-01', '2025-02-10', '2025-02-11', '2025-02-12'],
      ticketSaleDays: 30, // 可预售30天
      workdays: ['2025-02-08', '2025-02-09'] // 调休工作日
    });
  });

  describe('组件渲染测试', () => {
    it('应该渲染日历界面', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByTestId('date-picker-calendar')).toBeInTheDocument();
    });

    it('应该渲染快速选择选项', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /今天/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /明天/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /后天/i })).toBeInTheDocument();
    });

    it('应该渲染月份导航按钮', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /上个月/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /下个月/i })).toBeInTheDocument();
    });

    it('应该渲染关闭按钮', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByRole('button', { name: /关闭/i })).toBeInTheDocument();
    });

    it('当isOpen为false时不应该渲染组件', () => {
      render(
        <DatePicker
          isOpen={false}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByTestId('date-picker-calendar')).not.toBeInTheDocument();
    });
  });

  describe('日期选择功能测试', () => {
    it('点击日期时应调用onDateSelect回调', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const dateButton = screen.getByRole('button', { name: '25' });
      fireEvent.click(dateButton);

      expect(mockOnDateSelect).toHaveBeenCalledWith('2025-01-25');
    });

    it('应该高亮显示当前选中的日期', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const selectedDate = screen.getByRole('button', { name: '20' });
      expect(selectedDate).toHaveClass('selected');
    });

    it('应该高亮显示今天的日期', () => {
      const today = new Date();
      const todayStr = today.toISOString().split('T')[0];

      render(
        <DatePicker
          isOpen={true}
          selectedDate={todayStr}
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const todayButton = screen.getByRole('button', { name: today.getDate().toString() });
      expect(todayButton).toHaveClass('today');
    });
  });

  describe('快速选择功能测试', () => {
    it('点击"今天"应该选择今天的日期', () => {
      const today = new Date().toISOString().split('T')[0];

      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const todayButton = screen.getByRole('button', { name: /今天/i });
      fireEvent.click(todayButton);

      expect(mockOnDateSelect).toHaveBeenCalledWith(today);
    });

    it('点击"明天"应该选择明天的日期', () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const tomorrowButton = screen.getByRole('button', { name: /明天/i });
      fireEvent.click(tomorrowButton);

      expect(mockOnDateSelect).toHaveBeenCalledWith(tomorrowStr);
    });

    it('点击"后天"应该选择后天的日期', () => {
      const dayAfterTomorrow = new Date();
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
      const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const dayAfterTomorrowButton = screen.getByRole('button', { name: /后天/i });
      fireEvent.click(dayAfterTomorrowButton);

      expect(mockOnDateSelect).toHaveBeenCalledWith(dayAfterTomorrowStr);
    });
  });

  describe('日期限制功能测试', () => {
    it('应该禁用过去的日期', () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const yesterdayButton = screen.getByRole('button', { name: yesterday.getDate().toString() });
      expect(yesterdayButton).toBeDisabled();
      expect(yesterdayButton).toHaveClass('disabled');
    });

    it('应该禁用超出预售期的日期', async () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      // 等待系统配置加载
      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalled();
      });

      // 计算超出预售期的日期（30天后）
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 31);

      // 如果该日期在当前月份显示，应该被禁用
      const futureDateButton = screen.queryByRole('button', { name: futureDate.getDate().toString() });
      if (futureDateButton) {
        expect(futureDateButton).toBeDisabled();
        expect(futureDateButton).toHaveClass('out-of-range');
      }
    });

    it('今天应该是可选择的', () => {
      const today = new Date();

      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const todayButton = screen.getByRole('button', { name: today.getDate().toString() });
      expect(todayButton).not.toBeDisabled();
    });
  });

  describe('节假日信息显示测试', () => {
    it('应该调用系统配置API获取节假日信息', async () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(mockGetSystemConfig).toHaveBeenCalledWith(['holidays', 'ticketSaleDays', 'workdays']);
      });
    });

    it('应该标记节假日', async () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        // 假设2025-01-01是元旦节假日
        const holidayButton = screen.getByRole('button', { name: '1' });
        expect(holidayButton).toHaveClass('holiday');
      });
    });

    it('应该标记调休工作日', async () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-02-01"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        // 假设2025-02-08是调休工作日
        const workdayButton = screen.getByRole('button', { name: '8' });
        expect(workdayButton).toHaveClass('workday');
      });
    });

    it('节假日应该显示特殊标识', async () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const holidayButton = screen.getByRole('button', { name: '1' });
        expect(holidayButton).toHaveAttribute('title', '节假日');
      });
    });
  });

  describe('月份导航功能测试', () => {
    it('点击上个月按钮应该切换到上个月', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const prevMonthButton = screen.getByRole('button', { name: /上个月/i });
      fireEvent.click(prevMonthButton);

      // 应该显示上个月的日期
      expect(screen.getByText('2024年12月')).toBeInTheDocument();
    });

    it('点击下个月按钮应该切换到下个月', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const nextMonthButton = screen.getByRole('button', { name: /下个月/i });
      fireEvent.click(nextMonthButton);

      // 应该显示下个月的日期
      expect(screen.getByText('2025年2月')).toBeInTheDocument();
    });

    it('应该显示当前月份和年份', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('2025年1月')).toBeInTheDocument();
    });
  });

  describe('票务可用性显示测试', () => {
    it('应该显示有票的日期', async () => {
      const mockTicketAvailability = {
        '2025-01-20': { available: true, ticketCount: 100 },
        '2025-01-21': { available: false, ticketCount: 0 }
      };

      mockGetSystemConfig.mockResolvedValue({
        ...mockGetSystemConfig.mockResolvedValue(),
        ticketAvailability: mockTicketAvailability
      });

      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const availableDate = screen.getByRole('button', { name: '20' });
        expect(availableDate).toHaveClass('tickets-available');
      });
    });

    it('应该显示无票的日期', async () => {
      const mockTicketAvailability = {
        '2025-01-21': { available: false, ticketCount: 0 }
      };

      mockGetSystemConfig.mockResolvedValue({
        ...mockGetSystemConfig.mockResolvedValue(),
        ticketAvailability: mockTicketAvailability
      });

      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        const unavailableDate = screen.getByRole('button', { name: '21' });
        expect(unavailableDate).toHaveClass('no-tickets');
      });
    });
  });

  describe('交互功能测试', () => {
    it('点击关闭按钮时应调用onClose回调', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getByRole('button', { name: /关闭/i });
      fireEvent.click(closeButton);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('点击遮罩层时应调用onClose回调', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const overlay = screen.getByTestId('date-picker-overlay');
      fireEvent.click(overlay);

      expect(mockOnClose).toHaveBeenCalled();
    });

    it('按ESC键时应调用onClose回调', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      fireEvent.keyDown(document, { key: 'Escape', code: 'Escape' });

      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  describe('键盘导航测试', () => {
    it('应该支持方向键导航日期', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const calendar = screen.getByTestId('date-picker-calendar');
      
      // 按右箭头键应该移动到下一天
      fireEvent.keyDown(calendar, { key: 'ArrowRight', code: 'ArrowRight' });
      
      const nextDay = screen.getByRole('button', { name: '21' });
      expect(nextDay).toHaveClass('focused');
    });

    it('按Enter键应该选择当前聚焦的日期', () => {
      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const calendar = screen.getByTestId('date-picker-calendar');
      
      // 按右箭头键移动到21号
      fireEvent.keyDown(calendar, { key: 'ArrowRight', code: 'ArrowRight' });
      
      // 按Enter键选择
      fireEvent.keyDown(calendar, { key: 'Enter', code: 'Enter' });

      expect(mockOnDateSelect).toHaveBeenCalledWith('2025-01-21');
    });
  });

  describe('错误处理测试', () => {
    it('系统配置加载失败时应显示错误提示', async () => {
      mockGetSystemConfig.mockRejectedValue(new Error('网络错误'));

      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      await waitFor(() => {
        expect(screen.getByText(/加载日历信息失败/i)).toBeInTheDocument();
      });
    });

    it('系统配置加载失败时仍应显示基本日历功能', async () => {
      mockGetSystemConfig.mockRejectedValue(new Error('网络错误'));

      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      // 基本的日期选择功能仍应可用
      const dateButton = screen.getByRole('button', { name: '25' });
      fireEvent.click(dateButton);

      expect(mockOnDateSelect).toHaveBeenCalledWith('2025-01-25');
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

      render(
        <DatePicker
          isOpen={true}
          selectedDate="2025-01-20"
          onDateSelect={mockOnDateSelect}
          onClose={mockOnClose}
        />
      );

      const calendar = screen.getByTestId('date-picker-calendar');
      expect(calendar).toHaveClass('mobile-responsive');
    });
  });
});