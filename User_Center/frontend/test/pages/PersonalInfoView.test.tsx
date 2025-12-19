import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import PersonalInfoView from '../../src/pages/PersonalInfoView';

function mockJson(ok: boolean, body: any, status = ok ? 200 : 400) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  } as any);
}

describe('Feature: Personal information view', () => {
  beforeEach(() => {
    vi.spyOn(console, 'log').mockImplementation(() => {});
    localStorage.setItem('SESSION_ID', 'sid-test');
    (window as any).API_BASE = 'http://127.0.0.1:8082/api/v1';
  });

  afterEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    delete (window as any).API_BASE;
  });

  it('should allow changing traveler type and return to view mode', async () => {
    const fetchMock = vi.fn((input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (String(url).endsWith('/auth/session/account')) {
        return mockJson(true, {
          username: ' TEST111',
          name: '张三',
          id_type: '居民身份证',
          id_number_masked: '3101***********113',
          country: '中国China',
          phone_country_code: '+86',
          phone_masked: '138****0000',
          email_masked: '24******78@qq.com',
          traveler_type: '成人',
          verified_status: 'VERIFIED',
        });
      }
      if (url === 'http://localhost:8083/api/v1/user/profile/traveler-type') {
        expect(init?.method).toBe('PATCH');
        const payload = JSON.parse(String(init?.body || '{}'));
        expect(payload.traveler_type).toBe('学生');
        expect(payload.session_id).toBe('sid-test');
        return mockJson(true, { success: true, traveler_type: '学生' });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    (globalThis as any).fetch = fetchMock;

    render(<PersonalInfoView />);

    const additionalTitle = await screen.findByText('附加信息');
    const additionalSection = additionalTitle.closest('.info-section') as HTMLElement;

    await waitFor(() => {
      expect(within(additionalSection).getByText('成人')).toBeInTheDocument();
    });

    const user = userEvent.setup();
    await user.click(within(additionalSection).getByRole('button', { name: '编辑' }));
    await user.selectOptions(within(additionalSection).getByRole('combobox'), '学生');
    await user.click(within(additionalSection).getByRole('button', { name: '保存' }));

    await waitFor(() => {
      expect(within(additionalSection).queryByRole('combobox')).toBeNull();
      expect(within(additionalSection).getByText('学生')).toBeInTheDocument();
      expect(within(additionalSection).getByRole('button', { name: '编辑' })).toBeInTheDocument();
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'http://localhost:8083/api/v1/user/profile/traveler-type',
      expect.objectContaining({ method: 'PATCH' })
    );
  });
});
