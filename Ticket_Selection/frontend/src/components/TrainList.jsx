import React from 'react';

function TrainList({ trains }) {
    if (!trains || trains.length === 0) {
        return <p>没有符合条件的车次。</p>;
    }

    return (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
                <tr style={{ background: '#f2f2f2' }}>
                    <th style={cellStyle}>车次</th>
                    <th style={cellStyle}>出发站 → 到达站</th>
                    <th style={cellStyle}>出发时间 → 到达时间</th>
                    <th style={cellStyle}>历时</th>
                    <th style={cellStyle}>商务座/特等座</th>
                    <th style={cellStyle}>一等座</th>
                    <th style={cellStyle}>二等座</th>
                    <th style={cellStyle}>高级软卧</th>
                    <th style={cellStyle}>软卧/一等卧</th>
                    <th style={cellStyle}>硬卧/二等卧</th>
                    <th style={cellStyle}>软座</th>
                    <th style={cellStyle}>硬座</th>
                    <th style={cellStyle}>无座</th>
                    <th style={cellStyle}>其他</th>
                    <th style={cellStyle}>价格</th>
                    <th style={cellStyle}>备注</th>
                </tr>
            </thead>
            <tbody>
                {trains.map(train => {
                    const seatInfo = {};
                    train.seats.forEach(seat => {
                        seatInfo[seat.type] = seat.count;
                    });

                    return (
                        <tr key={train.trainNo} style={{ borderBottom: '1px solid #ddd' }}>
                            <td style={cellStyle}>{train.trainNo}</td>
                            <td style={cellStyle}>{train.fromStation}<br/>{train.toStation}</td>
                            <td style={cellStyle}>{train.departTime}<br/>{train.arriveTime}</td>
                            <td style={cellStyle}>{train.duration}</td>
                            <td style={cellStyle}>{seatInfo['商务座'] || '--'}</td>
                            <td style={cellStyle}>{seatInfo['一等座'] || '--'}</td>
                            <td style={cellStyle}>{seatInfo['二等座'] || '--'}</td>
                            <td style={cellStyle}>{seatInfo['高级软卧'] || '--'}</td>
                            <td style={cellStyle}>{seatInfo['软卧'] || '--'}</td>
                            <td style={cellStyle}>{seatInfo['硬卧'] || '--'}</td>
                            <td style={cellStyle}>{seatInfo['软座'] || '--'}</td>
                            <td style={cellStyle}>{seatInfo['硬座'] || '--'}</td>
                            <td style={cellStyle}>{seatInfo['无座'] || '--'}</td>
                            <td style={cellStyle}>--</td>
                            <td style={cellStyle}>¥{train.startingPrice}起</td>
                            <td style={cellStyle}>
                                <button style={{ padding: '5px 10px', background: '#007bff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
                                    预订
                                </button>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}

const cellStyle = {
    padding: '12px 8px',
    textAlign: 'left',
};

export default TrainList;