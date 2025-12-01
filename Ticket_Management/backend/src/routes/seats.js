const express = require('express');
const router = express.Router();

router.get('/map', (req, res) => {
  const { train_id, travel_date, seat_class } = req.query;
  const carriage_no = req.query.carriage_no || '10';
  const seats = [
    { seat_no: '16A', column: 'A', window: true, occupied: false },
    { seat_no: '16B', column: 'B', window: false, occupied: false },
    { seat_no: '16C', column: 'C', window: false, occupied: false },
    { seat_no: '16D', column: 'D', window: false, occupied: false },
    { seat_no: '16F', column: 'F', window: true, occupied: false },
  ];
  res.json({ train_id, travel_date, seat_class, carriage_no, seats });
});

router.post('/lock', (req, res) => {
  const { train_id, travel_date, seats } = req.body || {};
  const locks = (Array.isArray(seats) ? seats : []).map((s, i) => ({
    lock_token: `lk-${String(i + 1).padStart(3, '0')}`,
    expires_at: new Date(Date.now() + 2 * 60 * 1000).toISOString(),
    carriage_no: s.carriage_no || '10',
    seat_no: s.seat_no || '16A',
  }));
  res.json({ locks });
});

module.exports = router;