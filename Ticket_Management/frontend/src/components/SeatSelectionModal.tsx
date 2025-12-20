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

type Props = {
  trainId?: string;
  travelDate?: string;
  passengerCount?: number;
  onConfirm?: (selectedSeats: any[]) => void | Promise<void>;
  onCancel?: () => void;
};

export default function SeatSelectionModal({
  trainId = 'G123',
  travelDate = '2025-11-17',
  passengerCount = 1,
  onConfirm = () => {},
  onCancel = () => {},
}: Props) {
  const [carriageNo, setCarriageNo] = useState('10');
  const [seatMap, setSeatMap] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
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
        const occupiedSet = new Set(next.filter(s => Boolean(s.occupied)).map(s => String(s.seat_no)));
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

  const toggleSeat = (seatNo: string, occupied: boolean) => {
    if (occupied) return;
    
    if (selectedSeats.includes(seatNo)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNo));
    } else {
      if (selectedSeats.length >= passengerCount) {
        setError(`最多只能选择 ${passengerCount} 个座位`);
        return;
      }
      setSelectedSeats([...selectedSeats, seatNo]);
      setError('');
    }
  };

  const handleConfirm = async () => {
    if (confirming) return;
    if (selectedSeats.length !== passengerCount) return;
    setConfirming(true);
    const seats = selectedSeats.map(seatNo => ({
      carriage_no: carriageNo,
      seat_no: seatNo
    }));
    try {
      await Promise.resolve(onConfirm(seats));
    } finally {
      setConfirming(false);
    }
  };

  // 按排分组座位
  const seatsByRow = seatMap.reduce((acc, seat) => {
    const row = seat.row || parseInt(seat.seat_no);
    if (!acc[row]) acc[row] = [];
    acc[row].push(seat);
    return acc;
  }, {} as Record<number, Seat[]>);

  const rows = Object.keys(seatsByRow).map(Number).sort((a, b) => a - b);

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: 24, width: 700, maxHeight: '85vh', overflow: 'auto', borderRadius: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>选择座位</div>

        <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
          <button style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: 4, background: '#fff' }}>二等座</button>
          <button style={{ padding: '6px 12px', border: '1px solid #f0f0f0', borderRadius: 4, background: '#f7f7f7', color: '#999' }}>一等座</button>
          <button style={{ padding: '6px 12px', border: '1px solid #f0f0f0', borderRadius: 4, background: '#f7f7f7', color: '#999' }}>商务座</button>
        </div>
        
        {/* 车厢选择 */}
        <div style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
          <label style={{ fontWeight: 600 }}>车厢号：</label>
          <select 
            value={carriageNo} 
            onChange={(e) => {
              setCarriageNo(e.target.value);
              setSelectedSeats([]);
              setError('');
            }}
            style={{ padding: '6px 12px', border: '1px solid #d9d9d9', borderRadius: 4, fontSize: 14 }}
          >
            {Array.from({ length: 16 }, (_, i) => i + 1).map(n => (
              <option key={n} value={String(n)}>{n}号车厢</option>
            ))}
          </select>
        </div>
        
        <div style={{ marginBottom: 12, color: '#666' }}>
          需要选择 {passengerCount} 个座位，已选择 {selectedSeats.length} 个
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: '#666' }}>
          <span>窗户</span>
        </div>

        {error && <div style={{ background: '#ffebeb', border: '1px solid #ffbdbe', color: '#e4393c', padding: 10, marginBottom: 12, borderRadius: 4 }}>{error}</div>}

        <div style={{ display: 'flex', gap: 6, padding: '0 42px', marginBottom: 8, fontSize: 12, color: '#999' }}>
          {['A', 'B', 'C', 'D', 'E', 'F'].map(c => (
            <div key={c} style={{ minWidth: 45, textAlign: 'center' }}>{c}</div>
          ))}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>加载中...</div>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>{carriageNo}号车厢 - 二等座</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 12, color: '#666' }}>
                <span>🪟 靠窗</span>
                <span>🟢 可选</span>
                <span>🔴 已占</span>
                <span>🔵 已选</span>
              </div>
            </div>
            
            {/* 座位布局 - 按排显示 */}
            <div style={{ maxHeight: '450px', overflowY: 'auto', border: '1px solid #e8e8e8', borderRadius: 4, padding: 12 }}>
              {rows.map(rowNum => {
                const rowSeats = seatsByRow[rowNum].sort((a, b) => a.column.localeCompare(b.column));
                
                return (
                  <div key={rowNum} style={{ display: 'flex', alignItems: 'center', marginBottom: 8, gap: 8 }}>
                    <div style={{ width: 30, fontSize: 12, color: '#999', fontWeight: 600, textAlign: 'right' }}>
                      {rowNum}排
                    </div>
                    <div style={{ display: 'flex', gap: 6, flex: 1 }}>
                      {rowSeats.map(seat => {
                        const isSelected = selectedSeats.includes(seat.seat_no);
                        const isOccupied = Boolean(seat.occupied);
                        
                        return (
                          <button
                            key={seat.seat_no}
                            onClick={() => toggleSeat(seat.seat_no, isOccupied)}
                            disabled={isOccupied}
                            style={{
                              flex: 1,
                              padding: '10px 4px',
                              border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                              borderRadius: 4,
                              background: isOccupied ? '#f5f5f5' : isSelected ? '#e6f7ff' : '#fff',
                              cursor: isOccupied ? 'not-allowed' : 'pointer',
                              fontSize: 12,
                              fontWeight: isSelected ? 600 : 400,
                              color: isOccupied ? '#999' : isSelected ? '#1890ff' : '#333',
                              position: 'relative',
                              minWidth: 45
                            }}
                          >
                            <div>{seat.column}</div>
                            {seat.window && <div style={{ fontSize: 9 }}>🪟</div>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* 已选座位列表 */}
            {selectedSeats.length > 0 && (
              <div style={{ marginTop: 12, padding: 10, background: '#f0f9ff', borderRadius: 4, border: '1px solid #91d5ff' }}>
                <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#1890ff' }}>已选座位：</div>
                <div style={{ fontSize: 13, color: '#333' }}>
                  {selectedSeats.map(s => `${carriageNo}车${s}`).join('、')}
                </div>
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 20 }}>
          <button 
            onClick={onCancel}
            style={{ padding: '10px 20px', background: '#fff', border: '1px solid #d9d9d9', borderRadius: 4, cursor: 'pointer' }}
          >
            取消
          </button>
          <button 
            onClick={handleConfirm}
            disabled={confirming || selectedSeats.length !== passengerCount}
            style={{ 
              padding: '10px 20px', 
              background: confirming || selectedSeats.length !== passengerCount ? '#ccc' : '#1890ff', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 4, 
              cursor: confirming || selectedSeats.length !== passengerCount ? 'not-allowed' : 'pointer',
              fontWeight: 600
            }}
          >
            确认选座
          </button>
        </div>
      </div>
    </div>
  );
}
