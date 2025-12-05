const express = require('express');
const router = express.Router();

router.get('/map', (req, res) => {
  const { train_id, travel_date, seat_class } = req.query;
  const carriage_no = req.query.carriage_no || '10';
  
  // 生成多排座位（1-20排，每排5个座位：A, B, C, D, F）
  const seats = [];
  const columns = ['A', 'B', 'C', 'D', 'F'];
  const rows = 20; // 20排座位
  
  for (let row = 1; row <= rows; row++) {
    for (const col of columns) {
      // 模拟部分座位已被占用
      const isOccupied = Math.random() < 0.2; // 20%的座位已占用
      
      seats.push({
        seat_no: `${row}${col}`,
        row: row,
        column: col,
        window: col === 'A' || col === 'F', // A和F是靠窗座位
        occupied: isOccupied
      });
    }
  }
  
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