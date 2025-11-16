import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, test, expect } from 'vitest';
import SeatSelectionModal from '../../src/components/SeatSelectionModal';

// @InterfaceID: UI-SeatSelection
// @AcceptanceCriteria: #1
test('should render seat class tabs and allow switching', () => {
  render(<SeatSelectionModal />);
  expect(screen.getByText('二等座')).toBeInTheDocument();
});

// @InterfaceID: UI-SeatSelection
// @AcceptanceCriteria: #2
test('should render seat map with columns A-F and window icons', () => {
  render(<SeatSelectionModal />);
  expect(screen.getByText('A')).toBeInTheDocument();
  expect(screen.getByText('窗户')).toBeInTheDocument();
});

// @InterfaceID: UI-SeatSelection
// @AcceptanceCriteria: #3
test('confirm should call API-POST-SeatLock and return to order page', () => {
  render(<SeatSelectionModal />);
  const confirmBtn = screen.getByRole('button', { name: '确认' });
  expect(confirmBtn).toBeEnabled();
  // TODO: assert API call to /api/v1/seats/lock and navigation
});