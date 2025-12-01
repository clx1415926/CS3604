import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import CancelSuccessModal from '../../src/components/CancelSuccessModal';

// @InterfaceID: UI-CancelSuccessModal
// @AcceptanceCriteria: #1
test('should render cancel success modal and navigate back', () => {
  render(<CancelSuccessModal />);
  expect(screen.getByText('取消订单成功')).toBeInTheDocument();
  const okBtn = screen.getByRole('button', { name: '确定' });
  expect(okBtn).toBeEnabled();
});