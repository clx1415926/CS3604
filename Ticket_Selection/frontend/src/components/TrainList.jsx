import React, { useState } from 'react';

function TrainList({ trains }) {
    const [error, setError] = useState('');
    const [loadingId, setLoadingId] = useState(null);
    const book = async (train) => {
        setError('');
        let sid = (() => { try { return localStorage.getItem('SESSION_ID'); } catch (e) { return null; } })();
        if (!sid) {
            try {
                const params = new URLSearchParams(window.location.search || '');
                const sidParam = params.get('sid');
                if (sidParam) { try { localStorage.setItem('SESSION_ID', sidParam); } catch (e) {} sid = sidParam; }
            } catch (e) {}
        }
        if (!sid) { setError('请先登录后预订'); return; }
        const payload = {
            train_id: train.trainNo,
            travel_date: train.date,
            from_station: train.fromStation,
            to_station: train.toStation,
            passengers: [{ name: '本人' }],
            seat_locks: [{ lock_token: 'auto' }],
        };
        try {
            setLoadingId(train.trainNo);
            const r = await fetch('http://localhost:3001/api/v1/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sid },
                body: JSON.stringify(payload),
            });
            if (r.status === 201) {
                window.location.href = 'http://localhost:3001/';
                return;
            }
            const txt = await r.text();
            setError('服务不可用，请稍后重试（' + (txt || r.status) + '）');
        } catch (e) {
            setError('服务不可用，请稍后重试');
        } finally {
            setLoadingId(null);
        }
    };
    if (!trains || trains.length === 0) {
        return <p className="no-results-message">没有符合条件的车次。</p>;
    }

    return (
        <>
        <table className="train-list-table">
            <thead>
                <tr>
                    <th>车次</th>
                    <th>出发站 → 到达站</th>
                    <th>出发时间 → 到达时间</th>
                    <th>历时</th>
                    <th>商务座/特等座</th>
                    <th>一等座</th>
                    <th>二等座</th>
                    <th>高级软卧</th>
                    <th>软卧/一等卧</th>
                    <th>硬卧/二等卧</th>
                    <th>软座</th>
                    <th>硬座</th>
                    <th>无座</th>
                    <th>其他</th>
                    <th>价格</th>
                    <th>备注</th>
                </tr>
            </thead>
            <tbody>
                {trains.map(train => {
                    const seatInfo = {};
                    train.seats.forEach(seat => {
                        seatInfo[seat.type] = seat.count;
                    });

                    const renderSeat = (seatName) => {
                        const count = seatInfo[seatName];
                        if (count === '有' || (typeof count === 'number' && count > 0)) {
                            return <span className="seat-available">{count}</span>;
                        }
                        if (count) {
                            return <span className="seat-unavailable">{count}</span>;
                        }
                        return <span className="seat-none">--</span>;
                    };

                    return (
                        <tr key={train.trainNo}>
                            <td className="train-no">{train.trainNo}</td>
                            <td className="station-info">
                                <span className="station-name">{train.fromStation}</span>
                                <span className="station-name">{train.toStation}</span>
                            </td>
                            <td className="time-info">
                                <span className="time">{train.departTime}</span>
                                <span className="time">{train.arriveTime}</span>
                            </td>
                            <td className="duration">{train.duration}</td>
                            <td className="seat-cell">{renderSeat('商务座')}</td>
                            <td className="seat-cell">{renderSeat('一等座')}</td>
                            <td className="seat-cell">{renderSeat('二等座')}</td>
                            <td className="seat-cell">{renderSeat('高级软卧')}</td>
                            <td className="seat-cell">{renderSeat('软卧')}</td>
                            <td className="seat-cell">{renderSeat('硬卧')}</td>
                            <td className="seat-cell">{renderSeat('软座')}</td>
                            <td className="seat-cell">{renderSeat('硬座')}</td>
                            <td className="seat-cell">{renderSeat('无座')}</td>
                            <td className="seat-cell"><span className="seat-none">--</span></td>
                            <td className="price">¥{(train.startingPrice ?? train.starting_price)}起</td>
                            <td className="action-cell">
                                <button className="book-btn" onClick={() => book(train)} disabled={loadingId === train.trainNo}>{loadingId === train.trainNo ? '处理中...' : '预订'}</button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
        {error && <p className="error-message" style={{ textAlign: 'center', marginTop: '12px' }}>{error}</p>}
        </>
    );
}

export default TrainList;