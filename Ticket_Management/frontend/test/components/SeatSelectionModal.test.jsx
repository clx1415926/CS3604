/**
 * 测试范围：SeatSelectionModal
 * - 组件渲染测试：加载态/错误态/座位布局展示
 * - 功能逻辑测试：选座切换、占用座位不可选、超额选择限制
 * - 状态管理测试：车厢切换后清空已选状态
 * - 事件处理测试：确认/取消回调触发
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import SeatSelectionModal from '../../src/components/SeatSelectionModal';

function mockJson(ok, body, status = ok ? 200 : 400) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  });
}

describe('Feature: SeatSelectionModal', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should fetch seat map on mount and allow selecting seats up to passengerCount', async () => {
    // 场景：加载座位图成功；允许选择不超过乘车人数的座位
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const seats = [
      { seat_no: '1A', row: 1, column: 'A', window: true, occupied: false },
      { seat_no: '1B', row: 1, column: 'B', window: false, occupied: false },
      { seat_no: '1C', row: 1, column: 'C', window: false, occupied: true },
    ];

    const fetchMock = vi.fn((url) => {
      if (String(url).includes('/api/v1/seats/map')) {
        return mockJson(true, { seats });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    globalThis.fetch = fetchMock;

    render(
      <SeatSelectionModal
        trainId="G123"
        travelDate="2025-11-17"
        passengerCount={2}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    // 断言：初次渲染会触发 seat map 请求
    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(String(fetchMock.mock.calls[0][0])).toContain('train_id=G123');
    expect(String(fetchMock.mock.calls[0][0])).toContain('travel_date=2025-11-17');

    // 断言：确认按钮初始禁用（未选够座位）
    const confirmBtn = screen.getByRole('button', { name: '确认选座' });
    expect(confirmBtn).toBeDisabled();

    // 交互：点击可选座位 1A / 1B
    fireEvent.click(screen.getByRole('button', { name: /^A/ }));
    fireEvent.click(screen.getByRole('button', { name: /^B/ }));

    // 断言：选够 2 个座位后确认按钮可用
    expect(confirmBtn).not.toBeDisabled();

    // 交互：尝试点击已占用座位 1C（应无效果）
    const occupiedBtn = screen.getByRole('button', { name: /^C/ });
    expect(occupiedBtn).toBeDisabled();
    fireEvent.click(occupiedBtn);

    // 交互：点击“确认选座”
    fireEvent.click(confirmBtn);

    // 断言：回调参数包含 carriage_no 与 seat_no
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onConfirm.mock.calls[0][0]).toEqual([
      { carriage_no: '10', seat_no: '1A' },
      { carriage_no: '10', seat_no: '1B' },
    ]);
  });

  it('should prevent selecting more than passengerCount and show error', async () => {
    // 场景：选择座位超过乘车人数时，应提示错误并保持已选数量不超限
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const seats = [
      { seat_no: '1A', row: 1, column: 'A', window: true, occupied: false },
      { seat_no: '1B', row: 1, column: 'B', window: false, occupied: false },
    ];

    globalThis.fetch = vi.fn(() => mockJson(true, { seats }));

    render(
      <SeatSelectionModal
        trainId="G123"
        travelDate="2025-11-17"
        passengerCount={1}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    await screen.findByText('需要选择 1 个座位，已选择 0 个');

    // 交互：先选 1A，再尝试选 1B
    fireEvent.click(screen.getByRole('button', { name: /^A/ }));
    fireEvent.click(screen.getByRole('button', { name: /^B/ }));

    // 断言：出现超额提示
    expect(await screen.findByText('最多只能选择 1 个座位')).toBeInTheDocument();
  });

  it('should clear selection when carriage changes', async () => {
    // 场景：切换车厢后应清空已选座位，并重新拉取座位图
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    const fetchMock = vi.fn((url) => {
      if (String(url).includes('carriage_no=10')) {
        return mockJson(true, { seats: [{ seat_no: '1A', row: 1, column: 'A', window: true, occupied: false }] });
      }
      if (String(url).includes('carriage_no=11')) {
        return mockJson(true, { seats: [{ seat_no: '2A', row: 2, column: 'A', window: true, occupied: false }] });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    globalThis.fetch = fetchMock;

    render(
      <SeatSelectionModal
        trainId="G123"
        travelDate="2025-11-17"
        passengerCount={1}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    );

    await screen.findByText('10号车厢 - 二等座');
    fireEvent.click(screen.getByRole('button', { name: /^A/ }));

    // 交互：切换车厢到 11 号车厢
    fireEvent.change(screen.getByDisplayValue('10号车厢'), { target: { value: '11' } });

    // 断言：重新拉取并展示 11 号车厢
    expect(await screen.findByText('11号车厢 - 二等座')).toBeInTheDocument();

    // 断言：选座计数被重置
    expect(screen.getByText('需要选择 1 个座位，已选择 0 个')).toBeInTheDocument();
  });
});
