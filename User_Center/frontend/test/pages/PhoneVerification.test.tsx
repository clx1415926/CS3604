import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import PhoneVerification from '../../src/pages/PhoneVerification';

// Mock fetch
global.fetch = vi.fn((url) => {
  const urlString = String(url);
  if (urlString.includes('/auth/session/account')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
        phone_country_code: '+86',
        phone_masked: '138****7076',
        verified_status: 'VERIFIED'
      }),
    });
  }
  if (urlString.includes('/user/security/phone/change')) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({
         phone_number_masked: '139****9000',
         redirect_to: 'http://example.com'
      }),
    });
  }
  return Promise.reject('Unknown URL');
});

beforeEach(() => {
  localStorage.setItem('SESSION_ID', 'mock-sid');
  vi.clearAllMocks();
});

// @InterfaceID: UI-PhoneVerification
// @AcceptanceCriteria: #1
test('should show original masked phone and default +86 country code', async () => {
  render(<PhoneVerification />);
  // Wait for data to load
  await waitFor(() => {
      expect(screen.getByText((content) => content.includes('+86-138****7076'))).toBeInTheDocument();
  });
  expect(screen.getByText('已通过核验')).toBeInTheDocument();
  expect(screen.getByDisplayValue('+86')).toBeInTheDocument();
});

// @InterfaceID: UI-PhoneVerification
// @AcceptanceCriteria: #3
test('should show error and remain on page for wrong password', async () => {
    // Mock failure for this test
    const originalFetch = global.fetch;
    global.fetch = vi.fn((url) => {
        const urlString = String(url);
        if (urlString.includes('/auth/session/account')) {
            return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({
                phone_country_code: '+86',
                phone_masked: '138****7076',
                verified_status: 'VERIFIED'
            }),
            });
        }
        if (urlString.includes('/user/security/phone/change')) {
            return Promise.resolve({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ error: 'PASSWORD_INVALID' })
            });
        }
        return Promise.reject('Unknown URL');
    });

  render(<PhoneVerification />);
  await waitFor(() => screen.getByTestId('phone-input'));
  
  const phoneInput = screen.getByTestId('phone-input');
  const passwordInput = screen.getByTestId('password-input');

  fireEvent.change(phoneInput, { target: { value: '13900139000' } });
  fireEvent.change(passwordInput, { target: { value: 'wrong' } });
  fireEvent.click(screen.getByText('确认'));
  
  await waitFor(() => {
      expect(screen.getByText('密码错误，请重新输入')).toBeInTheDocument();
  });
  
  // Restore fetch
  global.fetch = originalFetch;
});

// @InterfaceID: UI-PhoneVerification
// @AcceptanceCriteria: #4
test('should return to personal info page on success and show masked new phone', async () => {
  render(<PhoneVerification />);
  await waitFor(() => screen.getByTestId('phone-input'));

  const phoneInput = screen.getByTestId('phone-input');
  const passwordInput = screen.getByTestId('password-input');

  fireEvent.change(phoneInput, { target: { value: '13900139000' } });
  fireEvent.change(passwordInput, { target: { value: 'CorrectPass1!' } });
  fireEvent.click(screen.getByText('确认'));
  
  await waitFor(() => {
      expect(screen.getByText('修改成功')).toBeInTheDocument();
  });
  // expect(screen.getByText(/139\*\*\*\*9000/)).toBeInTheDocument(); 
  // Note: The component updates currentMasked with API response.
  // API response mock returns '139****9000'.
  // Component sets currentMasked = '139****9000'.
  // It renders <span>{currentMasked}</span>.
  // So we should find '139****9000'.
  expect(screen.getByText('139****9000')).toBeInTheDocument();
});
