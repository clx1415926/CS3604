const request = require('supertest');
const { app } = require('../../src/app');

// @InterfaceID: API-POST-OrderCancel
// @AcceptanceCriteria: #3
test('should return proper limit exceeded message when canceling 4th order in a day', async () => {
  const sid = 'sid-u-limit';
  const makeOrder = async () => {
    return request(app)
      .post('/api/v1/orders')
      .set('Authorization', `Bearer ${sid}`)
      .send({ train_id: 'G8003', travel_date: '2025-11-17', from_station: '北京南', to_station: '上海虹桥', passengers: [{ name: '赵六' }], seat_locks: [{ lock_token: 'lk-001' }] });
  };
  const cancelOrder = async (orderId) => {
    return request(app)
      .post(`/api/v1/orders/${orderId}/cancel`)
      .set('Authorization', `Bearer ${sid}`)
      .send({});
  };

  for (let i = 0; i < 3; i++) {
    const created = await makeOrder();
    const oid = created.body.order_id || `o-00${i + 1}`;
    const canceled = await cancelOrder(oid);
    expect([200, 429]).toContain(canceled.status);
    if (canceled.status === 429) break;
  }

  const created4 = await makeOrder();
  const oid4 = created4.body.order_id || 'o-004';
  const canceled4 = await cancelOrder(oid4);
  expect(canceled4.status).toBe(429);
  // Expect detailed message per acceptance criteria
  expect(canceled4.body.message).toBe('您今日取消订单次数已达上限，无法继续购票');
});

