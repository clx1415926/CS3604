import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import Payment from '../../src/pages/Payment';

// @InterfaceID: UI-PaymentPage
// @AcceptanceCriteria: #1
test('should show payment amount and multiple payment options', () => {
  window.location.hash = '#payment?order_id=o-001';
  render(<Payment />);
  expect(screen.getByText('金额：¥576.00')).toBeInTheDocument();
  expect(screen.getByText('支付方式')).toBeInTheDocument();
  expect(screen.getByText('支付宝')).toBeInTheDocument();
  expect(screen.getByText('微信')).toBeInTheDocument();
  expect(screen.getByText('银联')).toBeInTheDocument();
});

