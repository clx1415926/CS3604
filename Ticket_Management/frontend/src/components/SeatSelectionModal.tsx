import React, { useState, useEffect } from 'react';

type Props = {
  trainId: string;
  travelDate: string;
  passengerCount: number;
  onConfirm: (selectedSeats: any[]) => void;
  onCancel: () => void;
};

export default function SeatSelectionModal({ trainId, travelDate, passengerCount, onConfirm, onCancel }: Props) {
  const [seatMap, setSeatMap] = useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchSeatMap();
  }, []);

  const fetchSeatMap = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3001/api/v1/seats/map?train_id=${trainId}&travel_date=${travelDate}&seat_class=二等座&carriage_no=10`);
      if (res.ok) {
        const data = await res.json();
        setSeatMap(data.seats || []);
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

  const handleConfirm = () => {
    if (selectedSeats.length !== passengerCount) {
      setError(`请选择 ${passengerCount} 个座位`);
      return;
    }
    
    const seats = selectedSeats.map(seatNo => ({
      carriage_no: '10',
      seat_no: seatNo
    }));
    
    onConfirm(seats);
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
      <div style={{ background: '#fff', padding: 24, width: 500, maxHeight: '80vh', overflow: 'auto', borderRadius: 8 }}>
        <div style={{ fontWeight: 600, fontSize: 18, marginBottom: 16 }}>选择座位</div>
        
        <div style={{ marginBottom: 12, color: '#666' }}>
          需要选择 {passengerCount} 个座位，已选择 {selectedSeats.length} 个
        </div>

        {error && <div style={{ background: '#ffebeb', border: '1px solid #ffbdbe', color: '#e4393c', padding: 10, marginBottom: 12, borderRadius: 4 }}>{error}</div>}

        {loading ? (
          <div style={{ textAlign: 'center', padding: 20 }}>加载中...</div>
        ) : (
          <div>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>10号车厢 - 二等座</div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 8, fontSize: 12, color: '#666' }}>
                <span>🪟 靠窗</span>
                <span>🟢 可选</span>
                <span>🔴 已占</span>
                <span>🔵 已选</span>
              </div>
            </div>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {seatMap.map(seat => {
                const isSelected = selectedSeats.includes(seat.seat_no);
                const isOccupied = seat.occupied;
                
                return (
                  <button
                    key={seat.seat_no}
                    onClick={() => toggleSeat(seat.seat_no, isOccupied)}
                    disabled={isOccupied}
                    style={{
                      padding: '12px 8px',
                      border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                      borderRadius: 4,
                      background: isOccupied ? '#f5f5f5' : isSelected ? '#e6f7ff' : '#fff',
                      cursor: isOccupied ? 'not-allowed' : 'pointer',
                      fontSize: 13,
                      fontWeight: isSelected ? 600 : 400,
                      color: isOccupied ? '#999' : isSelected ? '#1890ff' : '#333',
                      position: 'relative'
                    }}
                  >
                    <div>{seat.seat_no}</div>
                    {seat.window && <div style={{ fontSize: 10, color: '#999' }}>🪟</div>}
                  </button>
                );
              })}
            </div>
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
            disabled={selectedSeats.length !== passengerCount}
            style={{ 
              padding: '10px 20px', 
              background: selectedSeats.length === passengerCount ? '#1890ff' : '#d9d9d9', 
              color: '#fff', 
              border: 'none', 
              borderRadius: 4, 
              cursor: selectedSeats.length === passengerCount ? 'pointer' : 'not-allowed',
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