#!/usr/bin/env node
// 终端验证码发送/验证脚本
// 使用示例：
// 1) 发送短信验证码：
//    npm run send-code -- --channel sms --phone_country_code +86 --phone_number 13812345678
// 2) 发送邮件验证码：
//    npm run send-code -- --channel email --email test@example.com
// 3) 指定会话ID：
//    npm run send-code -- --session <uuid> --channel sms --phone_country_code +86 --phone_number 13812345678
// 4) 验证验证码（短信）：
//    npm run verify-code -- --channel sms --session <uuid> --code 123456
// 5) 验证验证码（邮件）：
//    npm run verify-code -- --channel email --session <uuid> --code 888888

const request = require('superagent');

const API_BASE = process.env.API_BASE || 'http://localhost:8080/api/v1';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { channel: 'sms', dev: true };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const next = args[i + 1];
    if (a === '--channel') opts.channel = next, i++;
    else if (a === '--phone_country_code') opts.phone_country_code = next, i++;
    else if (a === '--phone_number') opts.phone_number = next, i++;
    else if (a === '--email') opts.email = next, i++;
    else if (a === '--session') opts.session = next, i++;
    else if (a === '--verify') opts.verify = true;
    else if (a === '--code') opts.code = next, i++;
    else if (a === '--no-dev') opts.dev = false;
  }
  return opts;
}

async function createSessionIfNeeded(session) {
  if (session) return session;
  const res = await request.post(`${API_BASE}/registration/sessions`).send({});
  return res.body.session_id;
}

async function sendCode(session, opts) {
  if (opts.channel === 'email') {
    if (!opts.email) throw new Error('缺少参数 --email');
    let req = request.post(`${API_BASE}/registration/sessions/${session}/email/send`);
    if (opts.dev) req = req.set('x-dev-debug', '1');
    const res = await req.send({ email: opts.email });
    return res.body;
  }
  // sms
  if (!opts.phone_country_code || !opts.phone_number) throw new Error('缺少参数 --phone_country_code/--phone_number');
  let req = request.post(`${API_BASE}/registration/sessions/${session}/sms/send`);
  if (opts.dev) req = req.set('x-dev-debug', '1');
  const res = await req.send({ phone_country_code: opts.phone_country_code, phone_number: opts.phone_number });
  return res.body;
}

async function verifyCode(session, opts) {
  if (!opts.code) throw new Error('缺少参数 --code');
  if (opts.channel === 'email') {
    const res = await request.post(`${API_BASE}/registration/sessions/${session}/email/verify`).send({ code: opts.code });
    return res.body;
  }
  const res = await request.post(`${API_BASE}/registration/sessions/${session}/sms/verify`).send({ code: opts.code });
  return res.body;
}

async function main() {
  const opts = parseArgs();
  try {
    const session = await createSessionIfNeeded(opts.session);
    if (!opts.verify) {
      const payload = await sendCode(session, opts);
      console.log('状态: 成功');
      console.log('会话ID:', session);
      console.log('倒计时(秒):', payload.countdown_seconds ?? '60');
      console.log('有效期(分钟):', payload.ttl_minutes ?? '5');
      if (payload.dev_code) {
        console.log('验证码:', payload.dev_code);
      }
      process.exitCode = 0;
    } else {
      const payload = await verifyCode(session, opts);
      console.log('状态: 成功');
      console.log('会话ID:', session);
      console.log('验证结果:', payload.message || (payload.phone_verified ? '已验证' : '未验证'));
      process.exitCode = 0;
    }
  } catch (err) {
    const res = err.response;
    const body = (res && res.body) || {}; 
    console.error('状态: 失败');
    if (body.error) console.error('错误码:', body.error);
    console.error('原因:', body.message || err.message);
    process.exitCode = 1;
  }
}

main();