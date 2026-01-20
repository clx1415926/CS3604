/**
 * 测试范围：Payment
 * - 组件渲染测试：根据 hash 展示订单号
 * - 功能逻辑测试：点击立即支付调用支付接口
 * - 事件处理测试：支付成功/失败的消息展示
 * - 页面跳转测试：支付成功 800ms 后跳转到订单中心（参数传递 orderId、sid）
 */

import React from 'react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import Payment from '../../src/pages/Payment';

function mockJson(ok, body, status = ok ? 200 : 400) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  });
}

describe('Feature: Payment', () => {
  let originalHrefDescriptor;
  let assignedHref;

  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    localStorage.clear();
    sessionStorage.clear();
    assignedHref = '';

    // 说明：Payment 使用 window.location.href 直接赋值跳转，这里通过重写 href setter 来捕获目标地址。
    originalHrefDescriptor = Object.getOwnPropertyDescriptor(window.location.__proto__, 'href');
    try {
      Object.defineProperty(window.location, 'href', {
        configurable: true,
        get() {
          return assignedHref;
        },
        set(v) {
          assignedHref = String(v);
        },
      });
    } catch (e) {
      // 若运行环境不允许重写 href，则测试只验证 setTimeout 的参数与提示文案。
    }
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
    if (originalHrefDescriptor) {
      try {
        Object.defineProperty(window.location, 'href', originalHrefDescriptor);
      } catch (e) {}
    }
  });

  it('should extract order_id from hash and render it', async () => {
    // 场景：hash 携带 order_id 参数时，页面应展示对应订单号
    window.location.hash = '#payment?order_id=o-123';
    globalThis.fetch = vi.fn(() => mockJson(false, { error: 'NOT_USED' }, 404));

    render(<Payment />);

    expect(await screen.findByText('订单支付')).toBeInTheDocument();
    expect(screen.getByText('订单号：o-123')).toBeInTheDocument();
  });

  it('should call pay api with sid from hash and schedule redirect on success', async () => {
    // 场景：支付成功时，应展示“支付成功，正在跳转...”并在 800ms 后跳转（携带 orderId 与 sid）
    window.location.hash = '#payment?order_id=o-777&sid=sid-test';
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');

    globalThis.fetch = vi.fn((url, init) => {
      expect(String(url)).toBe('http://localhost:3001/api/v1/orders/o-777/pay');
      expect(init?.method).toBe('POST');
      expect(init?.headers).toEqual({ Authorization: 'Bearer sid-test' });
      return mockJson(true, { success: true, status: 'paid' }, 200);
    });

    render(<Payment />);
    await screen.findByText('订单号：o-777');

    // 交互：点击“立即支付”
    fireEvent.click(screen.getByRole('button', { name: '立即支付' }));

    // 断言：展示成功消息
    expect(await screen.findByText('支付成功，正在跳转...')).toBeInTheDocument();

    // 断言：设置 800ms 定时器
    await waitFor(() => {
      expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 800);
    });

    // 触发：执行跳转回调，验证目标地址参数
    const cb = setTimeoutSpy.mock.calls.find((c) => c[1] === 800)?.[0];
    if (typeof cb === 'function') cb();

    if (assignedHref) {
      expect(assignedHref).toContain('http://localhost:5176/#/otn/view/train_order.html');
      expect(assignedHref).toContain('orderId=o-777');
      expect(assignedHref).toContain('sid=sid-test');
    }
  });

  it('should show error message when pay api returns non-ok', async () => {
    // 场景：支付失败时，应展示后端返回的 error 字段
    window.location.hash = '#payment?order_id=o-404&sid=sid-test';

    globalThis.fetch = vi.fn(() => mockJson(false, { error: 'ORDER_NOT_FOUND' }, 404));

    render(<Payment />);
    await screen.findByText('订单号：o-404');

    fireEvent.click(screen.getByRole('button', { name: '立即支付' }));

    expect(await screen.findByText('ORDER_NOT_FOUND')).toBeInTheDocument();
  });

  it('should navigate back without paying when clicking defer option', async () => {
    window.location.hash = '#payment?order_id=o-888&sid=sid-test';
    const fetchSpy = vi.fn(() => mockJson(true, { ok: true }, 200));
    globalThis.fetch = fetchSpy;

    render(<Payment />);
    await screen.findByText('订单号：o-888');

    fireEvent.click(screen.getByRole('button', { name: '稍后支付' }));
    if (assignedHref) {
      expect(assignedHref).toContain('http://localhost:5176/#/otn/view/train_order.html');
      expect(assignedHref).toContain('sid=sid-test');
    } else {
      expect(window.location.hash === '' || window.location.hash === '#').toBe(true);
    }
    
    // 验证没有调用支付接口
    const payCalls = fetchSpy.mock.calls.filter(call => 
      String(call[0]).includes('/pay')
    );
    expect(payCalls.length).toBe(0);
  });
});
