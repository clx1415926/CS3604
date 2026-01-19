let puppeteer = null;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  puppeteer = null;
}
const { app } = require('../../backend/src/server');

const describeIf = puppeteer ? describe : describe.skip;

describeIf('Feature: Register page required validation (E2E)', () => {
  jest.setTimeout(60000);

  let server;
  let baseUrl;
  let browser;
  let page;

  beforeAll(async () => {
    server = app.listen(0);
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
  });

  afterAll(async () => {
    if (page) await page.close();
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  test('should validate all required fields on submit', async () => {
    const port = new URL(baseUrl).port;
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(`${baseUrl}/register.html?api_port=${port}`, { waitUntil: 'domcontentloaded' });

    await page.click('#account-form button[type="submit"]');

    await page.waitForFunction(() => {
      const ids = ['username-error', 'password-error', 'confirm-error', 'name-error', 'id-error', 'phone-error', 'terms-error'];
      return ids.every((id) => {
        const el = document.getElementById(id);
        return el && (el.textContent || '').trim().length > 0;
      });
    }, { timeout: 10000 });

    const errors = await page.evaluate(() => {
      const get = (id) => ((document.getElementById(id) || {}).textContent || '').trim();
      return {
        username: get('username-error'),
        password: get('password-error'),
        confirm: get('confirm-error'),
        name: get('name-error'),
        id: get('id-error'),
        phone: get('phone-error'),
        terms: get('terms-error'),
      };
    });

    expect(errors.username).toBe('请填写用户名');
    expect(errors.password).toBe('请填写登录密码');
    expect(errors.confirm).toBe('请填写确认密码');
    expect(errors.name).toBe('请填写姓名');
    expect(errors.id).toBe('请填写证件号码');
    expect(errors.phone).toBe('请填写手机号码');
    expect(errors.terms).toBe('请确认服务条款');

    const invalidStates = await page.evaluate(() => {
      const byId = (id) => {
        const el = document.getElementById(id);
        return !!el && el.classList.contains('invalid');
      };
      return {
        username: byId('username'),
        password: byId('password'),
        confirm: byId('confirm_password'),
        name: byId('name'),
        id: byId('id_number'),
        phone: byId('phone_number'),
        terms: byId('terms'),
      };
    });

    expect(invalidStates.username).toBe(true);
    expect(invalidStates.password).toBe(true);
    expect(invalidStates.confirm).toBe(true);
    expect(invalidStates.name).toBe(true);
    expect(invalidStates.id).toBe(true);
    expect(invalidStates.phone).toBe(true);
    expect(invalidStates.terms).toBe(true);

    const borderColor = await page.$eval('#username', (el) => getComputedStyle(el).borderColor);
    expect(borderColor).toBe('rgb(255, 77, 79)');

    const lefts = await page.evaluate(() => {
      const rect = (id) => {
        const el = document.getElementById(id);
        if (!el) return null;
        const r = el.getBoundingClientRect();
        return { left: r.left, top: r.top };
      };
      return {
        username: rect('username-error'),
        phone: rect('phone-error'),
      };
    });
    expect(lefts.username).not.toBeNull();
    expect(lefts.phone).not.toBeNull();
    expect(Math.abs(lefts.username.left - lefts.phone.left)).toBeLessThanOrEqual(1);
  });

  test('should validate single field on blur and revalidate when cleared', async () => {
    const port = new URL(baseUrl).port;
    await page.goto(`${baseUrl}/register.html?api_port=${port}`, { waitUntil: 'domcontentloaded' });

    await page.focus('#username');
    await page.evaluate(() => document.getElementById('username').blur());
    await page.waitForFunction(() => (document.getElementById('username-error')?.textContent || '').includes('请填写用户名'), { timeout: 10000 });

    await page.type('#username', 'NewUser_123');
    await page.evaluate(() => document.getElementById('username').blur());
    await page.waitForFunction(() => (document.getElementById('username-error')?.textContent || '').trim() === '', { timeout: 10000 });

    await page.click('#username', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.evaluate(() => document.getElementById('username').blur());
    await page.waitForFunction(() => (document.getElementById('username-error')?.textContent || '').trim() === '请填写用户名', { timeout: 10000 });
  });

  test('should show required errors in mobile viewport too', async () => {
    const port = new URL(baseUrl).port;
    await page.setViewport({ width: 375, height: 667 });
    await page.goto(`${baseUrl}/register.html?api_port=${port}`, { waitUntil: 'domcontentloaded' });

    await page.click('#account-form button[type="submit"]');
    await page.waitForFunction(() => {
      const el = document.getElementById('password-error');
      return el && (el.textContent || '').trim() === '请填写登录密码';
    }, { timeout: 10000 });
  });
});
