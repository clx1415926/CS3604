import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import PassengerEdit from '../../src/pages/PassengerEdit';

function mockJson(ok: boolean, body: any, status = ok ? 200 : 400) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  } as any);
}

describe('Feature: Passenger add/edit', () => {
  beforeEach(() => {
    // 准备：屏蔽页面内部调试日志，写入登录态，并初始化路由 hash
    vi.spyOn(console, 'log').mockImplementation(() => {});
    localStorage.setItem('SESSION_ID', 'sid-test');
    window.location.hash = '#/otn/view/passenger_edit.html';
  });

  afterEach(() => {
    // 清理：还原所有 mock，清空存储与路由
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
    window.location.hash = '';
  });

  it('should validate required fields on submit', async () => {
    // 场景：未填写必填项直接提交时，页面应提示表单错误且不发起请求
    (globalThis as any).fetch = vi.fn();
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    // 渲染：进入“添加乘车人”页面
    render(<PassengerEdit />);

    const user = userEvent.setup();

    // 交互：点击保存
    await user.click(screen.getByRole('button', { name: '保存' }));

    // 断言：出现统一错误提示与字段级错误，且不会调用后端接口
    expect(await screen.findByText('请修正表单中的错误')).toBeInTheDocument();
    expect(screen.getByText('请输入姓名')).toBeInTheDocument();
    expect(screen.getByText('请输入证件号码')).toBeInTheDocument();
    expect(screen.getByText('请输入手机号码')).toBeInTheDocument();
    expect((globalThis as any).fetch).not.toHaveBeenCalled();
  });

  it('should submit new passenger and redirect on success', async () => {
    // 场景：添加乘车人成功时，应调用 POST 接口并提示成功后跳转列表页
    const fetchMock = vi.fn((input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (url === 'http://localhost:8083/api/v1/passengers') {
        // 断言：请求方法/鉴权头/请求体符合“新增乘车人”契约
        expect(init?.method).toBe('POST');
        expect(init?.headers).toEqual(expect.objectContaining({ Authorization: 'Bearer sid-test' }));
        const payload = JSON.parse(String(init?.body || '{}'));
        expect(payload).toEqual({
          name: '张三',
          id_type: '居民身份证',
          id_number: '11010519491231002X',
          phone_country_code: '+86',
          phone_number: '13812345678',
          traveler_type: '学生',
        });
        return mockJson(true, { success: true, passenger_id: 'p1' });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    (globalThis as any).fetch = fetchMock;
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    // 渲染：进入“添加乘车人”页面
    render(<PassengerEdit />);
    const user = userEvent.setup();

    // 交互：填写姓名/证件/手机号并选择旅客类型，然后点击保存
    await user.type(screen.getByPlaceholderText('请输入姓名'), '张三');
    await user.type(screen.getByPlaceholderText('请输入证件号码'), '11010519491231002X');
    await user.type(screen.getByPlaceholderText('请输入手机号码'), '13812345678');
    await user.selectOptions(screen.getByDisplayValue('成人'), '学生');
    await user.click(screen.getByRole('button', { name: '保存' }));

    // 断言：提示“添加成功”，并跳转到乘车人列表
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('添加成功');
      expect(window.location.hash).toBe('#/otn/view/passengers.html');
    });
  });

  it('should load passenger in edit mode and omit masked phone in PATCH body', async () => {
    // 场景：编辑乘车人时，核心身份信息应只读；若手机号为脱敏值则不应回传
    window.location.hash = '#/otn/view/passenger_edit.html?id=p9&sid=sid-test';

    const fetchMock = vi.fn((input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (url === 'http://localhost:8083/api/v1/passengers/p9' && (!init?.method || init.method === 'GET')) {
        expect(init?.headers).toEqual(expect.objectContaining({ Authorization: 'Bearer sid-test' }));
        return mockJson(true, {
          passenger_id: 'p9',
          name: '李四',
          id_type: '居民身份证',
          id_number: '4301***********014',
          phone_country_code: '+86',
          phone_number: '138****7076',
          traveler_type: '成人',
        });
      }
      if (url === 'http://localhost:8083/api/v1/passengers/p9' && init?.method === 'PATCH') {
        const payload = JSON.parse(String(init?.body || '{}'));
        expect(payload).toEqual({
          phone_country_code: '+86',
          traveler_type: '学生',
        });
        return mockJson(true, { success: true });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    (globalThis as any).fetch = fetchMock;
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    // 渲染：进入“编辑乘车人”页面（从 hash 中解析 id）
    render(<PassengerEdit />);

    const user = userEvent.setup();

    // 断言：加载完成后姓名不可编辑，证件号输入框不再显示（只读展示）
    const nameInput = await screen.findByPlaceholderText('请输入姓名');
    expect(nameInput).toHaveValue('李四');
    expect(nameInput).toBeDisabled();
    expect(screen.queryByPlaceholderText('请输入证件号码')).toBeNull();

    // 交互：修改旅客类型并保存
    await user.selectOptions(screen.getByDisplayValue('成人'), '学生');
    await user.click(screen.getByRole('button', { name: '保存' }));

    // 断言：提示“修改成功”，并跳转到乘车人列表
    await waitFor(() => {
      expect(alertSpy).toHaveBeenCalledWith('修改成功');
      expect(window.location.hash).toBe('#/otn/view/passengers.html');
    });
  });

  it('should show timeout message when request aborts', async () => {
    // 场景：请求超过 10s 被 AbortController 中止时，应显示“请求超时”并恢复按钮可点击
    let timeoutCallback: (() => void) | undefined;
    const realSetTimeout = globalThis.setTimeout;
    const realClearTimeout = globalThis.clearTimeout;
    const setTimeoutSpy = vi
      .spyOn(globalThis, 'setTimeout')
      .mockImplementation(((cb: any, ms?: any, ...args: any[]) => {
        if (ms === 10000) {
          if (!timeoutCallback) timeoutCallback = cb;
          return 123 as any;
        }
        return realSetTimeout(cb, ms, ...args) as any;
      }) as any);
    vi.spyOn(globalThis, 'clearTimeout').mockImplementation(((id: any) => {
      if (id === 123) return;
      return realClearTimeout(id);
    }) as any);

    const fetchMock = vi.fn((input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (url !== 'http://localhost:8083/api/v1/passengers') {
        return mockJson(false, { error: 'NOT_FOUND' }, 404);
      }
      return new Promise((_, reject) => {
        const signal = init?.signal as AbortSignal | undefined;
        const onAbort = () => {
          const err: any = new Error('aborted');
          err.name = 'AbortError';
          reject(err);
        };
        if (signal?.aborted) onAbort();
        else if (signal) {
          const anySignal: any = signal as any;
          if (typeof anySignal.addEventListener === 'function') {
            anySignal.addEventListener('abort', onAbort, { once: true });
          } else {
            anySignal.onabort = onAbort;
          }
        }
      });
    });
    (globalThis as any).fetch = fetchMock;
    vi.spyOn(window, 'alert').mockImplementation(() => {});

    // 渲染：进入“添加乘车人”页面
    render(<PassengerEdit />);
    const user = userEvent.setup();

    // 交互：填写必填信息并点击保存
    await user.type(screen.getByPlaceholderText('请输入姓名'), '张三');
    await user.type(screen.getByPlaceholderText('请输入证件号码'), '11010519491231002X');
    await user.type(screen.getByPlaceholderText('请输入手机号码'), '13812345678');

    const saveBtn = screen.getByRole('button', { name: '保存' });
    const clickPromise = user.click(saveBtn);

    // 断言：提交后已设置 10s 超时定时器并发起请求
    await waitFor(() => {
      expect(setTimeoutSpy).toHaveBeenCalled();
      expect(fetchMock).toHaveBeenCalled();
      expect(timeoutCallback).toBeDefined();
    });

    // 触发：手动执行 10s 超时回调，模拟 controller.abort()
    timeoutCallback?.();
    await clickPromise;

    // 断言：页面提示超时错误，保存按钮恢复可用
    expect(await screen.findByText('请求超时，请检查网络状况')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '保存' })).not.toBeDisabled();
  });
});
