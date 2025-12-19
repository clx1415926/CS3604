let puppeteer = null;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  puppeteer = null;
}
const { app } = require('../../backend/src/server');

// 若本地未安装 puppeteer，则跳过 E2E 测试以保证单测可运行
const describeIf = puppeteer ? describe : describe.skip;

describeIf('Feature: Login page (E2E)', () => {
  jest.setTimeout(60000);

  let server;
  let baseUrl;
  let browser;
  let page;

  // 启动临时服务与浏览器会话，用于端到端交互测试
  beforeAll(async () => {
    server = app.listen(0);
    const addr = server.address();
    baseUrl = `http://127.0.0.1:${addr.port}`;
    process.env.HOME_URL = `${baseUrl}/login.html`;
    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
  });

  // 清理浏览器与服务资源
  afterAll(async () => {
    if (page) await page.close();
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  // 快乐路径：填写登录表单 -> 完成短信 2FA -> session_id 写入 sessionStorage
  test('should login with password and complete SMS 2FA', async () => {
    // 打开登录页，并将前端 API 指向临时端口
    const port = new URL(baseUrl).port;
    await page.goto(`${baseUrl}/login.html?api_port=${port}`, { waitUntil: 'domcontentloaded' });

    // 输入账号密码并提交
    await page.type('#identifier', '13812345678');
    await page.type('#password', 'Password123!');
    await page.click('#login-btn');

    // 2FA 弹窗应出现
    await page.waitForSelector('#sms-modal:not([hidden])', { timeout: 15000 });
    await page.type('#id-last4', '1234');
    await page.click('#id-verify');

    // 从页面中提取（开发模式展示的）验证码并完成校验
    await page.waitForSelector('#sms-step-code:not([hidden])', { timeout: 15000 });
    const status = await page.$eval('#sms-status-2', (el) => el.textContent || '');
    const m = status.match(/验证码：([0-9]{6})/);
    expect(m).not.toBeNull();
    const code = m[1];

    await page.type('#sms-code', code);
    await page.click('#sms-verify');

    // 登录成功后应在 sessionStorage 中持久化 session_id
    await page.waitForFunction(() => !!sessionStorage.getItem('session_id'), { timeout: 15000 });
    const sid = await page.evaluate(() => sessionStorage.getItem('session_id'));
    expect(typeof sid).toBe('string');
    expect(sid.length).toBeGreaterThan(5);
  });
});
