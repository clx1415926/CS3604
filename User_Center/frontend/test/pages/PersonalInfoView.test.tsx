import React from 'react';
import { render, screen } from '@testing-library/react';
import PersonalInfoView from '../../src/pages/PersonalInfoView';

// @InterfaceID: UI-PersonalInfoView
// @AcceptanceCriteria: #1
test('should render three information sections: basic, contact, additional', () => {
  render(<PersonalInfoView />);
  expect(screen.getByText('基本信息')).toBeInTheDocument();
  expect(screen.getByText('联系方式')).toBeInTheDocument();
  expect(screen.getByText('附加信息')).toBeInTheDocument();
});

// @InterfaceID: UI-PersonalInfoView
// @AcceptanceCriteria: #2
test('should show basic info as read-only without edit controls', () => {
  render(<PersonalInfoView />);
  const basicSection = screen.getByText('基本信息');
  expect(basicSection).toBeInTheDocument();
  expect(screen.queryByText('编辑')).not.toBeInTheDocument();
});

// @InterfaceID: UI-PersonalInfoView
// @AcceptanceCriteria: #3
test('should show contact info masked and with Edit button', () => {
  render(<PersonalInfoView />);
  expect(screen.getByText('(+86) 138****7076')).toBeInTheDocument();
  expect(screen.getByText('24******78@qq.com')).toBeInTheDocument();
  expect(screen.getByText('编辑')).toBeInTheDocument();
});
