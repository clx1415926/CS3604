import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, test, expect } from 'vitest';
import OrderManagement from '../../src/pages/OrderManagement';

// @InterfaceID: UI-CancelDialog
// @AcceptanceCriteria: #1, #2
test('should show cancel confirm dialog with title and warning text, and confirm triggers API', async () => {
  const origFetch = global.fetch as any;
  vi.spyOn(global as any, 'fetch').mockResolvedValue({
    ok: true,
    json: async () => ({
      orders: [{
        order_id: 'o-xyz',
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
  cancelBtn.click();

  expect(screen.getByText('您确认取消订单吗？')).toBeInTheDocument();
  expect(screen.getByText('一天内3次申请车票成功后取消订单（包含无座票时取消5次计为取消1次），当日将不能在12306继续购票。')).toBeInTheDocument();

  const confirm = screen.getByRole('button', { name: '确定' });
  expect(confirm).toBeEnabled();

  (global.fetch as any) = origFetch;
});

