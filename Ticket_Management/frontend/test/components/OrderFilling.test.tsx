import React from 'react';
import { render, screen } from '@testing-library/react';
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