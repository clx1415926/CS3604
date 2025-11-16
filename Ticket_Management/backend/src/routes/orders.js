const express = require('express');
const router = express.Router();
let cancelStats = { date: null, count: 0 };

router.post('/', (req, res) => {
  const { train_id, travel_date, from_station, to_station, passengers, seat_locks } = req.body || {};
  if (!train_id || !travel_date || !from_station || !to_station || !Array.isArray(passengers) || passengers.length === 0) {
    return res.status(400).json({ error: 'NO_SEATS_AVAILABLE' });
  }
  if (!Array.isArray(seat_locks) || seat_locks.length === 0) {
    return res.status(400).json({ error: 'NO_SEATS_AVAILABLE' });
  }
  const order_id = 'o-001';
  const price_total = 576.0;
  res.status(201).json({ order_id, status: 'unpaid', price_total });
});

router.get('/', (req, res) => {
  const orders = [
    {
      order_id: 'o-001',
      booked_at: new Date().toISOString(),
      train: { code: 'G123', from: '北京南', to: '上海虹桥', depart_time: '08:00', arrive_time: '13:36' },
      passengers: [{ name: '张三' }],
      seats: [{ seat_class: '二等座', carriage_no: '10', seat_no: '16A' }],
      price_total: 576.0,
      status: 'unpaid',
    },
  ];
  res.json({ orders });
});

router.get('/:order_id', (req, res) => {
  const { order_id } = req.params;
  if (order_id !== 'o-001') {
    return res.status(404).json({ error: 'ORDER_NOT_FOUND' });
  }
  const order = {
    order_id,
    booked_at: new Date().toISOString(),
    train: { code: 'G123', from: '北京南', to: '上海虹桥', depart_time: '08:00', arrive_time: '13:36' },
    passengers: [{ name: '张三', id_type: '居民身份证', masked_id_number: '110101********1234' }],
    seats: [{ seat_class: '二等座', carriage_no: '10', seat_no: '16A' }],
    price_total: 576.0,
    status: 'unpaid',
  };
  res.json({ order });
});

router.post('/:order_id/cancel', (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  if (cancelStats.date !== today) {
    cancelStats = { date: today, count: 0 };
  }
  if (cancelStats.count >= 3) {
    return res.status(429).json({ error: 'CANCEL_RATE_LIMIT_EXCEEDED' });
  }
  cancelStats.count += 1;
  res.json({ success: true, message: '取消订单成功' });
});

module.exports = router;