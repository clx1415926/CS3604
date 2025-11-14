import React from 'react';

function TrainList({ trains }) {
    if (!trains || trains.length === 0) {
        return <p className="no-results-message">没有符合条件的车次。</p>;
    }

    return (
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
                                <button className="book-btn">预订</button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

export default TrainList;