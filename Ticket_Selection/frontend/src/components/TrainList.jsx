import React, { useState } from 'react';

function TrainList({ trains, query }) {
    const [error, setError] = useState('');
    const [loadingId, setLoadingId] = useState(null);
    const book = async (train) => {
        setError('');
        let sid = (() => { try { return localStorage.getItem('SESSION_ID'); } catch (e) { return null; } })();
        
        // 验证 session 是否有效
        if (sid) {
            try {
                const checkRes = await fetch('http://localhost:8082/api/v1/auth/session', {
                    headers: { Authorization: 'Bearer ' + sid }
                });
                if (!checkRes.ok) {
                    // 会话已失效，清除本地存储
                    try { localStorage.removeItem('SESSION_ID'); } catch (e) {}
                    sid = null;
                }
            } catch (e) {
                // 网络错误时保守处理
            }
        }
        
        if (!sid) { setError('请先登录后预订'); return; }
        
        try {
            setLoadingId(train.trainNo);
            const qp = new URLSearchParams();
            qp.set('trainNo', train.trainNo);
            qp.set('fromStation', train.fromStation);
            qp.set('toStation', train.toStation);
            qp.set('date', train.date);
            qp.set('sid', sid);
            
            const url = `http://localhost:5174/#order-filling?${qp.toString()}`;
            if (process.env.NODE_ENV === 'test') {
                try { const u = new URL(url); window.location.hash = u.hash; } catch (_) { window.location.hash = `order-filling?${qp.toString()}`; }
            } else {
                window.location.href = url;
            }
        } catch (e) {
            setError('服务不可用，请稍后重试');
        } finally {
            setLoadingId(null);
        }
    };
    if (!trains || trains.length === 0) {
        const from = query?.fromStation;
        const to = query?.toStation;
        
        if (from && to) {
            return (
                <div className="no-ticket-w" style={{
                    border: '1px solid #ededed',
                    backgroundColor: '#fff',
                    padding: '40px 0',
                    textAlign: 'center',
                    marginTop: '10px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    minHeight: '120px'
                }}>
                    <div className="icon-box" style={{ marginRight: '20px' }}>
                        <svg width="48" height="48" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                            <path d="M512 0C229.668571 0 0 229.668571 0 512s229.668571 512 512 512 512-229.668571 512-512S794.331429 0 512 0z m0 914.285714c-221.952 0-402.285714-180.333714-402.285714-402.285714S290.048 109.714286 512 109.714286s402.285714 180.333714 402.285714 402.285714-180.333714 402.285714-402.285714 402.285714z" fill="#DEDEDE"></path>
                            <path d="M470.857143 256h82.285714v329.142857h-82.285714zM470.857143 658.285714h82.285714v82.285715h-82.285714z" fill="#DEDEDE"></path>
                        </svg>
                    </div>
                    <div className="txt-box" style={{ textAlign: 'left', fontSize: '14px', color: '#666', lineHeight: '24px' }}>
                        <div style={{ color: '#999' }}>
                            很抱歉，按您的查询条件，当前未找到从<span style={{ fontWeight: 'bold', color: '#333', margin: '0 4px' }}>{from}</span>到<span style={{ fontWeight: 'bold', color: '#333', margin: '0 4px' }}>{to}</span>的列车。
                        </div>
                        <div style={{ color: '#999' }}>
                            您可以试用<a href="javascript:void(0)" style={{ color: '#0077FF', cursor: 'pointer', textDecoration: 'none' }}>中转换乘</a>功能，查询途中换乘一次的部分列车余票情况。
                        </div>
                    </div>
                </div>
            );
        }
        return <p className="no-results-message" style={{ textAlign: 'center', padding: '40px', color: '#999' }}>没有符合条件的车次。</p>;
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
