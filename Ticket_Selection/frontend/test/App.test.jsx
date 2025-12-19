import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import App from '../src/App';
import * as fs from 'fs';
import * as path from 'path';

function makeJsonResponse(body) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
  };
}

// 应用集成：验证挂载后加载站点、根据 URL 参数自动查询并渲染车次列表
describe('Feature: Ticket selection app', () => {
  // 每个用例重置 localStorage/URL，确保由 URL 参数触发自动查询逻辑
  beforeEach(() => {
    jest.restoreAllMocks();
    localStorage.clear();
    window.history.pushState({}, '', '/?from=%E5%8C%97%E4%BA%AC&to=%E4%B8%8A%E6%B5%B7&date=2025-12-15');
    window.location.hash = '';
  });

  // 页面挂载：先请求 stations，再请求 tickets（含基础站点计算），最终渲染车次行
  test('should fetch stations on mount and query tickets after submit', async () => {
    const trains = [
      {
        date: '2025-12-15',
        trainNo: 'K511',
        fromStation: '北京西站',
        toStation: '上海站',
        departTime: '19:15',
        arriveTime: '14:45',
        duration: '19小时30分',
        seats: [{ type: '硬座', count: '有', price: 156 }],
        startingPrice: 156,
      },
    ];

    global.fetch = jest.fn(async (url) => {
      const u = String(url);
      if (u.includes('/api/stations')) {
        return makeJsonResponse(['北京', '上海', '南京', '广州']);
      }
      if (u.includes('/api/tickets')) {
        return makeJsonResponse({ trains, stations: ['北京西站', '上海站'] });
      }
      return makeJsonResponse({});
    });
    const fetchMock = global.fetch;

    render(<App />);

    await waitFor(() => {
      expect(fetchMock.mock.calls.length).toBeGreaterThanOrEqual(3);
    });

    const urls = fetchMock.mock.calls.map(c => String(c[0]));
    expect(urls.some(u => u.includes('http://localhost:3000/api/stations'))).toBe(true);
    expect(urls.some(u => u.includes('http://localhost:3000/api/tickets'))).toBe(true);

    // 由于筛选面板也会渲染站点文本，这里限定在 K511 这一行内断言站点信息
    await waitFor(() => {
      const row = screen.getByText('K511').closest('tr');
      expect(row).not.toBeNull();
      expect(within(row).getByText('北京西站')).toBeInTheDocument();
      expect(within(row).getByText('上海站')).toBeInTheDocument();
    });
  });
});

// 静态页面跳转：验证首页 HTML 中跨子系统入口的链接配置
describe('Feature: Navigation links (index.html)', () => {
  // 验证“首页”跳转入口（Logo 与导航栏）指向 Home_Page
  test('should expose home page links', () => {
    const indexHtmlPath = path.resolve(__dirname, '..', 'index.html');
    const html = fs.readFileSync(indexHtmlPath, 'utf-8');
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const logoAnchor = doc.querySelector('.header .logo a');
    expect(logoAnchor).not.toBeNull();
    expect(logoAnchor.getAttribute('href')).toBe('http://localhost:8080/');

    const navHomeAnchor = doc.querySelector('.nav-box .nav .nav-item.active .nav-hd');
    expect(navHomeAnchor).not.toBeNull();
    expect(navHomeAnchor.textContent).toContain('首页');
    expect(navHomeAnchor.getAttribute('href')).toBe('http://localhost:8080/');
  });

  // 验证头部“我的12306 / 登录 / 注册”链接指向对应子系统入口
  test('should expose my12306/login/register entry links', () => {
    const indexHtmlPath = path.resolve(__dirname, '..', 'index.html');
    const html = fs.readFileSync(indexHtmlPath, 'utf-8');
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const my12306 = doc.getElementById('my12306');
    expect(my12306).not.toBeNull();
    expect(my12306.getAttribute('href')).toBe('http://localhost:5176/index.html');

    const login = doc.getElementById('J-btn-login');
    expect(login).not.toBeNull();
    expect(login.getAttribute('href')).toBe('http://localhost:8082/login.html');

    const register = doc.querySelector('#J-header-login a.ml');
    expect(register).not.toBeNull();
    expect(register.getAttribute('href')).toBe('http://localhost:8082/register.html');
  });

  // 验证“我的12306”下拉菜单中的关键入口项存在且携带 data-href（供脚本拼接 hash 路由）
  test('should expose my12306 dropdown items for key pages', () => {
    const indexHtmlPath = path.resolve(__dirname, '..', 'index.html');
    const html = fs.readFileSync(indexHtmlPath, 'utf-8');
    const doc = new DOMParser().parseFromString(html, 'text/html');

    const order = doc.querySelector('a[name="g_href"][data-href="view/train_order.html"]');
    const passengers = doc.querySelector('a[name="g_href"][data-href="view/passengers.html"]');
    const info = doc.querySelector('a[name="g_href"][data-href="view/information.html"]');
    expect(order).not.toBeNull();
    expect(passengers).not.toBeNull();
    expect(info).not.toBeNull();
  });
});
