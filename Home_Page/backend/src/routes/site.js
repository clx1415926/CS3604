const express = require('express');
const { getSiteMetadata } = require('../data/siteMetadata');
const router = express.Router();

router.get('/metadata', (req, res) => {
  const body = getSiteMetadata();
  res.status(200).json(body);
});

module.exports = router;