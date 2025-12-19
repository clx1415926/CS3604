/**
 * 文件说明：测试首页站点信息接口（/api/site/metadata）的返回结构与关键字段。
 */

const request = require('supertest');
const { app } = require('../src/app');

describe('Feature: 首页站点信息接口', () => {
  it('GET /api/site/metadata 应返回站点元数据（Happy Path）', async () => {
    // 验证目标：接口可访问、返回 200，并包含首页展示所需的核心字段
    const res = await request(app).get('/api/site/metadata');

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);

    expect(res.body).toEqual(
      expect.objectContaining({
        logoText: expect.any(String),
        welcomeText: expect.any(String),
        serviceHours: expect.any(String),
        officialSafetyTip: expect.any(String),
        friendLinks: expect.any(Array),
        compliance: expect.any(Object),
        accessibility: expect.any(Object),
      }),
    );
  });

  it('GET /api/site/metadata 应返回可用的友情链接结构（Edge Case）', async () => {
    // 验证目标：friendLinks 结构稳定，包含 name/url 且 url 形如 http(s)
    const res = await request(app).get('/api/site/metadata');

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.friendLinks)).toBe(true);

    for (const link of res.body.friendLinks) {
      expect(link).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          url: expect.stringMatching(/^https?:\/\//),
        }),
      );
    }
  });
});

