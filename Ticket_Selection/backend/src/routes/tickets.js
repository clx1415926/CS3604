const express = require('express');
const router = express.Router();
const { getDb, all, get } = require('../db');

async function loadSeatsByTrainId(db, trainId) {
  const rows = await all(
    db,
    'SELECT seat_type AS type, seat_count AS count, seat_price AS price FROM train_seats WHERE train_id = ? ORDER BY id ASC',
    [trainId]
  );
  return rows || [];
}

// @InterfaceID: API-GET-QueryTickets
router.get('/api/tickets', (req, res) => {
  (async () => {
    const { fromStation, toStation, departDate, trainTypes, seatTypes, sortBy } = req.query;
    const fromStationsParam = req.query.fromStations;
    const toStationsParam = req.query.toStations;

    if (!fromStation || !toStation || !departDate) {
      return res.status(400).json({ error: 'Missing required query parameters' });
    }

    const fromStationsFilter = fromStationsParam
      ? (Array.isArray(fromStationsParam) ? fromStationsParam : String(fromStationsParam).split(','))
      : null;
    const toStationsFilter = toStationsParam
      ? (Array.isArray(toStationsParam) ? toStationsParam : String(toStationsParam).split(','))
      : null;

    const db = await getDb();
    let filteredTrains = await all(
      db,
      `SELECT id, date, train_no, from_station, to_station, depart_time, arrive_time, duration, starting_price
       FROM trains
       WHERE date = ?
         AND (from_station = ? OR instr(from_station, ?) > 0)
         AND (to_station = ? OR instr(to_station, ?) > 0)`,
      [String(departDate), String(fromStation), String(fromStation), String(toStation), String(toStation)]
    );

    if (!Array.isArray(filteredTrains)) filteredTrains = [];

    filteredTrains = filteredTrains.map((t) => ({
      id: t.id,
      date: t.date,
      trainNo: t.train_no,
      fromStation: t.from_station,
      toStation: t.to_station,
      departTime: t.depart_time,
      arriveTime: t.arrive_time,
      duration: t.duration,
      startingPrice: t.starting_price,
    }));

    if (trainTypes && String(trainTypes).length > 0) {
      const types = Array.isArray(trainTypes) ? trainTypes : String(trainTypes).split(',');
      filteredTrains = filteredTrains.filter((train) => {
        const trainInitial = String(train.trainNo || '').charAt(0).toUpperCase();
        return types.includes(trainInitial);
      });
    }

    const trainsWithSeats = [];
    for (const t of filteredTrains) {
      const seats = await loadSeatsByTrainId(db, t.id);
      trainsWithSeats.push({
        date: t.date,
        trainNo: t.trainNo,
        fromStation: t.fromStation,
        toStation: t.toStation,
        departTime: t.departTime,
        arriveTime: t.arriveTime,
        duration: t.duration,
        seats,
        startingPrice: t.startingPrice,
      });
    }

    let result = trainsWithSeats;

    if (seatTypes && String(seatTypes).length > 0) {
      const types = Array.isArray(seatTypes) ? seatTypes : String(seatTypes).split(',');
      result = result.filter((train) =>
        (train.seats || []).some(
          (seat) =>
            types.includes(seat.type) &&
            (seat.count === '有' || (Number.isFinite(parseInt(seat.count, 10)) && parseInt(seat.count, 10) > 0))
        )
      );
    }

    if (fromStationsFilter && fromStationsFilter.length > 0) {
      result = result.filter((train) => fromStationsFilter.includes(train.fromStation));
    }

    if (toStationsFilter && toStationsFilter.length > 0) {
      result = result.filter((train) => toStationsFilter.includes(train.toStation));
    }

    if (sortBy) {
      switch (sortBy) {
        case 'depart_time':
          result.sort((a, b) => String(a.departTime).localeCompare(String(b.departTime)));
          break;
        case 'duration':
          result.sort((a, b) => {
            const durationA = parseInt(String(a.duration).replace('小时', '.').replace('分', ''), 10);
            const durationB = parseInt(String(b.duration).replace('小时', '.').replace('分', ''), 10);
            return durationA - durationB;
          });
          break;
        case 'arrival_time':
          result.sort((a, b) => String(a.arriveTime).localeCompare(String(b.arriveTime)));
          break;
      }
    }

    const stationsList = [...new Set(result.flatMap((t) => [t.fromStation, t.toStation]))];
    res.json({ trains: result, stations: stationsList });
  })().catch((e) => {
    console.error('[ticket-selection][tickets] db error', e);
    res.status(500).json({ error: 'DB_ERROR' });
  });
});

// @InterfaceID: API-GET-Stations
router.get('/api/stations', (req, res) => {
  (async () => {
    const db = await getDb();
    const rows = await all(db, 'SELECT DISTINCT from_station AS s FROM trains UNION SELECT DISTINCT to_station AS s FROM trains');
    const stations = (rows || []).map((r) => r.s).filter(Boolean);
    res.json({ stations });
  })().catch((e) => {
    console.error('[ticket-selection][stations] db error', e);
    res.status(500).json({ error: 'DB_ERROR' });
  });
});

module.exports = router;
