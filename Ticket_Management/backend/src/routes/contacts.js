const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  const contacts = [
    {
      passenger_id: 'p-001',
      name: '张三',
      id_type: '居民身份证',
      masked_id_number: '110101********1234',
      verified: true,
    },
  ];
  res.json({ contacts });
});

module.exports = router;