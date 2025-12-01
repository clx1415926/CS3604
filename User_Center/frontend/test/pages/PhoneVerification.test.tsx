import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PhoneVerification from '../../src/pages/PhoneVerification';

// @InterfaceID: UI-PhoneVerification
// @AcceptanceCriteria: #1
test('should show original masked phone and default +86 country code', () => {
  render(<PhoneVerification />);
  expect(screen.getByText('+86-138****7076 已通过核验')).toBeInTheDocument();
  expect(screen.getByDisplayValue('+86')).toBeInTheDocument();
});

// @InterfaceID: UI-PhoneVerification
// @AcceptanceCriteria: #3
test('should show error and remain on page for wrong password', () => {
  render(<PhoneVerification />);
  fireEvent.change(screen.getByPlaceholderText('请输入新手机号'), { target: { value: '13900139000' } });
  fireEvent.change(screen.getByPlaceholderText('请输入密码'), { target: { value: 'wrong' } });
  fireEvent.click(screen.getByText('确认'));
  expect(screen.getByText('密码错误，请重新输入')).toBeInTheDocument();
});

// @InterfaceID: UI-PhoneVerification
// @AcceptanceCriteria: #4
test('should return to personal info page on success and show masked new phone', () => {
  render(<PhoneVerification />);
  fireEvent.change(screen.getByPlaceholderText('请输入新手机号'), { target: { value: '13900139000' } });
  fireEvent.change(screen.getByPlaceholderText('请输入密码'), { target: { value: 'CorrectPass1!' } });
  fireEvent.click(screen.getByText('确认'));
  expect(screen.getByText('修改成功')).toBeInTheDocument();
  expect(screen.getByText('(+86) 139****9000')).toBeInTheDocument();
});
