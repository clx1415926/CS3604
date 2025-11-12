#!/usr/bin/env node
// 找回密码（终端）验证码发送/验证脚本——复用现有服务端接口
// 使用示例：
// 1) 发送短信验证码：
//    npm run fp:phone:request -- --phone_number 13812345678 --id_type "居民身份证" --id_number 110101199001011234
// 2) 验证短信验证码：
//    npm run fp:phone:verify -- --phone_number 13812345678 --code 123456
// 3) 发送邮箱重置邮件：
//    npm run fp:email:request -- --email user@example.com --id_type "居民身份证" --id_number 110101199001011234
// 环境变量：
//    API_BASE=http://localhost:8080/api/v1  指定接口基础地址（默认使用 8080）

const request = require('superagent');

const API_BASE = process.env.API_BASE || 'http://localhost:8080/api/v1';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts = { flow: 'phone', action: 'request', dev: true };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    const next = args[i + 1];
    if (a === '--flow') opts.flow = next, i++;
    else if (a === '--action') opts.action = next, i++;
    else if (a === '--phone_number') opts.phone_number = next, i++;
    else if (a === '--id_type') opts.id_type = next, i++;
    else if (a === '--id_number') opts.id_number = next, i++;
    else if (a === '--email') opts.email = next, i++;
    else if (a === '--code') opts.code = next, i++;
    else if (a === '--no-dev') opts.dev = false;
  }
  return opts;
}

function assert(val, msg) {
  if (!val) throw new Error(msg);
}

async function sendPhoneCode(opts) {
  assert(opts.phone_number, '缺少参数 --phone_number');
  const id_type = opts.id_type || '居民身份证';
  const id_number = opts.id_number || '';
  assert(id_number, '缺少参数 --id_number');
  let req = request.post(`${API_BASE}/auth/password/phone/request`);
  if (opts.dev) req = req.set('x-dev-debug', '1');
  const res = await req.send({ phone_number: opts.phone_number, id_type, id_number });
  return res.body;
}

async function verifyPhoneCode(opts) {
  assert(opts.phone_number, '缺少参数 --phone_number');
  assert(opts.code, '缺少参数 --code');
  const res = await request
    .post(`${API_BASE}/auth/password/phone/verify`)
    .send({ phone_number: opts.phone_number, code: opts.code });
  return res.body;
}

async function sendEmailReset(opts) {
  assert(opts.email, '缺少参数 --email');
  const id_type = opts.id_type || '居民身份证';
  const id_number = opts.id_number || '';
  assert(id_number, '缺少参数 --id_number');
  let req = request.post(`${API_BASE}/auth/password/email/request`);
  if (opts.dev) req = req.set('x-dev-debug', '1');
  const res = await req.send({ email: opts.email, id_type, id_number });
  return res.body;
}

async function main() {
  const opts = parseArgs();
  try {
    if (opts.flow === 'email') {
      const payload = await sendEmailReset(opts);
      console.log('状态: 成功');
      console.log('渠道: 邮件');
      console.log('邮箱:', opts.email);
      console.log('结果:', payload.message || '重置邮件已发送');
      process.exitCode = 0;
      return;
    }

    if (opts.action === 'request') {
      const payload = await sendPhoneCode(opts);
      console.log('状态: 成功');
      console.log('渠道: 短信');
      console.log('手机号:', opts.phone_number);
      console.log('有效期(分钟):', payload.ttl_minutes ?? '5');
      if (opts.dev) {
        console.log('测试验证码: 123456');
      }
      process.exitCode = 0;
    } else if (opts.action === 'verify') {
      const payload = await verifyPhoneCode(opts);
      console.log('状态: 成功');
      console.log('渠道: 短信');
      console.log('手机号:', opts.phone_number);
      console.log('验证结果:', payload.reset_token ? '已验证，获得重置令牌' : (payload.message || '已验证'));
      if (payload.reset_token) {
        console.log('reset_token:', payload.reset_token);
      }
      process.exitCode = 0;
    } else {
      throw new Error('未知 action，支持 request 或 verify');
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