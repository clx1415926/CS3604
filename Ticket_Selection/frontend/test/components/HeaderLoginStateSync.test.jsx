import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import Header from '../../src/components/Header.jsx';

describe('Feature: Header login state consistency across ports', () => {
  test('should switch to login view after session invalidation polling', async () => {
    let calls = 0;
    global.fetch = jest.fn(() => {
      calls++;
      if (calls <= 1) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ username: 'u1', name: '张三' }) });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    });

    localStorage.setItem('SESSION_ID', 'sid-abc');
    global.window.getComputedStyle = jest.fn(() => ({ getPropertyValue: () => 'none' }));
    render(<Header />);

    await Promise.resolve();
    await Promise.resolve();
    await new Promise((r) => setTimeout(r, 0));

    const loginEl1 = document.getElementById('J-header-login');
    const logoutEl1 = document.getElementById('J-header-logout');
    expect(loginEl1).toBeInTheDocument();
    expect(logoutEl1).toBeInTheDocument();
    await waitFor(() => {
      expect(loginEl1.style.display).toBe('none');
      expect(logoutEl1.style.display).toBe('');
    });

    await act(async () => {
      window.dispatchEvent(new Event('focus'));
      await Promise.resolve();
    });

    const loginEl2 = document.getElementById('J-header-login');
    const logoutEl2 = document.getElementById('J-header-logout');
    expect(loginEl2.style.display).toBe('');
    expect(logoutEl2.style.display).toBe('none');

    jest.useRealTimers();
  });
});
