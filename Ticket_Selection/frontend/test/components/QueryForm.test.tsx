import React from 'react';
import { render, screen } from '@testing-library/react';
import QueryForm from '../../src/components/QueryForm';

// @InterfaceID: UI-QueryForm
// @AcceptanceCriteria: #1
test('should render all required form fields', () => {
  const mockOnQuery = jest.fn();
  render(<QueryForm onQuery={mockOnQuery} />);
  expect(screen.getByPlaceholderText('出发地')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('目的地')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '查询' })).toBeInTheDocument();
});