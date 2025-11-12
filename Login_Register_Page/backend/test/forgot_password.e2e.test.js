/**
 * 12306 前端交互端到端测试：忘记密码页面
 * 使用 Puppeteer 驱动浏览器，联调后端 API。
 */
const puppeteer = require('puppeteer');
const { app } = require('../src/server');

let server;
let baseUrl;
let browser;
let page;

beforeAll(async () => {
  server = await new Promise(resolve => {
    const s = app.listen(0, () => resolve(s));
  });
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
  browser = await puppeteer.launch({ headless: true });
  page = await browser.newPage();
});

afterAll(async () => {
  try { if (browser) await browser.close(); } catch {}
  try { if (server) await server.close(); } catch {}
});

async function gotoForgot() {
  await page.goto(`${baseUrl}/forgot-password.html`, { waitUntil: 'networkidle0' });
}

function getText(selector) {
  return page.$eval(selector, el => el.textContent.trim());
}

function isDisabled(selector) {
  return page.$eval(selector, el => !!el.disabled);
}

describe('忘记密码页面 - 手机/邮箱/人脸找回', () => {
  test('手机找回：发送验证码 -> 验证 -> 设置新密码成功', async () => {
    await gotoForgot();

    await page.type('#phone', '13812345678');
    await page.type('#idNumber', '110101199001011234');
    // 新流程：先提交账户信息，进入步骤2
    await page.click('#submitAccount');
    await page.click('#sendSms');
    // 倒计时展示
    const cd = await getText('#smsCountdown');
    expect(cd).toContain('(');

    await page.type('#smsCode', '123456');
    await page.click('#verifySms');
    // 显示新密码表单
    await page.waitForSelector('#newPasswordForm:not(.hidden)', { timeout: 5000 });

    await page.type('#newPassword', 'abc_1234');
    await page.click('#submitNewPassword');
    // 成功提示
    await page.waitForFunction(() => document.querySelector('#successTip').textContent.includes('密码已重置'));
    const ok = await getText('#successTip');
    expect(ok).toContain('密码已重置');
  });

  test('手机找回：验证码错误提示', async () => {
    await gotoForgot();
    // 使用不同手机号，避免与上一用例的速率限制冲突
    await page.type('#phone', '13912345678');
    await page.type('#idNumber', '110101199001011234');
    // 新流程：先提交账户信息，进入步骤2
    await page.click('#submitAccount');
    await page.click('#sendSms');
    await page.type('#smsCode', '000000');
    await page.click('#verifySms');
    await page.waitForFunction(() => document.querySelector('#errorTip').textContent.includes('验证码错误'));
    const err = await getText('#errorTip');
    expect(err).toContain('验证码错误');
  });

  test('邮箱找回：发送邮件成功与格式错误提示', async () => {
    await gotoForgot();
    // 切换到邮箱Tab
    await page.click('#tab-email-btn');
    // 错误格式
    await page.type('#email', 'abc');
    await page.click('#sendEmail');
    await page.waitForFunction(() => document.querySelector('#errorTip').textContent.includes('邮箱格式不正确'));
    const err1 = await getText('#errorTip');
    expect(err1).toContain('邮箱格式不正确');

    // 正确格式
    // 跨平台清空输入框：三击选中后回退
    await page.click('#email', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('#email', 'user@example.com');
    // 选择证件类型与填写证件号码
    await page.select('#emailIdType', '居民身份证');
    await page.type('#emailIdNumber', '110101199001011234');
    await page.click('#sendEmail');
    await page.waitForFunction(() => document.querySelector('#emailSentTip').textContent.includes('邮件已发送'));
    const sent = await getText('#emailSentTip');
    expect(sent).toContain('邮件已发送');
  });

  test('人脸识别找回：二维码生成 -> 模拟扫码 -> 模拟确认 -> 设置新密码成功', async () => {
    await gotoForgot();
    await page.click('#tab-face-btn');
    await page.waitForSelector('#qrcode[src^="data:image/png;base64,"]', { timeout: 5000 });
    const status0 = await getText('#qrStatus');
    expect(status0).toBe('未扫码');

    await page.click('#face-mock-scan');
    await page.waitForFunction(() => document.querySelector('#qrStatus').textContent === '已扫码');
    const status1 = await getText('#qrStatus');
    expect(status1).toBe('已扫码');

    await page.click('#face-mock-confirm');
    await page.waitForSelector('#newPasswordForm:not(.hidden)', { timeout: 5000 });
    await page.type('#newPassword', 'abc_1234');
    await page.click('#submitNewPassword');
    await page.waitForFunction(() => document.querySelector('#successTip').textContent.includes('密码已重置'));
    const ok = await getText('#successTip');
    expect(ok).toContain('密码已重置');
  });

  test('人脸识别找回：模拟过期状态', async () => {
    await gotoForgot();
    await page.click('#tab-face-btn');
    await page.waitForSelector('#qrcode[src^="data:image/png;base64,"]', { timeout: 5000 });
    await page.click('#face-mock-expire');
    await page.waitForFunction(() => document.querySelector('#qrStatus').textContent.includes('过期'));
    const status = await getText('#qrStatus');
    expect(status).toContain('过期');
  });

  test('维护窗口：禁用发送入口并提示', async () => {
    await gotoForgot();
    await page.evaluate(() => window.maintenance_on());
    const tipVisible = await page.$eval('#maintenanceTip', el => !el.classList.contains('hidden'));
    expect(tipVisible).toBe(true);
    const smsDisabled = await isDisabled('#sendSms');
    const emailDisabled = await isDisabled('#sendEmail');
    expect(smsDisabled).toBe(true);
    expect(emailDisabled).toBe(true);
    await page.evaluate(() => window.maintenance_off());
  });
});