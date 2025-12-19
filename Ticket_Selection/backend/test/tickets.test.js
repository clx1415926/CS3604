const request = require('supertest');
const app = require('../src/index');

// 车票查询接口：验证必填参数校验、筛选（车次/席别/出发到达站）、排序等行为
describe('Feature: Ticket query and filtering', () => {
  // 缺少必填查询参数时，应该返回 400 并提示缺参
  test('should reject request when required params are missing', async () => {
    const res = await request(app).get('/api/tickets').expect(400);
    expect(res.body).toEqual({ error: 'Missing required query parameters' });
  });

  // 正常查询：返回 trains 数组与 stations（用于筛选面板候选项）
  test('should return trains for a valid query', async () => {
    // WARNING: Implementation diverges from requirement doc
    // The requirement/interface usually uses station codes (e.g., BJP/SHH),
    // but current implementation matches by station name substring.
    const res = await request(app)
      .get('/api/tickets')
      .query({ fromStation: '北京南', toStation: '上海虹桥', departDate: '2025-12-15' })
      .expect(200);

    expect(Array.isArray(res.body.trains)).toBe(true);
    expect(res.body.trains.map(t => t.trainNo)).toEqual(expect.arrayContaining(['G101', 'D313']));
    expect(Array.isArray(res.body.stations)).toBe(true);
    expect(res.body.stations).toEqual(expect.arrayContaining(['北京南站', '上海虹桥站']));
  });

  // trainTypes：按车次首字母过滤（例如只保留 G 高铁）
  test('should filter by trainTypes', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .query({ fromStation: '北京南', toStation: '上海虹桥', departDate: '2025-12-15', trainTypes: 'G' })
      .expect(200);

    expect(res.body.trains.map(t => t.trainNo)).toEqual(['G101']);
  });

  // seatTypes：要求列车座位列表中存在指定席别且有票
  test('should filter by seatTypes', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .query({ fromStation: '北京南', toStation: '上海虹桥', departDate: '2025-12-15', seatTypes: '商务座' })
      .expect(200);

    expect(res.body.trains.map(t => t.trainNo)).toEqual(['G101']);
  });

  // fromStations/toStations：对出发/到达站做精确筛选（配合 UI 勾选站点）
  test('should filter by fromStations/toStations exact station names', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .query({
        fromStation: '北京',
        toStation: '上海',
        departDate: '2025-12-15',
        fromStations: '北京西站',
        toStations: '上海站',
      })
      .expect(200);

    expect(res.body.trains.map(t => t.trainNo)).toEqual(['K511']);
  });

  // sortBy=depart_time：按出发时间升序排序
  test('should sort by depart_time', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .query({ fromStation: '南京南', toStation: '上海虹桥', departDate: '2025-12-15', sortBy: 'depart_time' })
      .expect(200);

    expect(res.body.trains.map(t => t.trainNo)).toEqual(['G7001', 'D5401']);
  });

  // sortBy=duration：按历时升序排序
  test('should sort by duration', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .query({ fromStation: '北京南', toStation: '上海虹桥', departDate: '2025-12-15', sortBy: 'duration' })
      .expect(200);

    expect(res.body.trains.map(t => t.trainNo)).toEqual(['G101', 'D313']);
  });

  // sortBy=arrival_time：按到达时间升序排序
  test('should sort by arrival_time', async () => {
    const res = await request(app)
      .get('/api/tickets')
      .query({ fromStation: '南京南', toStation: '上海虹桥', departDate: '2025-12-15', sortBy: 'arrival_time' })
      .expect(200);

    expect(res.body.trains.map(t => t.trainNo)).toEqual(['G7001', 'D5401']);
  });
});
