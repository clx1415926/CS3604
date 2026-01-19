import React, { useState, useEffect } from 'react';

type Seat = {
  seat_no: string;
  row?: number;
  column: string;
  occupied?: boolean;
  window?: boolean;
  status?: 'available' | 'locked' | 'unpaid' | 'sold' | string;
  lock_expires_at?: string | null;
};

type Passenger = {
  passenger_id: string;
  name: string;
  id_type?: string;
  id_number?: string;
  masked_id_number?: string;
};

type Props = {
  trainId?: string;
  travelDate?: string;
  fromStation?: string;
  toStation?: string;
  departTime?: string;
  arriveTime?: string;
  passengerCount?: number;
  passengers?: Passenger[];
  onConfirm?: (selectedSeats: any[]) => void | Promise<void>;
  onCancel?: () => void;
};

export default function SeatSelectionModal({
  trainId = 'G4087',
  travelDate = '2025-11-17',
  fromStation = '北京南',
  toStation = '上海虹桥',
  departTime = '06:10',
  arriveTime = '12:09',
  passengerCount = 1,
  passengers = [],
  onConfirm = () => {},
  onCancel = () => {},
}: Props) {
  const [carriageNo, setCarriageNo] = useState('10');
  const [seatMap, setSeatMap] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [remainingSeats, setRemainingSeats] = useState(690);
  const [occupiedSeats, setOccupiedSeats] = useState<Set<string>>(new Set()); // 已占用座位集合

  useEffect(() => {
    setSelectedSeats([]);
    setError('');
    fetchSeatMap();
    const t = setInterval(() => {
      fetchSeatMap();
    }, 2000);
    return () => clearInterval(t);
  }, [carriageNo, trainId, travelDate]);

  const fetchSeatMap = async () => {
    setLoading(true);
    try {
      const sid = localStorage.getItem('SESSION_ID') || '';
      const res = await fetch(`http://localhost:3001/api/v1/seats/map?train_id=${trainId}&travel_date=${travelDate}&seat_class=二等座&carriage_no=${carriageNo}`, {
        headers: sid ? { Authorization: `Bearer ${sid}` } : {},
      });
      if (res.ok) {
        const data = await res.json();
        const next = (data.seats || []) as Seat[];
        setSeatMap(next);
        // 收集所有已占用座位（包括已锁定、已售等）
        const occupiedSet = new Set(
          next.filter(s => Boolean(s.occupied) || s.status === 'locked' || s.status === 'sold')
            .map(s => String(s.seat_no))
        );
        setOccupiedSeats(occupiedSet);
        if (selectedSeats.some(s => occupiedSet.has(s))) {
          setSelectedSeats(prev => prev.filter(s => !occupiedSet.has(s)));
          setError('所选座位已被占用，请重新选择');
        }
      } else {
        setError('获取座位信息失败');
      }
    } catch (e) {
      setError('网络错误');
    } finally {
      setLoading(false);
    }
  };

  const getSeatColumn = (seat: Seat) => {
    if (seat.column) return String(seat.column);
    const s = String(seat.seat_no || '');
    const m = s.match(/[A-Z]$/i);
    return m ? m[0].toUpperCase() : '';
  };

  const getSeatIsOccupied = (seat: Seat) => {
    return Boolean(seat.occupied) || seat.status === 'locked' || seat.status === 'sold';
  };

  const findFirstAvailableSeatNoByColumn = (col: string) => {
    const candidates = seatMap
      .filter(s => getSeatColumn(s) === col)
      .filter(s => !getSeatIsOccupied(s))
      .map(s => String(s.seat_no));

    const byRow = (a: string, b: string) => {
      const ra = Number((a.match(/^\d+/) || ['0'])[0]);
      const rb = Number((b.match(/^\d+/) || ['0'])[0]);
      return ra - rb;
    };

    candidates.sort(byRow);
    return candidates[0] || '';
  };

  const toggleSeatByColumn = (col: string) => {
    const seatNo = findFirstAvailableSeatNoByColumn(col);
    if (!seatNo) return;

    if (selectedSeats.includes(seatNo)) {
      setSelectedSeats(prev => prev.filter(s => s !== seatNo));
      setError('');
      return;
    }

    if (selectedSeats.length >= passengerCount) {
      setError(`最多只能选择 ${passengerCount} 个座位`);
      return;
    }

    setSelectedSeats(prev => [...prev, seatNo]);
    setError('');
  };

  const handleConfirm = async () => {
    if (confirming) return;

    const validSeats = selectedSeats.filter(Boolean);
    if (validSeats.length !== passengerCount) return;
    
    setConfirming(true);
    setError('');

    const seats = validSeats.map(seatNo => ({ carriage_no: carriageNo, seat_no: seatNo }));
    
    try {
      await Promise.resolve(onConfirm(seats));
    } finally {
      setConfirming(false);
    }
  };

  // 获取星期几
  const getWeekDay = (dateStr: string) => {
    const days = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    const date = new Date(dateStr);
    return days[date.getDay()];
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-container" style={{ width: '780px', maxWidth: '95%', maxHeight: '90vh', overflow: 'auto' }}>
        {/* 弹窗头部 - 12306蓝色风格 */}
        <div className="modal-header">
          <span>请核对以下信息</span>
          <span className="modal-close" onClick={onCancel}>✕</span>
        </div>

        <div style={{ padding: '20px' }}>
          {/* 列车信息 */}
          <div style={{ 
            background: '#f8f9fa', 
            padding: '12px 15px', 
            borderRadius: 4, 
            marginBottom: 15,
            fontSize: 14,
            color: '#333'
          }}>
            <span style={{ fontWeight: 600 }}>{travelDate}（{getWeekDay(travelDate)}）</span>
            <span style={{ marginLeft: 15, color: '#1890ff', fontWeight: 600 }}>{trainId}</span>
            <span style={{ marginLeft: 10 }}>次</span>
            <span style={{ marginLeft: 15 }}>{fromStation}站（{departTime}开）—{toStation}站（{arriveTime}到）</span>
          </div>

          {/* 乘客信息表格 */}
          <div style={{ marginBottom: 15, border: '1px solid #e8e8e8', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: '60px 80px 80px 100px 120px 180px',
              background: '#fafafa',
              padding: '10px 15px',
              fontWeight: 600,
              fontSize: 13,
              borderBottom: '1px solid #e8e8e8'
            }}>
              <div>序号</div>
              <div>席别</div>
              <div>票种</div>
              <div>姓名</div>
              <div>证件类型</div>
              <div>证件号码</div>
            </div>
            {passengers.map((p, index) => (
              <div key={p.passenger_id} style={{ 
                display: 'grid', 
                gridTemplateColumns: '60px 80px 80px 100px 120px 180px',
                padding: '10px 15px',
                fontSize: 13,
                borderBottom: index < passengers.length - 1 ? '1px solid #f0f0f0' : 'none'
              }}>
                <div>{index + 1}</div>
                <div>二等座</div>
                <div>成人票</div>
                <div>{p.name}</div>
                <div>{p.id_type || '居民身份证'}</div>
                <div>{p.masked_id_number || ''}</div>
              </div>
            ))}
          </div>

          {/* 选座提示 */}
          <div style={{ 
            background: '#fff7e6', 
            border: '1px solid #ffd591', 
            padding: '10px 15px', 
            borderRadius: 4, 
            marginBottom: 15,
            fontSize: 13,
            color: '#d46b08'
          }}>
            * 如果本次列车剩余坐席无法满足您的选座需求，系统将自动为您分配坐位。
          </div>

          {/* 选座区域 - 为每位乘客单独选座 */}
          <div style={{ 
            padding: '15px',
            background: '#fafafa',
            borderRadius: 4,
            marginBottom: 15
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 15 }}>
              <span style={{ color: '#52c41a', fontWeight: 600 }}>✓ 选座咯</span>
              <span style={{ fontSize: 12, color: '#999' }}>请为每位乘客选择座位偏好</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#333' }}>{carriageNo}号车厢 - 二等座</div>
              <select
                value={carriageNo}
                onChange={e => setCarriageNo(e.target.value)}
                style={{ padding: '6px 8px', border: '1px solid #d9d9d9', borderRadius: 4, background: '#fff' }}
              >
                {['10', '11', '12', '13', '14', '15'].map(n => (
                  <option key={n} value={n}>{n}号车厢</option>
                ))}
              </select>
            </div>

            <div style={{ fontSize: 13, color: '#666', marginBottom: 10 }}>
              需要选择 {passengerCount} 个座位，已选择 {selectedSeats.filter(Boolean).length} 个
            </div>

            {loading ? (
              <div style={{ padding: '10px 0', color: '#666' }}>加载中...</div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['A', 'B', 'C', 'D', 'F'].map(col => {
                    const seatNo = findFirstAvailableSeatNoByColumn(col);
                    const disabled = !seatNo;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => toggleSeatByColumn(col)}
                        disabled={disabled}
                        style={{
                          width: 36,
                          height: 36,
                          border: selectedSeats.includes(seatNo) ? '2px solid #1890ff' : '1px solid #d9d9d9',
                          borderRadius: 4,
                          background: selectedSeats.includes(seatNo) ? '#e6f7ff' : (disabled ? '#f5f5f5' : '#fff'),
                          color: disabled ? '#999' : '#333',
                          fontWeight: 600,
                          cursor: disabled ? 'not-allowed' : 'pointer',
                          fontSize: 13,
                          opacity: disabled ? 0.7 : 1,
                        }}
                      >
                        {col}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 余票信息 */}
          <div style={{ 
            fontSize: 13, 
            color: '#333', 
            marginBottom: 20,
            padding: '10px 15px',
            background: '#f0f9ff',
            borderRadius: 4
          }}>
            本次列车，二等座余票 <span style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 18 }}>{remainingSeats}</span> 张。
          </div>

          {error && (
            <div style={{ 
              background: '#fff2e8', 
              border: '1px solid #ffbb96', 
              color: '#d4380d', 
              padding: '10px 15px', 
              marginBottom: 15, 
              borderRadius: 4,
              fontSize: 13 
            }}>
              {error}
            </div>
          )}

          {/* 底部按钮 */}
          <div className="modal-footer" style={{ paddingTop: 15, paddingBottom: 0, justifyContent: 'center' }}>
            <button 
              onClick={onCancel}
              className="btn-back"
              style={{ minWidth: 100 }}
            >
              返回修改
            </button>
            <button 
              onClick={handleConfirm}
              disabled={confirming || selectedSeats.filter(s => s).length !== passengerCount}
              className="btn-submit-order"
              style={{ 
                minWidth: 100,
                opacity: (confirming || selectedSeats.filter(s => s).length !== passengerCount) ? 0.5 : 1,
                cursor: (confirming || selectedSeats.filter(s => s).length !== passengerCount) ? 'not-allowed' : 'pointer'
              }}
            >
              {confirming ? '确认中...' : '确认选座'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
