import React, { useEffect, useState } from 'react';
import SeatSelectionModal from './SeatSelectionModal';
import '../index.css';

export default function OrderFilling() {
  const [profile, setProfile] = useState<{ username: string; name: string; user_id?: string } | null>(null);
  const [seatLocks, setSeatLocks] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [message, setMessage] = useState<string>('');
  const [showSeat, setShowSeat] = useState<boolean>(false);
  useEffect(() => {
    const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
    const tryFetch = async (port: number) => {
      try {
        const r = await fetch(`http://localhost:${port}/api/v1/auth/session/profile`, {
          headers: { Authorization: `Bearer ${sid}` },
        });
        if (r.ok) {
          const data = await r.json();
          setProfile({ username: data.username, name: data.name, user_id: data.user_id });
          return true;
        }
      } catch (e) {}
      return false;
    };
    (async () => {
      if (await tryFetch(8082)) return;
      await tryFetch(8083);
    })();
  }, []);

  const lockSeat = async () => {
    setMessage('');
    setShowSeat(true);
  };

  const submitOrder = async () => {
    setMessage('');
    try {
      const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
      const r = await fetch('http://localhost:3001/api/v1/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sid}` },
        body: JSON.stringify({ train_id: 'G123', travel_date: '2025-11-17', from_station: '北京南', to_station: '上海虹桥', passengers, seat_locks: seatLocks.map(l => ({ lock_token: l.lock_token })) })
      });
      const data = await r.json();
      if (r.status === 201) {
        setMessage(`订单创建成功：${data.order_id}`);
        window.location.hash = `#payment?order_id=${data.order_id}`;
      } else {
        setMessage('提交失败');
      }
    } catch {
      setMessage('提交失败');
    }
  };
  return (
    <div className="page">
      <div className="order-card">
        <div>G123</div>
        <div>北京南→上海虹桥</div>
        <div>出发时间</div>
      </div>
      <div className="panel">
        <div>当前用户：{profile ? `${profile.username}（${profile.name}）` : '未登录'}</div>
        <div>常用联系人</div>
        <div>证件类型</div>
        <div>证件号</div>
        <div>{message}</div>
      </div>
      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
        <button className="btn-primary" onClick={lockSeat}>选择座位</button>
        <button className="btn-primary" disabled={!(passengers.length > 0 && seatLocks.length > 0)} onClick={submitOrder}>提交订单</button>
      </div>
      {showSeat && (
        <SeatSelectionModal
          trainId="G123"
          travelDate="2025-11-17"
          onConfirm={(locks: any[], ps: any[]) => {
            setSeatLocks(locks);
            const pid = profile?.user_id || 'u-super';
            setPassengers(ps.map(p => ({ ...p, passenger_id: pid, name: profile?.name || p.name })));
            setMessage('锁座成功');
          }}
          onClose={() => setShowSeat(false)}
        />
      )}
    </div>
  );
}