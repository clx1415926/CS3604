const express = require('express');
const router = express.Router();

// @InterfaceID: API-GET-QueryStations
router.get('/api/stations', (req, res) => {
  const { keyword } = req.query;
  if (!keyword) {
    return res.json([]);
  }
  const stations = [
    { name: "北京", code: "BJP" },
    { name: "北京南", code: "VNP" },
    { name: "北京西", code: "BXP" },
    { name: "上海", code: "SHH" },
    { name: "上海虹桥", code: "AOH" },
    { name: "上海南", code: "SNH" },
    { name: "广州", code: "GZQ" },
    { name: "广州南", code: "IZQ" },
    { name: "深圳", code: "SZQ" },
    { name: "深圳北", code: "IOQ" },
    { name: "成都", code: "CDW" },
    { name: "成都东", code: "ICW" },
    { name: "重庆", code: "CQW" },
    { name: "重庆西", code: "CXW" },
    { name: "杭州", code: "HZH" },
    { name: "杭州东", code: "HGH" },
    { name: "南京", code: "NJH" },
    { name: "南京南", code: "NKH" },
    { name: "西安", code: "XAY" },
    { name: "西安北", code: "EAY" },
    { name: "武汉", code: "WHN" },
    { name: "长沙", code: "CSQ" },
    { name: "长沙南", code: "CWQ" },
  ];
  const filteredStations = stations.filter(station =>
    station.name.includes(keyword) || station.code.toLowerCase().includes(keyword.toLowerCase())
  );
  res.json(filteredStations);
});

module.exports = router;