const request = require('supertest');
const app = require('../src/index');

// 车站查询接口：验证关键字为空/按名称过滤/按站点代码过滤
describe('Feature: Station query', () => {
  // 无 keyword 时，返回所有车站名称列表（数组）
  test('should return station name list without keyword', async () => {
    const res = await request(app).get('/api/stations').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body).toEqual(expect.arrayContaining(['北京', '上海']));
  });

  // keyword 命中站名时，返回包含匹配项的名称列表
  test('should filter stations by keyword matching name', async () => {
    const res = await request(app).get('/api/stations').query({ keyword: '上海' }).expect(200);

    expect(res.body).toEqual(expect.arrayContaining(['上海', '上海虹桥', '上海南']));
  });

  // keyword 命中站点代码时（不区分大小写），返回匹配站名
  test('should filter stations by keyword matching code (case-insensitive)', async () => {
    const res = await request(app).get('/api/stations').query({ keyword: 'aoh' }).expect(200);

    expect(res.body).toEqual(expect.arrayContaining(['上海虹桥']));
  });
});
