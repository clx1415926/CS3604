/**
 * 测试范围：前端路由入口（src/index.tsx 内 Router）
 * - 页面跳转测试：hash 路由到订单填写/支付/订单管理
 * - 导航守卫测试：进入 #order-filling 时必须存在 sid（hash 或 localStorage）
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

describe('Feature: Hash Router (index.tsx)', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(console, 'log').mockImplementation(() => {});
    document.body.innerHTML = '<div id="root"></div>';
    localStorage.clear();
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
  });

  it('should redirect to loginRequired when entering order-filling without sid', async () => {
    // 场景：未携带 sid 且 localStorage 中无 SESSION_ID 时，进入订单填写页应被守卫重定向
    window.location.hash = '#order-filling?trainNo=G123';
    globalThis.fetch = vi.fn();

    await vi.resetModules();
    await import('../src/index');

    await waitFor(() => {
      expect(window.location.hash).toBe('#?loginRequired=1');
    });

    // 断言：订单管理页展示“未登录，无法预订”提示
    expect(await screen.findByText('未登录，无法预订')).toBeInTheDocument();
  });

  it('should allow entering order-filling when sid exists in localStorage', async () => {
    // 场景：localStorage 存在 SESSION_ID 时，允许进入订单填写页
    localStorage.setItem('SESSION_ID', 'sid-test');
    window.location.hash = '#order-filling?trainNo=G123';

    // 说明：OrderFilling 内部会尝试拉取 profile/contacts，这里统一 mock 成失败以避免网络依赖
    globalThis.fetch = vi.fn(() => Promise.reject(new Error('network disabled in test')));

    await vi.resetModules();
    await import('../src/index');

    expect(await screen.findByText('乘客信息')).toBeInTheDocument();
  });

  it('should render Payment page when hash starts with #payment', async () => {
    // 场景：hash 为 #payment 时，应渲染支付页面并展示订单号
    window.location.hash = '#payment?order_id=o-999';
    globalThis.fetch = vi.fn();

    await vi.resetModules();
    await import('../src/index');

    expect(await screen.findByText('订单支付')).toBeInTheDocument();
    expect(await screen.findByText('订单号：o-999')).toBeInTheDocument();
  });
});

