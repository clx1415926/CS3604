import React from 'react';
import { render, screen } from '@testing-library/react';
import { test, expect } from 'vitest';
import OrderManagement from '../../src/pages/OrderManagement';

test('should display login warning when loginRequired param is present', () => {
  // Mock window.location.hash
  window.location.hash = '#?loginRequired=1';
  
  render(<OrderManagement />);
  
  expect(screen.getByText('未登录，无法预订')).toBeInTheDocument();
});
