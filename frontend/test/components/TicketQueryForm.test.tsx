import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import TicketQueryForm from '../../src/components/TicketQueryForm.jsx';

// Mock API calls
const mockSearchTrains = vi.fn();

vi.mock('../../src/api/train', () => ({
  searchTrains: mockSearchTrains,
}));

describe('TicketQueryForm Component Tests', () => {
  const mockOnSearch = vi.fn();
  const defaultValues = {
    fromStation: '北京',
    toStation: '上海',
    departDate: '2025-01-20',
    returnDate: '',
    passengerType: 'adult',
    trainType: 'all',
    onlyAvailable: false,
    includeNoSeat: false
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('组件渲染测试', () => {
    it('应该渲染所有必需的表单字段', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      // 验证出发地/目的地选择器
      expect(screen.getByLabelText(/出发地/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/目的地/i)).toBeInTheDocument();

      // 验证日期选择器
      expect(screen.getByLabelText(/出发日期/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/返程日期/i)).toBeInTheDocument();

      // 验证乘客类型选择
      expect(screen.getByLabelText(/乘客类型/i)).toBeInTheDocument();

      // 验证车次类型选择
      expect(screen.getByLabelText(/车次类型/i)).toBeInTheDocument();

      // 验证查询选项
      expect(screen.getByLabelText(/只看有票/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/包含无座/i)).toBeInTheDocument();
    });

    it('应该渲染查询按钮', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      expect(screen.getByRole('button', { name: /查询/i })).toBeInTheDocument();
    });

    it('应该渲染出发地/目的地交换按钮', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      expect(screen.getByRole('button', { name: /交换/i })).toBeInTheDocument();
    });
  });

  describe('默认值测试', () => {
    it('应该使用提供的默认值填充表单', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      expect(screen.getByDisplayValue('北京')).toBeInTheDocument();
      expect(screen.getByDisplayValue('上海')).toBeInTheDocument();
      expect(screen.getByDisplayValue('2025-01-20')).toBeInTheDocument();
    });

    it('没有提供默认值时应使用合理的初始值', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
        />
      );

      // 出发日期应默认为今天
      const today = new Date().toISOString().split('T')[0];
      expect(screen.getByDisplayValue(today)).toBeInTheDocument();

      // 乘客类型应默认为成人
      expect(screen.getByDisplayValue('成人')).toBeInTheDocument();

      // 车次类型应默认为全部
      expect(screen.getByDisplayValue('全部车次')).toBeInTheDocument();
    });
  });

  describe('出发地/目的地功能测试', () => {
    it('点击出发地输入框时应打开车站选择器', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const fromStationInput = screen.getByLabelText(/出发地/i);
      fireEvent.click(fromStationInput);

      // 应显示车站选择器
      expect(screen.getByTestId('station-selector')).toBeInTheDocument();
    });

    it('点击目的地输入框时应打开车站选择器', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const toStationInput = screen.getByLabelText(/目的地/i);
      fireEvent.click(toStationInput);

      // 应显示车站选择器
      expect(screen.getByTestId('station-selector')).toBeInTheDocument();
    });

    it('点击交换按钮时应交换出发地和目的地', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const swapButton = screen.getByRole('button', { name: /交换/i });
      fireEvent.click(swapButton);

      // 验证出发地和目的地已交换
      expect(screen.getByDisplayValue('上海')).toBeInTheDocument();
      expect(screen.getByDisplayValue('北京')).toBeInTheDocument();
    });

    it('出发地和目的地不能相同', async () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      // 尝试将目的地设置为与出发地相同
      const toStationInput = screen.getByLabelText(/目的地/i);
      fireEvent.change(toStationInput, { target: { value: '北京' } });

      // 应显示错误提示
      await waitFor(() => {
        expect(screen.getByText(/出发地和目的地不能相同/i)).toBeInTheDocument();
      });
    });
  });

  describe('日期选择功能测试', () => {
    it('点击出发日期时应打开日期选择器', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const departDateInput = screen.getByLabelText(/出发日期/i);
      fireEvent.click(departDateInput);

      // 应显示日期选择器
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    it('出发日期不能早于今天', async () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const departDateInput = screen.getByLabelText(/出发日期/i);
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      fireEvent.change(departDateInput, { target: { value: yesterdayStr } });

      // 应显示错误提示
      await waitFor(() => {
        expect(screen.getByText(/出发日期不能早于今天/i)).toBeInTheDocument();
      });
    });

    it('返程日期不能早于出发日期', async () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const returnDateInput = screen.getByLabelText(/返程日期/i);
      fireEvent.change(returnDateInput, { target: { value: '2025-01-19' } });

      // 应显示错误提示
      await waitFor(() => {
        expect(screen.getByText(/返程日期不能早于出发日期/i)).toBeInTheDocument();
      });
    });
  });

  describe('乘客类型选择测试', () => {
    it('应该提供成人、儿童、学生等乘客类型选项', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const passengerTypeSelect = screen.getByLabelText(/乘客类型/i);
      fireEvent.click(passengerTypeSelect);

      expect(screen.getByText('成人')).toBeInTheDocument();
      expect(screen.getByText('儿童')).toBeInTheDocument();
      expect(screen.getByText('学生')).toBeInTheDocument();
    });

    it('选择不同乘客类型时应更新表单状态', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const passengerTypeSelect = screen.getByLabelText(/乘客类型/i);
      fireEvent.change(passengerTypeSelect, { target: { value: 'student' } });

      expect(screen.getByDisplayValue('学生')).toBeInTheDocument();
    });
  });

  describe('车次类型选择测试', () => {
    it('应该提供全部、高铁/动车、普通列车等车次类型选项', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const trainTypeSelect = screen.getByLabelText(/车次类型/i);
      fireEvent.click(trainTypeSelect);

      expect(screen.getByText('全部车次')).toBeInTheDocument();
      expect(screen.getByText('高铁/动车')).toBeInTheDocument();
      expect(screen.getByText('普通列车')).toBeInTheDocument();
    });

    it('选择不同车次类型时应更新表单状态', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const trainTypeSelect = screen.getByLabelText(/车次类型/i);
      fireEvent.change(trainTypeSelect, { target: { value: 'high-speed' } });

      expect(screen.getByDisplayValue('高铁/动车')).toBeInTheDocument();
    });
  });

  describe('查询选项测试', () => {
    it('应该支持"只看有票"选项', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const onlyAvailableCheckbox = screen.getByLabelText(/只看有票/i);
      expect(onlyAvailableCheckbox).not.toBeChecked();

      fireEvent.click(onlyAvailableCheckbox);
      expect(onlyAvailableCheckbox).toBeChecked();
    });

    it('应该支持"包含无座"选项', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const includeNoSeatCheckbox = screen.getByLabelText(/包含无座/i);
      expect(includeNoSeatCheckbox).not.toBeChecked();

      fireEvent.click(includeNoSeatCheckbox);
      expect(includeNoSeatCheckbox).toBeChecked();
    });
  });

  describe('表单验证测试', () => {
    it('出发地为空时应显示错误提示', async () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={{ ...defaultValues, fromStation: '' }}
        />
      );

      const queryButton = screen.getByRole('button', { name: /查询/i });
      fireEvent.click(queryButton);

      await waitFor(() => {
        expect(screen.getByText(/请选择出发地/i)).toBeInTheDocument();
      });
    });

    it('目的地为空时应显示错误提示', async () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={{ ...defaultValues, toStation: '' }}
        />
      );

      const queryButton = screen.getByRole('button', { name: /查询/i });
      fireEvent.click(queryButton);

      await waitFor(() => {
        expect(screen.getByText(/请选择目的地/i)).toBeInTheDocument();
      });
    });

    it('出发日期为空时应显示错误提示', async () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={{ ...defaultValues, departDate: '' }}
        />
      );

      const queryButton = screen.getByRole('button', { name: /查询/i });
      fireEvent.click(queryButton);

      await waitFor(() => {
        expect(screen.getByText(/请选择出发日期/i)).toBeInTheDocument();
      });
    });
  });

  describe('查询功能测试', () => {
    it('表单验证通过时应调用onSearch回调', async () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const queryButton = screen.getByRole('button', { name: /查询/i });
      fireEvent.click(queryButton);

      await waitFor(() => {
        expect(mockOnSearch).toHaveBeenCalledWith({
          fromStation: '北京',
          toStation: '上海',
          departDate: '2025-01-20',
          returnDate: '',
          passengerType: 'adult',
          trainType: 'all',
          onlyAvailable: false,
          includeNoSeat: false
        });
      });
    });

    it('查询过程中应显示加载状态', async () => {
      // 模拟API调用延迟
      mockSearchTrains.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));

      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const queryButton = screen.getByRole('button', { name: /查询/i });
      fireEvent.click(queryButton);

      // 验证按钮显示加载状态
      await waitFor(() => {
        expect(queryButton).toBeDisabled();
        expect(screen.getByText(/查询中.../i)).toBeInTheDocument();
      });
    });
  });

  describe('禁用状态测试', () => {
    it('当disabled为true时整个表单应被禁用', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
          disabled={true}
        />
      );

      // 所有输入框应被禁用
      expect(screen.getByLabelText(/出发地/i)).toBeDisabled();
      expect(screen.getByLabelText(/目的地/i)).toBeDisabled();
      expect(screen.getByLabelText(/出发日期/i)).toBeDisabled();
      expect(screen.getByLabelText(/返程日期/i)).toBeDisabled();

      // 查询按钮应被禁用
      expect(screen.getByRole('button', { name: /查询/i })).toBeDisabled();
    });
  });

  describe('状态管理测试', () => {
    it('应该正确管理showDatePicker状态', () => {
      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      // 初始状态下日期选择器应该是隐藏的
      expect(screen.queryByTestId('date-picker')).not.toBeInTheDocument();

      // 点击日期输入框
      const departDateInput = screen.getByLabelText(/出发日期/i);
      fireEvent.click(departDateInput);

      // 日期选择器应该显示
      expect(screen.getByTestId('date-picker')).toBeInTheDocument();
    });

    it('应该正确管理isLoading状态', async () => {
      mockSearchTrains.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <TicketQueryForm
          onSearch={mockOnSearch}
          defaultValues={defaultValues}
        />
      );

      const queryButton = screen.getByRole('button', { name: /查询/i });
      
      // 初始状态不应该是加载中
      expect(queryButton).not.toBeDisabled();

      // 点击查询按钮
      fireEvent.click(queryButton);

      // 应该进入加载状态
      await waitFor(() => {
        expect(queryButton).toBeDisabled();
      });

      // 等待查询完成
      await waitFor(() => {
        expect(queryButton).not.toBeDisabled();
      }, { timeout: 200 });
    });
  });
});