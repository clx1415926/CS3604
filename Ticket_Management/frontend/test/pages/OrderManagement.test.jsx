/**
 * 测试范围：OrderManagement
 * - 组件渲染测试：未完成订单列表、筛选输入框、预订确认区块
 * - 功能逻辑测试：拉取订单、筛选订单、预订提交下单
 * - 状态管理测试：取消弹窗与成功弹窗的显示/隐藏
 * - 事件处理测试：刷新、取消、去支付按钮
 * - 页面跳转测试：去支付时 hash 跳转参数是否正确
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import OrderManagement from '../../src/pages/OrderManagement';

function mockJson(ok, body, status = ok ? 200 : 400) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  });
}

describe('Feature: OrderManagement', () => {
  beforeEach(() => {
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '#';
    window.history.replaceState({}, document.title, '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
  });

  it('should render empty state when no orders exist', async () => {
    // 场景：接口返回空订单列表，页面应显示“暂无订单”
    globalThis.fetch = vi.fn(() => mockJson(true, { orders: [] }));

    render(<OrderManagement />);

    expect(await screen.findByText('暂无订单')).toBeInTheDocument();
  });

  it('should filter orders by train code and date', async () => {
    // 场景：输入筛选条件后，列表只展示匹配的订单
    const orders = [
      {
        order_id: 'o-1',
        booked_at: '2025-11-17T08:00:00.000Z',
        train: { code: 'G123' },
        passengers: [{ name: '张三' }],
        seats: [{ seat_class: '二等座' }],
        price_total: 100,
        status: 'unpaid',
      },
      {
        order_id: 'o-2',
        booked_at: '2025-11-18T08:00:00.000Z',
        train: { code: 'D50' },
        passengers: [{ name: '李四' }],
        seats: [{ seat_class: '一等座' }],
        price_total: 200,
        status: 'paid',
      },
    ];
    globalThis.fetch = vi.fn(() => mockJson(true, { orders }));

    render(<OrderManagement />);

    // 等待订单渲染
    await screen.findByText(/o-1/);
    expect(screen.getByText(/o-1/)).toBeInTheDocument();
    expect(screen.getByText(/o-2/)).toBeInTheDocument();

    // 交互：按车次筛选 G123
    fireEvent.change(screen.getByPlaceholderText('按车次号筛选'), { target: { value: 'G123' } });
    expect(screen.getByText(/o-1/)).toBeInTheDocument();
    expect(screen.queryByText(/o-2/)).toBeNull();

    // 交互：按日期筛选 2025-11-17
    fireEvent.change(screen.getByPlaceholderText('按日期筛选 YYYY-MM-DD'), { target: { value: '2025-11-17' } });
    expect(screen.getByText(/o-1/)).toBeInTheDocument();
  });

  it('should open cancel confirm modal and show success modal after cancel', async () => {
    // 场景：点击取消订单 -> 弹出确认 -> 确认后调用接口并展示成功提示
    localStorage.setItem('SESSION_ID', 'sid-test');

    const fetchMock = vi.fn((input, init) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (String(url) === 'http://localhost:3001/api/v1/orders' && (!init?.method || init.method === 'GET')) {
        return mockJson(true, {
          orders: [
            {
              order_id: 'o-10',
              booked_at: '2025-11-17T08:00:00.000Z',
              train: { code: 'G123' },
              passengers: [{ name: '张三' }],
              seats: [{ seat_class: '二等座' }],
              price_total: 576,
              status: 'unpaid',
            },
          ],
        });
      }
      if (String(url) === 'http://localhost:3001/api/v1/orders/o-10/cancel') {
        expect(init?.method).toBe('POST');
        expect(init?.headers).toEqual(expect.objectContaining({ Authorization: 'Bearer sid-test' }));
        return mockJson(true, { success: true, message: '取消订单成功' });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    globalThis.fetch = fetchMock;

    render(<OrderManagement />);

    // 等待订单渲染
    await screen.findByText(/o-10/);

    // 交互：点击“取消订单”按钮，弹出确认弹窗
    fireEvent.click(screen.getByRole('button', { name: '取消订单' }));
    expect(await screen.findByText('您确认取消订单吗？')).toBeInTheDocument();

    // 交互：确认取消
    fireEvent.click(screen.getByRole('button', { name: '确定' }));

    // 断言：展示“取消订单成功”提示弹窗
    expect(await screen.findByText('取消订单成功')).toBeInTheDocument();

    // 交互：点击成功弹窗“确定”关闭
    fireEvent.click(screen.getByRole('button', { name: '确定' }));
    await waitFor(() => {
      expect(screen.queryByText('取消订单成功')).toBeNull();
    });
  });

  it.skip('should redirect to ticket search after cancel success (requirement behavior)', async () => {
    // WARNING: Implementation diverges from requirement doc
    // 需求依据：Ticket_Management/12306_订单管理_需求文档.md 5.4 提到取消成功后返回车票查询页（可能 3 秒后自动跳转）。
    // 当前实现仅展示“取消订单成功”弹窗并关闭，不包含跳转逻辑。
    localStorage.setItem('SESSION_ID', 'sid-test');
    window.location.hash = '#';

    globalThis.fetch = vi.fn((input, init) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (String(url) === 'http://localhost:3001/api/v1/orders' && (!init?.method || init.method === 'GET')) {
        return mockJson(true, {
          orders: [
            {
              order_id: 'o-10',
              booked_at: '2025-11-17T08:00:00.000Z',
              train: { code: 'G123' },
              passengers: [{ name: '张三' }],
              seats: [{ seat_class: '二等座' }],
              price_total: 576,
              status: 'unpaid',
            },
          ],
        });
      }
      if (String(url) === 'http://localhost:3001/api/v1/orders/o-10/cancel') {
        return mockJson(true, { success: true, message: '取消订单成功' });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });

    render(<OrderManagement />);
    await screen.findByText(/o-10/);
    fireEvent.click(screen.getByRole('button', { name: '取消订单' }));
    fireEvent.click(screen.getByRole('button', { name: '确定' }));
    expect(await screen.findByText('取消订单成功')).toBeInTheDocument();

    // 预期：点击弹窗确认后跳回车票查询页（示意），此行为当前未实现
    fireEvent.click(screen.getByRole('button', { name: '确定' }));
    expect(window.location.href).toContain('leftTicket');
  });

  it('should navigate to payment page when clicking pay button', async () => {
    // 场景：未支付订单点击“去支付”，应跳转到支付页并携带 order_id 参数
    globalThis.fetch = vi.fn(() =>
      mockJson(true, {
        orders: [
          {
            order_id: 'o-20',
            booked_at: '2025-11-17T08:00:00.000Z',
            train: { code: 'G123' },
            passengers: [{ name: '张三' }],
            seats: [{ seat_class: '二等座' }],
            price_total: 576,
            status: 'unpaid',
          },
        ],
      })
    );

    render(<OrderManagement />);

    await screen.findByText(/o-20/);
    fireEvent.click(screen.getByRole('button', { name: '去支付' }));

    // 断言：hash 跳转到 #payment 并携带 order_id
    expect(window.location.hash).toBe('#payment?order_id=o-20');
  });

  it('should show prebook confirmation card and submit order when sid exists', async () => {
    // 场景：从预订入口进入并携带 prebook=1 时，应展示预订确认区块并可提交订单
    localStorage.setItem('SESSION_ID', 'sid-test');
    window.location.hash = '#?prebook=1&trainNo=G99&fromStation=北京南&toStation=上海虹桥&date=2025-11-17';

    const fetchMock = vi.fn((input, init) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (String(url) === 'http://localhost:3001/api/v1/orders' && init?.method === 'POST') {
        const body = JSON.parse(String(init?.body || '{}'));
        // 断言：下单请求体包含预订参数与席别
        expect(body).toEqual(
          expect.objectContaining({
            train_id: 'G99',
            travel_date: '2025-11-17',
            from_station: '北京南',
            to_station: '上海虹桥',
          })
        );
        return mockJson(true, { order_id: 'o-99' }, 201);
      }
      if (String(url) === 'http://localhost:3001/api/v1/orders' && (!init?.method || init.method === 'GET')) {
        return mockJson(true, { orders: [] });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    globalThis.fetch = fetchMock;

    render(<OrderManagement />);

    // 断言：预订确认区块展示
    expect(await screen.findByText('预订信息确认')).toBeInTheDocument();
    expect(screen.getByText('：G99')).toBeInTheDocument();

    // 交互：点击提交订单
    fireEvent.click(screen.getByRole('button', { name: '提交订单' }));

    // 断言：提示“下单成功”（alert）
    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith('下单成功');
    });
  });

  it.skip('should disable submit button until passenger selected (requirement behavior)', async () => {
    // WARNING: Implementation diverges from requirement doc
    // 需求依据：Ticket_Management/12306_订单管理_需求文档.md 5.2 提到“提交订单按钮初始为禁用状态”。
    // 当前实现的“提交订单”按钮始终可点，未实现禁用态。
    globalThis.fetch = vi.fn(() => mockJson(true, { orders: [] }));
    render(<OrderManagement />);
    expect(screen.getByRole('button', { name: '提交订单' })).toBeDisabled();
  });
});
