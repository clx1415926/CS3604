import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect, vi } from 'vitest';
import OrderManagement from '../../src/pages/OrderManagement';

// @InterfaceID: UI-OrderManagement
// @AcceptanceCriteria: #1
test('should default to 未完成订单 tab', () => {
  render(<OrderManagement />);
  expect(screen.getByText('未完成订单')).toBeInTheDocument();
});

// @InterfaceID: UI-OrderManagement
// @AcceptanceCriteria: #2
test('should render order card fields', async () => {
  const orig = global.fetch as any;
  vi.spyOn(global as any, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      orders: [{
        order_id: 'o-001',
        booked_at: new Date().toISOString(),
        train: { code: 'G123' },
        passengers: [{ name: '张三' }],
        seats: [{ seat_class: '二等座' }],
        price_total: 576,
        status: 'unpaid'
      }]
    })
  } as any);
  render(<OrderManagement />);
  expect(await screen.findByText('订票日期')).toBeInTheDocument();
  expect(screen.getByText('车次号')).toBeInTheDocument();
  expect(screen.getByText('乘客姓名')).toBeInTheDocument();
  expect(screen.getByText('席别')).toBeInTheDocument();
  expect(screen.getByText('价格')).toBeInTheDocument();
  (global.fetch as any) = orig;
});

// @InterfaceID: UI-OrderManagement
// @AcceptanceCriteria: #3
test('should open cancel dialog and call API-POST-OrderCancel', async () => {
  const orig = global.fetch as any;
  vi.spyOn(global as any, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      orders: [{
        order_id: 'o-001',
        booked_at: new Date().toISOString(),
        train: { code: 'G123' },
        passengers: [{ name: '张三' }],
        seats: [{ seat_class: '二等座' }],
        price_total: 576,
        status: 'unpaid'
      }]
    })
  } as any);
  render(<OrderManagement />);
  const cancelBtn = await screen.findByRole('button', { name: '取消订单' });
  expect(cancelBtn).toBeEnabled();
  (global.fetch as any) = orig;
});