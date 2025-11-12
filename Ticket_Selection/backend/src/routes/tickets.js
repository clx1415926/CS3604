const express = require('express');
const router = express.Router();

const tickets = {
    trains: [
        // 2025-12-15
        {
            date: "2025-12-15",
            trainNo: "G101",
            fromStation: "北京南站",
            toStation: "上海虹桥站",
            departTime: "08:00",
            arriveTime: "13:28",
            duration: "5小时28分",
            seats: [
                { type: '商务座', count: '有', price: 1748 },
                { type: '一等座', count: '有', price: 933 },
                { type: '二等座', count: '有', price: 553 }
            ],
            startingPrice: 553,
        },
        {
            date: "2025-12-15",
            trainNo: "D313",
            fromStation: "北京南站",
            toStation: "上海虹桥站",
            departTime: "14:20",
            arriveTime: "22:50",
            duration: "8小时30分",
            seats: [
                { type: "二等座", count: "有", price: 428 },
                { type: "一等座", count: "有", price: 684 },
            ],
            startingPrice: 428,
        },
        {
            date: "2025-12-15",
            trainNo: "K511",
            fromStation: "北京西站",
            toStation: "上海站",
            departTime: "19:15",
            arriveTime: "14:45", // Next day
            duration: "19小时30分",
            seats: [
                { type: "硬座", count: "有", price: 156 },
                { type: "硬卧", count: "有", price: 300 },
                { type: "软卧", count: "有", price: 450 },
            ],
            startingPrice: 156,
        },
        {
            date: "2025-12-15",
            trainNo: "G7001",
            fromStation: "南京南站",
            toStation: "上海虹桥站",
            departTime: "09:30",
            arriveTime: "11:00",
            duration: "1小时30分",
            seats: [
                { type: "二等座", count: "有", price: 134 },
                { type: "一等座", count: "有", price: 200 },
                { type: "商务座", count: "有", price: 400 },
            ],
            starting_price: 134,
        },
        {
            date: "2025-12-15",
            trainNo: "D5401",
            fromStation: "南京南站",
            toStation: "上海虹桥站",
            departTime: "15:45",
            arriveTime: "17:15",
            duration: "1小时30分",
            seats: [
                { type: "二等座", count: "有", price: 119 },
                { type: "一等座", count: "有", price: 180 },
            ],
            starting_price: 119,
        },
        {
            date: "2025-12-15",
            trainNo: "G7002",
            fromStation: "上海虹桥站",
            toStation: "南京南站",
            departTime: "12:00",
            arriveTime: "13:30",
            duration: "1小时30分",
            seats: [
                { type: "二等座", count: "有", price: 134 },
                { type: "一等座", count: "有", price: 200 },
                { type: "商务座", count: "有", price: 400 },
            ],
            starting_price: 134,
        },
        // 2025-12-16
        {
            date: "2025-12-16",
            trainNo: "G103",
            fromStation: "北京南站",
            toStation: "上海虹桥站",
            departTime: "08:30",
            arriveTime: "13:58",
            duration: "5小时28分",
            seats: [
                { type: "二等座", count: "有", price: 428 },
                { type: "一等座", count: "有", price: 684 },
            ],
            starting_price: 428,
        },
        {
            date: "2025-12-16",
            trainNo: "D315",
            fromStation: "北京南站",
            toStation: "上海虹桥站",
            departTime: "14:50",
            arriveTime: "23:20",
            duration: "8小时30分",
            seats: [
                { type: "二等座", count: "有", price: 428 },
                { type: "一等座", count: "有", price: 684 },
            ],
            starting_price: 428,
        },
        {
            date: "2025-12-16",
            trainNo: "G153",
            fromStation: "北京南站",
            toStation: "南京南站",
            departTime: "10:45",
            arriveTime: "14:15",
            duration: "3小时30分",
            seats: [
                { type: "二等座", count: "有", price: 443 },
                { type: "一等座", count: "有", price: 700 },
                { type: "商务座", count: "有", price: 1400 },
            ],
            starting_price: 443,
        },
        {
            date: "2025-12-16",
            trainNo: "G7003",
            fromStation: "南京南站",
            toStation: "上海虹桥站",
            departTime: "10:00",
            arriveTime: "11:30",
            duration: "1小时30分",
            seats: [
                { type: "二等座", count: "有", price: 134 },
                { type: "一等座", count: "有", price: 200 },
                { type: "商务座", count: "有", price: 400 },
            ],
            starting_price: 134,
        },
        {
            date: "2025-12-16",
            trainNo: "G506",
            fromStation: "长沙南",
            toStation: "北京西站",
            departTime: "09:00",
            arriveTime: "15:00",
            duration: "6小时00分",
            seats: [
                { type: "二等座", count: "有", price: 650 },
                { type: "一等座", count: "有", price: 1000 },
            ],
            starting_price: 650,
        },
        {
            date: "2025-12-16",
            trainNo: "G1234",
            fromStation: "长春",
            toStation: "北京",
            departTime: "07:00",
            arriveTime: "13:30",
            duration: "6小时30分",
            seats: [
                { type: "二等座", count: "有", price: 500 },
                { type: "一等座", count: "有", price: 800 },
            ],
            starting_price: 500,
        }
    ],
};

const allStations = [...new Set(tickets.trains.flatMap(t => [t.fromStation, t.toStation]))];

// @InterfaceID: API-GET-QueryTickets
router.get('/api/tickets', (req, res) => {
    const { fromStation, toStation, departDate, trainTypes, seatTypes, sortBy } = req.query;

    if (!fromStation || !toStation || !departDate) {
        return res.status(400).json({ error: 'Missing required query parameters' });
    }

    let filteredTrains = tickets.trains.filter(train =>
        train.fromStation === fromStation &&
        train.toStation === toStation &&
        train.date === departDate
    );

    // Filter by train types
    if (trainTypes && trainTypes.length > 0) {
        const types = Array.isArray(trainTypes) ? trainTypes : [trainTypes];
        filteredTrains = filteredTrains.filter(train => {
            const trainInitial = train.trainNo.charAt(0).toUpperCase();
            return types.includes(trainInitial);
        });
    }

    // Filter by seat types
    if (seatTypes && seatTypes.length > 0) {
        const types = Array.isArray(seatTypes) ? seatTypes : [seatTypes];
        filteredTrains = filteredTrains.filter(train =>
            train.seats.some(seat => types.includes(seat.type) && (seat.count === '有' || parseInt(seat.count) > 0))
        );
    }

    // Sort results
    if (sortBy) {
        switch (sortBy) {
            case 'depart_time':
                filteredTrains.sort((a, b) => a.departTime.localeCompare(b.departTime));
                break;
            case 'duration':
                filteredTrains.sort((a, b) => {
                    const durationA = parseInt(a.duration.replace('小时', '.').replace('分', ''));
                    const durationB = parseInt(b.duration.replace('小时', '.').replace('分', ''));
                    return durationA - durationB;
                });
                break;
            case 'arrival_time':
                filteredTrains.sort((a, b) => a.arriveTime.localeCompare(b.arriveTime));
                break;
        }
    }

    res.json({ trains: filteredTrains });
});

// @InterfaceID: API-GET-Stations
router.get('/api/stations', (req, res) => {
    res.json({ stations: allStations });
});

module.exports = router;