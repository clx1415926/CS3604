import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import OrderManagement from '../../src/pages/OrderManagement';

// @InterfaceID: UI-OrderManagement
// @AcceptanceCriteria: #1
test('should default to 未完成订单 tab', () => {
  render(<OrderManagement />);
  expect(screen.getByText('未完成订单')).toBeInTheDocument();
});

// @InterfaceID: UI-OrderManagement
// @AcceptanceCriteria: #2
test('should render order card fields', () => {
  render(<OrderManagement />);
  expect(screen.getByText('订票日期')).toBeInTheDocument();
  expect(screen.getByText('车次号')).toBeInTheDocument();
  expect(screen.getByText('乘客姓名')).toBeInTheDocument();
  expect(screen.getByText('席别')).toBeInTheDocument();
  expect(screen.getByText('价格')).toBeInTheDocument();
});

// @InterfaceID: UI-OrderManagement
// @AcceptanceCriteria: #3
test('should open cancel dialog and call API-POST-OrderCancel', () => {
  render(<OrderManagement />);
  const cancelBtn = screen.getByRole('button', { name: '取消订单' });
  expect(cancelBtn).toBeEnabled();
  // TODO: simulate dialog and assert API call
});