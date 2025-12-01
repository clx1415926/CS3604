import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi } from 'vitest';
import { describe, test, expect } from 'vitest';
import OrderFilling from '../../src/components/OrderFilling';

// @InterfaceID: UI-OrderFilling
// @AcceptanceCriteria: #1
test('should display selected train info on order filling page', () => {
  render(<OrderFilling />);
  expect(screen.getByText('G123')).toBeInTheDocument();
  expect(screen.getByText('北京南→上海虹桥')).toBeInTheDocument();
  expect(screen.getByText('出发时间')).toBeInTheDocument();
});

// @InterfaceID: UI-OrderFilling
// @AcceptanceCriteria: #2
test('should render contacts list with required fields', () => {
  render(<OrderFilling />);
  expect(screen.getByText('常用联系人')).toBeInTheDocument();
  expect(screen.getByText('证件类型')).toBeInTheDocument();
  expect(screen.getByText('证件号')).toBeInTheDocument();
});

// @InterfaceID: UI-OrderFilling
// @AcceptanceCriteria: #3
test('submit button should be disabled until passengers selected and seats locked', () => {
  render(<OrderFilling />);
  const submit = screen.getByRole('button', { name: '提交订单' });
  expect(submit).toBeDisabled();
});

// @InterfaceID: UI-OrderFilling
// @AcceptanceCriteria: #1
// @BugID: BUG-TRAIN-CODE-002
test('should render train info from query string - BUG-TRAIN-CODE-002 Regression', () => {
  const origHref = window.location.href;
  const url = new URL(origHref);
  url.search = '?trainNo=G456&fromStation=广州南&toStation=深圳北&date=2025-12-25';
  window.history.replaceState({}, '', url.toString());
  render(<OrderFilling />);
  expect(screen.getByText('G456')).toBeInTheDocument();
  expect(screen.getByText('广州南→深圳北')).toBeInTheDocument();
  window.history.replaceState({}, '', origHref);
});

// @InterfaceID: API-POST-OrderCreate
// @AcceptanceCriteria: #1
// @BugID: BUG-ORD-AUTH-001
test('should submit order successfully after login - BUG-ORD-AUTH-001 Regression', async () => {
  const origFetch = global.fetch;
  const mock = vi.fn((url: any, init: any) => {
    const u = String(url);
    if (u.includes('/api/v1/seats/lock')) {
      return Promise.resolve({ ok: true, json: async () => ({ locks: [{ lock_token: 'lk-001' }] }) });
    }
    if (u.includes('/api/v1/orders')) {
      return Promise.resolve({ status: 401, json: async () => ({ error: 'UNAUTHORIZED' }) });
    }
    if (u.includes('/api/v1/auth/session/profile')) {
      return Promise.resolve({ ok: false, json: async () => ({}) });
    }
    return Promise.resolve({ ok: true, json: async () => ({}) });
  });
  // @ts-ignore
  global.fetch = mock as any;

  window.localStorage.setItem('SESSION_ID', 'sid-u-xyz');
  render(<OrderFilling />);

  const seatBtn = screen.getByRole('button', { name: '选择座位' });
  fireEvent.click(seatBtn);
  const confirmBtn = await screen.findByRole('button', { name: '确认' });
  fireEvent.click(confirmBtn);

  const submitBtn = await screen.findByRole('button', { name: '提交订单' });
  fireEvent.click(submitBtn);

  expect(window.location.hash.startsWith('#payment')).toBe(true);

  // cleanup
  // @ts-ignore
  global.fetch = origFetch as any;
});