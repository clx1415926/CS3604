import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { test, expect } from 'vitest';
import OrderFilling from '../../src/components/OrderFilling';

// @InterfaceID: UI-WarmTipModal
// @AcceptanceCriteria: #1
test('should show 温馨提示 modal when selecting passenger and close on confirm', async () => {
  render(<OrderFilling />);
  const selectPassenger = screen.queryByRole('checkbox', { name: '选择乘车人' });
  if (selectPassenger) fireEvent.click(selectPassenger);
  expect(await screen.findByText('温馨提示')).toBeInTheDocument();
  const confirmBtn = await screen.findByRole('button', { name: '确认' });
  fireEvent.click(confirmBtn);
  expect(screen.queryByText('温馨提示')).not.toBeInTheDocument();
});

