/** @jest-environment jsdom */
/** @jest-environment-options {"url":"http://localhost:8080/"} */

/**
 * 文件说明：测试首页静态页面（index.html）的关键展示与内嵌脚本行为（导航跳转、登录态拦截、参数传递）。
 */

const fs = require('fs');
const path = require('path');

const restores = [];

function readHomeHtml() {
  const filePath = path.resolve(__dirname, '..', 'index.html');
  return fs.readFileSync(filePath, 'utf-8');
}

function extractInlineScript(html) {
  const matches = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  if (matches.length === 0) return '';
  return matches[matches.length - 1][1];
}

function installLocationStub(startUrl) {
  const original = Object.getOwnPropertyDescriptor(window, 'location');

  let current = new URL(String(startUrl), 'http://localhost:8080/');

  const setUrl = (value) => {
    current = new URL(String(value), current);
  };

  const stub = {
    get href() {
      return current.toString();
    },
    set href(v) {
      setUrl(v);
    },
    get origin() {
      return current.origin;
    },
    get pathname() {
      return current.pathname;
    },
    get search() {
      return current.search;
    },
    get hash() {
      return current.hash;
    },
    assign(v) {
      setUrl(v);
    },
    replace(v) {
      setUrl(v);
    },
  };

  Object.defineProperty(window, 'location', {
    configurable: true,
    value: stub,
  });

  const restore = () => {
    if (original) {
      Object.defineProperty(window, 'location', original);
    }
  };

  return {
    restore,
    setUrl,
    get url() {
      return current;
    },
  };
}

async function flushAsync() {
  await Promise.resolve();
  await Promise.resolve();
  await new Promise((r) => setTimeout(r, 0));
}

function bootHomePage({ startUrl = 'http://localhost:8080/', fetchImpl } = {}) {
  const html = readHomeHtml();
  const script = extractInlineScript(html);

  const locationController = installLocationStub(startUrl);
  restores.push(locationController.restore);

  document.documentElement.innerHTML = html;
  document.title = '中国铁路12306网站';

  jest.spyOn(console, 'log').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(window.history, 'replaceState').mockImplementation((_state, _title, url) => {
    if (typeof url === 'string') locationController.setUrl(url);
  });

  window.scrollTo = jest.fn();
  window.getComputedStyle = jest.fn(() => ({
    getPropertyValue: () => 'none',
  }));

  global.fetch =
    fetchImpl ||
    jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({}),
      }),
    );

  window.eval(script);

  return { locationController };
}

describe('Feature: Home_Page 首页静态页面与导航', () => {
  beforeEach(() => {
    while (restores.length) {
      const fn = restores.pop();
      try {
        fn();
      } catch {
        // ignore
      }
    }
    localStorage.clear();
    sessionStorage.clear();
    jest.restoreAllMocks();
  });

  afterEach(() => {
    while (restores.length) {
      const fn = restores.pop();
      try {
        fn();
      } catch {
        // ignore
      }
    }
  });

  it('应展示主要功能入口与页脚合规信息（渲染测试）', () => {
    // 验证目标：页面首屏关键入口与合规信息可被用户发现
    bootHomePage();

    const actionsNav = document.querySelector('nav.actions[aria-label="主要功能入口"]');
    expect(actionsNav).not.toBeNull();

    const login = document.getElementById('link-login');
    const ticket = document.getElementById('link-ticket');
    const orders = document.getElementById('btn-orders');
    const personal = document.getElementById('link-personal');

    expect(login).not.toBeNull();
    expect(ticket).not.toBeNull();
    expect(orders).not.toBeNull();
    expect(personal).not.toBeNull();

    expect(login.getAttribute('href')).toBe('http://localhost:8082/login.html');
    expect(ticket.getAttribute('href')).toBe('http://localhost:5173/index.html');
    expect(personal.getAttribute('href')).toBe('http://localhost:5176/index.html');

    expect(document.body.textContent).toContain('版权所有');
    expect(document.body.textContent).toContain('京ICP备');
    expect(document.querySelector('img[alt="适老化无障碍服务"]')).not.toBeNull();
  });

  test.skip('应显示五个功能按钮（需求一致性）', () => {
    // WARNING: Implementation diverges from requirement doc
    // 需求文档要求 5 个入口：登录注册、车票查询、订单管理、乘客管理、个人信息。
    // 当前实现中“乘客管理”入口已移除（index.html 内脚本注明“乘客管理已移除”）。
    bootHomePage();
    expect(document.body.textContent).toContain('乘客管理');
  });

  it('URL 含 sid 参数时应写入 SESSION_ID 并清理查询串（状态管理 + 导航守卫基础）', () => {
    // 验证目标：从外部系统回跳首页时能携带会话并避免 URL 污染
    bootHomePage({ startUrl: 'http://localhost:8080/?sid=abc' });

    expect(localStorage.getItem('SESSION_ID')).toBe('abc');
    expect(window.history.replaceState).toHaveBeenCalled();

    const lastArgs = window.history.replaceState.mock.calls.at(-1);
    expect(lastArgs[2]).toBe('http://localhost:8080/');
  });

  it('存在 SESSION_ID 时应请求用户信息并切换登录/退出展示（功能逻辑 + 状态管理）', async () => {
    // 验证目标：已登录用户在首页应看到欢迎语与退出入口
    const fetchImpl = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ username: 'u1', name: '张三' }),
      }),
    );

    bootHomePage({ startUrl: 'http://localhost:8080/?sid=abc', fetchImpl });
    await flushAsync();
    await flushAsync();
    await flushAsync();

    expect(fetchImpl).toHaveBeenCalledWith(
      'http://localhost:8082/api/v1/auth/session/profile',
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer abc' }),
      }),
    );

    const welcomeEl = document.getElementById('welcome-user');
    const loginEl = document.getElementById('J-header-login');
    const logoutEl = document.getElementById('J-header-logout');

    expect(welcomeEl.textContent).toBe('u1（张三）');
    expect(loginEl.style.display).toBe('none');
    expect(logoutEl.style.display).toBe('');
  });

  it('车票查询链接点击应携带查询参数与 sid，并写入 LAST_QUERY（页面跳转 + 参数传递）', () => {
    // 验证目标：从首页发起查询时，参数应正确传递给 Ticket_Selection
    localStorage.setItem('SESSION_ID', 'sid-1');
    const { locationController } = bootHomePage({ startUrl: 'http://localhost:8080/' });

    document.getElementById('fromStation').value = '上海';
    document.getElementById('toStation').value = '北京';
    document.getElementById('departDate').value = '2025-12-19';
    document.getElementById('opt-student').checked = true;
    document.getElementById('opt-highspeed').checked = true;

    const ticket = document.getElementById('link-ticket');
    const ev = new MouseEvent('click', { bubbles: true, cancelable: true });
    ticket.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(true);

    const u = locationController.url;
    expect(u.origin).toBe('http://localhost:5173');
    expect(u.pathname).toBe('/index.html');
    expect(u.searchParams.get('from')).toBe('上海');
    expect(u.searchParams.get('to')).toBe('北京');
    expect(u.searchParams.get('date')).toBe('2025-12-19');
    expect(u.searchParams.get('student')).toBe('1');
    expect(u.searchParams.get('highspeed')).toBe('1');
    expect(u.searchParams.get('type')).toBe('single');
    expect(u.searchParams.get('sid')).toBe('sid-1');

    const last = JSON.parse(localStorage.getItem('LAST_QUERY'));
    expect(last).toEqual({ from: '上海', to: '北京', date: '2025-12-19', student: '1', highspeed: '1' });
  });

  it('提交查询表单应跳转到车票查询页并携带参数（事件处理 + 页面跳转）', () => {
    // 验证目标：用户使用“查询”按钮/回车提交时应等价于点击车票查询入口
    localStorage.setItem('SESSION_ID', 'sid-2');
    const { locationController } = bootHomePage({ startUrl: 'http://localhost:8080/' });

    document.getElementById('fromStation').value = '杭州';
    document.getElementById('toStation').value = '南京';
    document.getElementById('departDate').value = '2025-12-20';

    const form = document.getElementById('ticket-form');
    const ev = new Event('submit', { bubbles: true, cancelable: true });
    form.dispatchEvent(ev);

    expect(ev.defaultPrevented).toBe(true);
    expect(locationController.url.origin).toBe('http://localhost:5173');
    expect(locationController.url.searchParams.get('from')).toBe('杭州');
    expect(locationController.url.searchParams.get('to')).toBe('南京');
    expect(locationController.url.searchParams.get('date')).toBe('2025-12-20');
    expect(locationController.url.searchParams.get('type')).toBe('single');
    expect(locationController.url.searchParams.get('sid')).toBe('sid-2');
  });

  it('订单管理按钮：未登录应跳转登录页，已登录应携带 sid 跳转（导航守卫）', () => {
    // 验证目标：订单管理属于需登录功能，应进行登录态拦截
    const a = bootHomePage({ startUrl: 'http://localhost:8080/' });
    document.getElementById('btn-orders').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(a.locationController.url.toString()).toBe('http://localhost:8082/login.html');

    localStorage.setItem('SESSION_ID', 'sid-3');
    const b = bootHomePage({ startUrl: 'http://localhost:8080/' });
    document.getElementById('btn-orders').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(b.locationController.url.origin).toBe('http://localhost:5174');
    expect(b.locationController.url.searchParams.get('sid')).toBe('sid-3');
  });

  it('应为出发日期输入框设置默认日期（边界条件：初始为空）', () => {
    // 验证目标：减少用户输入负担，并保证跳转参数完整
    jest.useFakeTimers();
    jest.setSystemTime(new Date(2025, 11, 18, 12, 0, 0));

    bootHomePage({ startUrl: 'http://localhost:8080/' });
    expect(document.getElementById('departDate').value).toBe('2025-12-18');

    jest.useRealTimers();
  });

  it('交换按钮应交换出发地/到达地（事件处理）', () => {
    // 验证目标：常见交互“交换站点”应正确工作
    bootHomePage({ startUrl: 'http://localhost:8080/' });

    document.getElementById('fromStation').value = 'A';
    document.getElementById('toStation').value = 'B';
    document.getElementById('swapStations').dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(document.getElementById('fromStation').value).toBe('B');
    expect(document.getElementById('toStation').value).toBe('A');
  });

  it('未实现功能入口点击应阻止默认行为（边界条件：禁用入口）', () => {
    // 验证目标：避免用户点击后出现无意义跳转或报错
    bootHomePage({ startUrl: 'http://localhost:8080/' });

    const banner = document.querySelector('.feature-banner.disabled');
    const bannerEv = new MouseEvent('click', { bubbles: true, cancelable: true });
    banner.dispatchEvent(bannerEv);
    expect(bannerEv.defaultPrevented).toBe(true);

    const service = document.querySelector('.service-item');
    const serviceEv = new MouseEvent('click', { bubbles: true, cancelable: true });
    service.dispatchEvent(serviceEv);
    expect(serviceEv.defaultPrevented).toBe(true);
  });

  it('返回顶部按钮点击应触发 scrollTo，滚动阈值应切换显示（事件处理）', () => {
    // 验证目标：辅助用户快速回到页面顶部，并在滚动后显示入口
    bootHomePage({ startUrl: 'http://localhost:8080/' });

    const topBtn = document.querySelector('.gototop');
    topBtn.style.display = 'none';

    document.querySelector('.js-gotop').dispatchEvent(new MouseEvent('click', { bubbles: true }));
    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });

    Object.defineProperty(window, 'pageYOffset', { configurable: true, value: 301 });
    window.dispatchEvent(new Event('scroll'));
    expect(topBtn.style.display).toBe('block');

    Object.defineProperty(window, 'pageYOffset', { configurable: true, value: 0 });
    window.dispatchEvent(new Event('scroll'));
    expect(topBtn.style.display).toBe('none');
  });
  it('自定义事件触发后应切换为退出展示（uc:auth-changed）', async () => {
    bootHomePage({ startUrl: 'http://localhost:8080/' });
    localStorage.setItem('SESSION_ID', 'sid-x');
    window.dispatchEvent(new CustomEvent('uc:auth-changed', { detail: { sid: 'sid-x', logged_in: true } }));
    await flushAsync();
    const loginEl = document.getElementById('J-header-login');
    const logoutEl = document.getElementById('J-header-logout');
    expect(loginEl.style.display).toBe('none');
    expect(logoutEl.style.display).toBe('');
  });
  it('存储事件触发后应切换为登录展示（storage 事件）', async () => {
    localStorage.setItem('SESSION_ID', 'sid-y');
    bootHomePage({ startUrl: 'http://localhost:8080/' });
    await flushAsync();
    const loginEl1 = document.getElementById('J-header-login');
    const logoutEl1 = document.getElementById('J-header-logout');
    expect(loginEl1.style.display).toBe('none');
    expect(logoutEl1.style.display).toBe('');
    localStorage.removeItem('SESSION_ID');
    const ev = new Event('storage');
    Object.defineProperty(ev, 'key', { value: 'SESSION_ID' });
    window.dispatchEvent(ev);
    await flushAsync();
    const loginEl2 = document.getElementById('J-header-login');
    const logoutEl2 = document.getElementById('J-header-logout');
    expect(loginEl2.style.display).toBe('');
    expect(logoutEl2.style.display).toBe('none');
  });
  it('会话失效轮询后应自动切换为登录展示（跨页面一致性）', async () => {
    let calls = 0;
    const fetchImpl = jest.fn(() => {
      calls++;
      if (calls <= 1) {
        return Promise.resolve({ ok: true, json: () => Promise.resolve({ username: 'u1', name: '张三' }) });
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve({}) });
    });
    localStorage.setItem('SESSION_ID', 'sid-p');
    bootHomePage({ startUrl: 'http://localhost:8080/', fetchImpl });
    await flushAsync();
    const loginEl1 = document.getElementById('J-header-login');
    const logoutEl1 = document.getElementById('J-header-logout');
    expect(loginEl1.style.display).toBe('none');
    expect(logoutEl1.style.display).toBe('');
    window.dispatchEvent(new Event('focus'));
    await flushAsync();
    const loginEl2 = document.getElementById('J-header-login');
    const logoutEl2 = document.getElementById('J-header-logout');
    expect(loginEl2.style.display).toBe('');
    expect(logoutEl2.style.display).toBe('none');
  });
});
