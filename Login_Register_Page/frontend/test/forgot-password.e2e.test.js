let puppeteer = null;
try {
  puppeteer = require('puppeteer');
} catch (e) {
  puppeteer = null;
}
const { app } = require('../../backend/src/server');

// 若本地未安装 puppeteer，则跳过 E2E 测试以保证单测可运行
const describeIf = puppeteer ? describe : describe.skip;

describeIf('Feature: Forgot password page (E2E)', () => {
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
    browser = await puppeteer.launch({ headless: 'new' });
    page = await browser.newPage();
  });

  // 清理浏览器与服务资源
  afterAll(async () => {
    if (page) await page.close();
    if (browser) await browser.close();
    if (server) await new Promise((resolve) => server.close(resolve));
  });

  // 前端校验：邮箱格式错误时应在调用接口前拦截
  test('should validate email format before sending request', async () => {
    await page.goto(`${baseUrl}/forgot-password.html`, { waitUntil: 'domcontentloaded' });

    // 切换到邮箱找回，输入非法邮箱并提交
    await page.click('#tab-email-btn');
    await page.type('#email', 'not-an-email');
    await page.click('#sendEmail');

    // 期望出现明确的提示信息
    await page.waitForFunction(() => {
      const el = document.getElementById('errorTip');
      return el && (el.textContent || '').includes('邮箱格式不正确');
    }, { timeout: 10000 });
  });

  // 维护模式：页面按钮应禁用，避免发起新请求
  test('should disable actions during simulated maintenance', async () => {
    await page.goto(`${baseUrl}/forgot-password.html`, { waitUntil: 'domcontentloaded' });

    // 开启维护模式并验证按钮禁用
    await page.evaluate(() => {
      if (typeof window.maintenance_on === 'function') window.maintenance_on();
    });

    const smsDisabled = await page.$eval('#sendSms', (el) => el.disabled);
    const emailDisabled = await page.$eval('#sendEmail', (el) => el.disabled);
    expect(smsDisabled).toBe(true);
    expect(emailDisabled).toBe(true);

    // 关闭维护模式并验证按钮恢复可用
    await page.evaluate(() => {
      if (typeof window.maintenance_off === 'function') window.maintenance_off();
    });

    const emailDisabledOff = await page.$eval('#sendEmail', (el) => el.disabled);
    expect(emailDisabledOff).toBe(false);
  });
});
