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
  seat_type?: string;
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
  seatClass?: string;
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
  seatClass = '二等座',
  onConfirm = () => {},
  onCancel = () => {},
}: Props) {
  // 根据座位类型设置初始车厢号
  const getInitialCarriageNo = (seatClass: string) => {
    const carriageMap: { [key: string]: string } = {
      '商务座': '1',
      '一等座': '3',
      '二等座': '7',
      '硬座': '15',
      '硬卧': '19',
      '软卧': '23',
    };
    return carriageMap[seatClass] || '7';
  };
  
  const [carriageNo, setCarriageNo] = useState(getInitialCarriageNo(seatClass));
  const [seatMap, setSeatMap] = useState<Seat[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [remainingSeats, setRemainingSeats] = useState(690);
  const [occupiedSeats, setOccupiedSeats] = useState<Set<string>>(new Set()); // 已占用座位集合

  useEffect(() => {
    fetchSeatMap();
    const t = setInterval(() => {
      fetchSeatMap();
    }, 2000);
    return () => clearInterval(t);
  }, [carriageNo, trainId, travelDate, seatClass]);

  useEffect(() => {
    setSelectedSeats([]);
  }, [carriageNo]);

  const fetchSeatMap = async () => {
    setLoading(true);
    try {
      const sid = localStorage.getItem('SESSION_ID') || '';
      const res = await fetch(`http://localhost:3001/api/v1/seats/map?train_id=${trainId}&travel_date=${travelDate}&seat_class=${encodeURIComponent(seatClass)}&carriage_no=${carriageNo}`, {
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

  // 计算乘客的预分配座位号（用于显示）
  const getPreviewSeatNo = (pIndex: number): string | null => {
    const seatCol = selectedSeats[pIndex];
    if (!seatCol) return null;
    
    // 计算该乘客之前同样选择该位置的乘客数量
    let sameColCount = 0;
    for (let i = 0; i < pIndex; i++) {
      if (selectedSeats[i] === seatCol) {
        sameColCount++;
      }
    }
    
    // 从第1排开始，跳过已占用和已分配给之前乘客的座位
    let skipCount = 0;
    for (let row = 1; row <= 20; row++) {
      const seatNo = `${row}${seatCol}`;
      if (!occupiedSeats.has(seatNo)) {
        if (skipCount === sameColCount) {
          return `${carriageNo}车${seatNo}`;
        }
        skipCount++;
      }
    }
    return null;
  };

  const handleConfirm = async () => {
    if (confirming) return;
    
    // 检查每位乘客是否都选择了座位
    const validSeats = selectedSeats.filter(s => s);
    if (validSeats.length !== passengerCount) {
      setError('请为每位乘客选择座位偏好');
      return;
    }
    
    setConfirming(true);
    setError('');
    
    // 为每位乘客智能分配不冲突的座位
    // 根据已占用座位情况，找到可用的排号
    const seats: { carriage_no: string; seat_no: string; seat_class?: string }[] = [];
    const usedSeatNos = new Set<string>(); // 本次已分配的座位号
    
    for (let i = 0; i < passengerCount; i++) {
      const seatCol = selectedSeats[i]; // 用户选择的座位字母（A/B/C/D/F）
      const passenger = passengers[i];
      const passengerSeatClass = passenger?.seat_type || seatClass;
      let assigned = false;
      
      // 从第1排开始尝试，找到一个未被占用的座位
      for (let row = 1; row <= 20; row++) {
        const seatNo = `${row}${seatCol}`;
        // 检查是否未被占用且本次未分配过
        if (!occupiedSeats.has(seatNo) && !usedSeatNos.has(seatNo)) {
          seats.push({
            carriage_no: carriageNo,
            seat_no: seatNo,
            seat_class: passengerSeatClass
          });
          usedSeatNos.add(seatNo);
          assigned = true;
          break;
        }
      }
      
      if (!assigned) {
        setError(`无法为乘客${i + 1}分配${seatCol}座位，请选择其他位置`);
        setConfirming(false);
        return;
      }
    }
    
    console.log('[座位选择模态框] 分配的座位:', seats);
    
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
                <div>{p.seat_type || seatClass}</div>
                <div>成人票</div>
                <div>{p.name}</div>
                <div>{p.id_type || '居民身份证'}</div>
                <div>{p.masked_id_number || ''}</div>
              </div>
            ))}
          </div>

          {/* 车厢选择与统计 */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
             <div style={{ display: 'flex', alignItems: 'center', fontSize: 14 }}>
                <span style={{ marginRight: 10, fontWeight: 600 }}>车厢：</span>
                <select 
                  value={carriageNo} 
                  onChange={(e) => setCarriageNo(e.target.value)}
                  style={{ padding: '4px 8px', borderRadius: 4, border: '1px solid #d9d9d9' }}
                >
                  {[...Array(16)].map((_, i) => {
                    const c = String(i + 1);
                    return <option key={c} value={c}>{c}号车厢</option>
                  })}
                </select>
                <span style={{ marginLeft: 10 }}> - {seatClass}</span>
             </div>
             <div style={{ fontSize: 14, color: '#666' }}>
                需要选择 {passengerCount} 个座位，已选择 {selectedSeats.filter(s => s).length} 个
             </div>
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
            
            {/* 每位乘客的座位选择 */}
            {passengers.map((passenger, pIndex) => (
              <div key={passenger.passenger_id} style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 15,
                marginBottom: pIndex < passengers.length - 1 ? 12 : 0,
                padding: '10px 15px',
                background: '#fff',
                borderRadius: 4,
                border: '1px solid #e8e8e8'
              }}>
                <span style={{ 
                  minWidth: 60, 
                  fontSize: 13, 
                  color: '#333',
                  fontWeight: 500 
                }}>
                  {passenger.name}
                </span>
                
                {/* 座位选择布局 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, color: '#666' }}>窗</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['A', 'B', 'C'].map(col => {
                      const isSelected = selectedSeats[pIndex] === col;
                      return (
                        <button
                          key={col}
                          onClick={() => {
                            const newSeats = [...selectedSeats];
                            newSeats[pIndex] = col;
                            setSelectedSeats(newSeats);
                            setError('');
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                            borderRadius: 4,
                            background: isSelected ? '#e6f7ff' : '#fff',
                            color: isSelected ? '#1890ff' : '#333',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 13
                          }}
                        >
                          {col}
                        </button>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: 12, color: '#999' }}>过道</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {['D', 'F'].map(col => {
                      const isSelected = selectedSeats[pIndex] === col;
                      return (
                        <button
                          key={col}
                          onClick={() => {
                            const newSeats = [...selectedSeats];
                            newSeats[pIndex] = col;
                            setSelectedSeats(newSeats);
                            setError('');
                          }}
                          style={{
                            width: 32,
                            height: 32,
                            border: isSelected ? '2px solid #1890ff' : '1px solid #d9d9d9',
                            borderRadius: 4,
                            background: isSelected ? '#e6f7ff' : '#fff',
                            color: isSelected ? '#1890ff' : '#333',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 13
                          }}
                        >
                          {col}
                        </button>
                      );
                    })}
                  </div>
                  <span style={{ fontSize: 12, color: '#666' }}>窗</span>
                </div>
                
                {selectedSeats[pIndex] && (
                  <span style={{ fontSize: 12, color: '#1890ff', marginLeft: 10 }}>
                    已选: {getPreviewSeatNo(pIndex) || '分配中...'}
                  </span>
                )}
              </div>
            ))}
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
            本次列车，{seatClass}余票 <span style={{ color: '#ff4d4f', fontWeight: 600, fontSize: 18 }}>{remainingSeats}</span> 张。
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
              ⚠️ {error}
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
              {confirming ? '确认中...' : '确认'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
