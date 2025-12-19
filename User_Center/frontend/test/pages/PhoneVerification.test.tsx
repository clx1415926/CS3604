import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import PhoneVerification from '../../src/pages/PhoneVerification';

function mockJson(ok: boolean, body: any, status = ok ? 200 : 400) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  } as any);
}

describe('Feature: Phone verification', () => {
  beforeEach(() => {
    // 准备：屏蔽错误日志，初始化路由 hash
    vi.spyOn(console, 'error').mockImplementation(() => {});
    window.location.hash = '#/otn/view/userSecurity_bindTel.html';
  });

  afterEach(() => {
    // 清理：还原 mock，清空存储与路由
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
  });

  it('should block and redirect when user is not logged in', async () => {
    // 场景：未登录访问绑定手机页，应提示未登录并自动跳转到信息页
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    (globalThis as any).fetch = vi.fn();

    // 渲染：进入手机核验/绑定页面
    render(<PhoneVerification />);

    // 断言：页面展示未登录提示，同时写入 sessionStorage（用于跨页展示）
    expect(await screen.findByText('您还未登录，请先登录')).toBeInTheDocument();
    expect(sessionStorage.getItem('UC_ERROR_TEXT')).toBe('您还未登录，请先登录');
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 500);

    // 触发：手动执行 500ms 的跳转回调，验证 hash 变化
    const redirectCall = setTimeoutSpy.mock.calls.find((c) => c[1] === 500);
    const cb = redirectCall?.[0] as (() => void) | undefined;
    cb?.();
    expect(window.location.hash.endsWith('/otn/view/information.html')).toBe(true);
  });

  it('should submit change request and show success on happy path', async () => {
    // 场景：已登录用户提交新手机号与登录密码，应成功发起变更并提示“修改成功”
    const setTimeoutSpy = vi.spyOn(globalThis, 'setTimeout');
    localStorage.setItem('SESSION_ID', 'sid-test');

    const fetchMock = vi.fn((input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (String(url) === 'http://localhost:8080/api/v1/auth/session/account') {
        // 准备：返回当前绑定手机号（脱敏展示）
        return mockJson(true, {
          phone_country_code: '+86',
          phone_masked: '138****7076',
          verified_status: '已通过核验',
        });
      }
      if (String(url) === 'http://localhost:8083/api/v1/user/security/phone/change') {
        // 断言：变更手机号请求的 method/body 符合接口契约
        expect(init?.method).toBe('POST');
        const payload = JSON.parse(String(init?.body || '{}'));
        expect(payload).toEqual({
          phone_country_code: '+86',
          phone_number: '13812345678',
          login_password: 'pw',
          session_id: 'sid-test',
        });
        return mockJson(true, {
          success: true,
          phone_number_masked: '(+86) 138****5678',
          redirect_to: 'http://localhost:8082/login.html',
        });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    (globalThis as any).fetch = fetchMock;

    // 渲染：进入手机核验/绑定页面
    render(<PhoneVerification />);

    // 断言：展示当前绑定手机号（脱敏）
    expect(await screen.findByText('+86-138****7076')).toBeInTheDocument();

    const user = userEvent.setup();

    // 交互：填写新手机号与登录密码并提交
    await user.type(screen.getByTestId('phone-input'), '13812345678');
    await user.type(screen.getByTestId('password-input'), 'pw');
    await user.click(screen.getByRole('button', { name: '确认' }));

    // 断言：页面提示“修改成功”
    expect(await screen.findByText('修改成功')).toBeInTheDocument();

    // 断言：提交成功后会设置 800ms 的延迟跳转
    expect(setTimeoutSpy).toHaveBeenCalledWith(expect.any(Function), 800);
  });
});
