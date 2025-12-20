import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import SharedHeader from '../../src/shared/Header/Header';

function mockJson(ok: boolean, body: any, status = ok ? 200 : 400) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  } as any);
}

describe('SharedHeader logout', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '#/otn/view/information.html?sid=sid-test&x=1';
    localStorage.setItem('SESSION_ID', 'sid-test');
    sessionStorage.setItem('session_id', 'sid-test');
    localStorage.setItem('UC_NICK', 'TEST111');
    localStorage.setItem('UC_AUTH_BASE', 'http://127.0.0.1:8082/api/v1');
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
  });

  it('should clear sid from url and storage after logout', async () => {
    const fetchMock = vi.fn((input: any) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (String(url).includes('/auth/session/profile')) {
        return mockJson(true, { username: 'TEST111', name: '张三' });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    (globalThis as any).fetch = fetchMock;

    render(<SharedHeader />);

    await screen.findByText('退出');

    const user = userEvent.setup();
    await user.click(screen.getByText('退出'));

    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    });

    expect(sessionStorage.getItem('UC_LOGOUT_SID')).toBe('sid-test');

    expect(localStorage.getItem('SESSION_ID')).toBeNull();
    expect(sessionStorage.getItem('session_id')).toBeNull();
    expect(localStorage.getItem('UC_NICK')).toBeNull();
    expect(sessionStorage.getItem('UC_NICK')).toBeNull();
    expect(localStorage.getItem('UC_AUTH_BASE')).toBeNull();

    expect(window.location.hash.includes('sid=')).toBe(false);
    expect(localStorage.getItem('SESSION_ID')).toBeNull();
  });

  it('should ignore old sid reappearing in url after logout', async () => {
    const fetchMock = vi.fn((input: any) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (String(url).includes('/auth/session/profile')) {
        return mockJson(true, { username: 'TEST111', name: '张三' });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    (globalThis as any).fetch = fetchMock;

    render(<SharedHeader />);
    await screen.findByText('退出');

    const user = userEvent.setup();
    await user.click(screen.getByText('退出'));

    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    });

    window.location.hash = '#/otn/view/passengers.html?sid=sid-test&x=1';
    await act(async () => {
      window.dispatchEvent(new CustomEvent('uc:auth-changed'));
    });

    await waitFor(() => {
      expect(screen.getByText('登录')).toBeInTheDocument();
    });

    expect(localStorage.getItem('SESSION_ID')).toBeNull();
    expect(sessionStorage.getItem('session_id')).toBeNull();
  });
});
