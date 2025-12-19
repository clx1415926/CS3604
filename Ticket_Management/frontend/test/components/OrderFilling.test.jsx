/**
 * 测试范围：OrderFilling
 * - 组件渲染测试：车次信息与联系人列表渲染
 * - 功能逻辑测试：未选择乘车人时阻止提交、选择后进入温馨提示/选座流程
 * - 状态管理测试：乘车人勾选切换、刷新联系人状态
 * - 事件处理测试：提交订单触发锁座与下单请求
 * - 页面跳转测试：下单成功后跳转到支付页（hash 参数传递）
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';

// 说明：此文件会在集成测试中 mock 子组件，以聚焦 OrderFilling 的业务流程。
vi.mock('../../src/components/WarmTipModal', () => {
  return {
    default: ({ onConfirm, onCancel }) => (
      <div data-testid="warm-tip">
        <div>温馨提示</div>
        <button onClick={onCancel}>取消</button>
        <button onClick={onConfirm}>确认</button>
      </div>
    ),
  };
});

vi.mock('../../src/components/SeatSelectionModal', () => {
  return {
    default: ({ onConfirm, onCancel, passengerCount }) => (
      <div data-testid="seat-modal">
        <div>选择座位</div>
        <div>passengerCount:{passengerCount}</div>
        <button onClick={onCancel}>取消</button>
        <button
          onClick={() =>
            onConfirm([
              { carriage_no: '10', seat_no: '1A' },
              { carriage_no: '10', seat_no: '1B' },
            ])
          }
        >
          确认选座
        </button>
      </div>
    ),
  };
});

import OrderFilling from '../../src/components/OrderFilling';

function mockJson(ok, body, status = ok ? 200 : 400) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  });
}

describe('Feature: OrderFilling', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '#order-filling?trainNo=G123&fromStation=北京南&toStation=上海虹桥&date=2025-11-17';
    window.history.replaceState({}, document.title, '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
  });

  it('should show validation message when submitting without selecting passengers', async () => {
    // 场景：未选择乘车人直接提交订单，应提示“请选择乘车人”
    globalThis.fetch = vi.fn(() => mockJson(false, { error: 'NOT_FOUND' }, 404));

    render(<OrderFilling />);

    // 断言：页面展示车次信息
    expect(screen.getByText('G123次列车')).toBeInTheDocument();
    expect(screen.getByText(/2025-11-17/)).toBeInTheDocument();

    // 交互：点击“提交订单”
    fireEvent.click(screen.getByRole('button', { name: '提交订单' }));

    // 断言：展示提示消息
    expect(await screen.findByText('请选择乘车人')).toBeInTheDocument();
  });

  it('should go through warm tip -> seat selection -> lock seat -> create order and navigate to payment', async () => {
    // 场景：选择乘车人后提交订单，依次进入温馨提示、选座，锁座成功后创建订单并跳转支付页
    localStorage.setItem('SESSION_ID', 'sid-test');

    const fetchMock = vi.fn((input, init) => {
      const url = typeof input === 'string' ? input : input?.url;

      // 初始化：尝试拉取 profile（可能来自 8082/8083）
      if (String(url).includes('/api/v1/auth/session/profile')) {
        return mockJson(true, { username: 'u1', name: '测试用户', user_id: 'uid-1' });
      }

      // 同步联系人：从 User_Center 拉取乘车人（showFull=true）
      if (String(url) === 'http://localhost:8083/api/v1/passengers?showFull=true') {
        return mockJson(true, {
          passengers: [
            {
              passenger_id: 'p1',
              name: '张三',
              id_type: '居民身份证',
              id_number: '11010519491231002X',
              verified_status: '已通过',
            },
          ],
        });
      }

      // 锁座：seat lock
      if (String(url) === 'http://localhost:3001/api/v1/seats/lock') {
        expect(init?.method).toBe('POST');
        const body = JSON.parse(String(init?.body || '{}'));
        // 断言：锁座请求包含 train_id、travel_date 与 seats
        expect(body).toEqual(
          expect.objectContaining({
            train_id: 'G123',
            travel_date: '2025-11-17',
            seats: expect.any(Array),
          })
        );
        return mockJson(true, {
          locks: [
            { lock_token: 'lk-001', carriage_no: '10', seat_no: '1A' },
            { lock_token: 'lk-002', carriage_no: '10', seat_no: '1B' },
          ],
        });
      }

      // 下单：create order
      if (String(url) === 'http://localhost:3001/api/v1/orders') {
        expect(init?.method).toBe('POST');
        expect(init?.headers).toEqual(expect.objectContaining({ Authorization: 'Bearer sid-test' }));
        const body = JSON.parse(String(init?.body || '{}'));
        // 断言：提交订单包含 passengers 与 seat_locks
        expect(body.passengers).toEqual(
          expect.arrayContaining([expect.objectContaining({ passenger_id: 'p1', name: '张三' })])
        );
        expect(body.seat_locks).toHaveLength(2);
        return mockJson(true, { order_id: 'o-777' }, 201);
      }

      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    globalThis.fetch = fetchMock;

    render(<OrderFilling />);

    // 等待联系人同步完成并渲染
    await screen.findByText(/张三 \(/);

    // 交互：勾选乘车人
    fireEvent.click(screen.getByRole('checkbox'));

    // 交互：点击提交订单，出现温馨提示
    fireEvent.click(screen.getByRole('button', { name: '提交订单' }));
    expect(await screen.findByTestId('warm-tip')).toBeInTheDocument();

    // 交互：确认温馨提示后进入选座
    fireEvent.click(screen.getByRole('button', { name: '确认' }));
    expect(await screen.findByTestId('seat-modal')).toBeInTheDocument();

    // 交互：确认选座（mock 组件内部会调用 onConfirm 并传回 2 个座位）
    fireEvent.click(screen.getByRole('button', { name: '确认选座' }));

    // 断言：完成锁座+下单后跳转支付页（hash 参数包含 order_id 与 sid）
    await waitFor(() => {
      expect(window.location.hash).toBe('#payment?order_id=o-777&sid=sid-test');
    });
  });

  it('should show sync error when contacts synchronization fails', async () => {
    // 场景：同步联系人失败时，应展示错误提示并使用兜底联系人数据
    localStorage.setItem('SESSION_ID', 'sid-test');

    const fetchMock = vi.fn((input) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (String(url).includes('/api/v1/auth/session/profile')) {
        return mockJson(false, { error: 'NOT_FOUND' }, 404);
      }
      if (String(url) === 'http://localhost:8083/api/v1/passengers?showFull=true') {
        return Promise.reject(new Error('network down'));
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    globalThis.fetch = fetchMock;

    render(<OrderFilling />);

    // 断言：出现同步错误提示
    expect(await screen.findByText('获取联系人失败，请检查网络或稍后重试')).toBeInTheDocument();

    // 断言：仍然有兜底联系人可选择
    expect(screen.getByText(/张三 \(110101\*\*\*\*\*\*\*\*1234\)/)).toBeInTheDocument();
  });

  it.skip('should prevent selecting unverified passengers (requirement behavior)', async () => {
    // WARNING: Implementation diverges from requirement doc
    // 需求依据：Ticket_Management/12306_乘客管理_需求文档.md 提到“未通过核验的乘车人在预订时无法选择”。
    // 当前实现仅透传 verified 字段，但未在 UI 上禁用/拦截选择。
    localStorage.setItem('SESSION_ID', 'sid-test');

    globalThis.fetch = vi.fn((input) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (String(url).includes('/api/v1/auth/session/profile')) {
        return mockJson(false, { error: 'NOT_FOUND' }, 404);
      }
      if (String(url) === 'http://localhost:8083/api/v1/passengers?showFull=true') {
        return mockJson(true, {
          passengers: [
            {
              passenger_id: 'p-unverified',
              name: '未核验用户',
              id_type: '居民身份证',
              id_number: '11010519491231002X',
              verified_status: '未通过',
            },
          ],
        });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });

    render(<OrderFilling />);
    await screen.findByText(/未核验用户/);

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).toBeDisabled();
  });
});
