import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import PassengerList from '../../src/pages/PassengerList';

function mockJson(ok: boolean, body: any, status = ok ? 200 : 400) {
  return Promise.resolve({
    ok,
    status,
    json: async () => body,
  } as any);
}

describe('Feature: Passenger list batch delete', () => {
  beforeEach(() => {
    // 准备：写入登录态，屏蔽 alert，避免测试输出干扰
    localStorage.setItem('SESSION_ID', 'sid-test');
    vi.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    // 清理：还原 mock，清空存储
    vi.restoreAllMocks();
    localStorage.clear();
    sessionStorage.clear();
  });

  it('should require selecting passengers before batch delete', async () => {
    // 场景：未选择任何乘车人时点击“批量删除”，应提示先选择
    const fetchMock = vi.fn((input: any) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (url === 'http://localhost:8083/api/v1/passengers') {
        // 准备：初始列表为空
        return mockJson(true, { passengers: [] });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    (globalThis as any).fetch = fetchMock;
    const alertSpy = vi.spyOn(window, 'alert');
    vi.spyOn(window, 'confirm').mockReturnValue(true);

    // 渲染：进入乘车人列表页
    render(<PassengerList />);

    const user = userEvent.setup();

    // 交互：直接点击“批量删除”
    await user.click(await screen.findByRole('button', { name: '批量删除' }));

    // 断言：弹出提示“请选择要删除的乘车人”
    expect(alertSpy).toHaveBeenCalledWith('请选择要删除的乘车人');
  });

  it('should delete all selected passengers after confirmation', async () => {
    // 场景：选择多位乘车人并确认后，应逐个调用 DELETE 接口删除（不包含本人）
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const fetchMock = vi.fn((input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url;
      if (url === 'http://localhost:8083/api/v1/passengers' && (!init?.method || init.method === 'GET')) {
        return mockJson(true, {
          passengers: [
            {
              passenger_id: 'p1',
              name: '张三',
              id_type: '居民身份证',
              id_number: '11010519491231002X',
              phone_country_code: '+86',
              phone_number: '13812345678',
              traveler_type: '成人',
              verified_status: '已通过',
              is_self: false,
            },
            {
              passenger_id: 'p2',
              name: '王五',
              id_type: '居民身份证',
              id_number: '11010519491231002X',
              phone_country_code: '+86',
              phone_number: '13912345678',
              traveler_type: '成人',
              verified_status: '待核验',
              is_self: false,
            },
            {
              passenger_id: 'self',
              name: '本人',
              id_type: '居民身份证',
              id_number: '11010519491231002X',
              phone_country_code: '+86',
              phone_number: '13800000000',
              traveler_type: '成人',
              verified_status: '已通过',
              is_self: true,
            },
          ],
        });
      }
      if (String(url).startsWith('http://localhost:8083/api/v1/passengers/') && init?.method === 'DELETE') {
        expect(init?.headers).toEqual(expect.objectContaining({ Authorization: 'Bearer sid-test' }));
        return mockJson(true, { success: true });
      }
      return mockJson(false, { error: 'NOT_FOUND' }, 404);
    });
    (globalThis as any).fetch = fetchMock;

    // 渲染：进入乘车人列表页并等待数据加载
    render(<PassengerList />);
    const user = userEvent.setup();

    await screen.findByText('张三');

    // 断言：列表中仅渲染可选的两位乘车人（本人不提供勾选）
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(2);

    // 交互：勾选两位乘车人并点击“批量删除”
    await user.click(checkboxes[0]);
    await user.click(checkboxes[1]);
    await user.click(screen.getByRole('button', { name: '批量删除' }));

    // 断言：弹窗文本包含选中人数
    expect(confirmSpy).toHaveBeenCalledWith('确认删除选中的 2 位乘车人吗？');

    // 断言：对每个被选中的乘车人各发起一次 DELETE 请求
    await waitFor(() => {
      const deletes = fetchMock.mock.calls.filter((c) => String(c[0]).startsWith('http://localhost:8083/api/v1/passengers/') && c[1]?.method === 'DELETE');
      expect(deletes.map((c) => String(c[0]))).toEqual(
        expect.arrayContaining([
          'http://localhost:8083/api/v1/passengers/p1',
          'http://localhost:8083/api/v1/passengers/p2',
        ])
      );
    });
  });
});
