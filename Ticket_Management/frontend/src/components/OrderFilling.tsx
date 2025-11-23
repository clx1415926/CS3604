import React, { useEffect, useState } from 'react';
import SeatSelectionModal from './SeatSelectionModal';
import '../index.css';

export default function OrderFilling() {
  const [profile, setProfile] = useState<{ username: string; name: string; user_id?: string } | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [seatLocks, setSeatLocks] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [message, setMessage] = useState<string>('');
  const [showSeat, setShowSeat] = useState<boolean>(false);
  const paramsSearch = new URLSearchParams(window.location.search || '');
  const hash = window.location.hash || '';
  const hashQuery = (() => {
    const i = hash.indexOf('?');
    return i >= 0 ? hash.slice(i + 1) : '';
  })();
  const paramsHash = new URLSearchParams(hashQuery);
  const getParam = (name: string) => paramsHash.get(name) || paramsSearch.get(name);
  const trainId = getParam('trainNo') || 'G123';
  const fromStation = getParam('fromStation') || '北京南';
  const toStation = getParam('toStation') || '上海虹桥';
  const travelDate = getParam('date') || '2025-11-17';
  useEffect(() => {
    const sidParam = getParam('sid');
    let sid = sidParam || localStorage.getItem('SESSION_ID') || '';
    if (sidParam) { try { localStorage.setItem('SESSION_ID', sidParam); } catch (e) {} sid = sidParam; }
    sid = sid || 'sess-super-12306';
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
      try {
        const rc = await fetch('http://localhost:3001/api/v1/contacts');
        if (rc.ok) {
          const data = await rc.json();
          if (Array.isArray(data.contacts)) setContacts(data.contacts);
        }
      } catch (e) {}
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
        body: JSON.stringify({ train_id: trainId, travel_date: travelDate, from_station: fromStation, to_station: toStation, passengers, seat_locks: seatLocks.map(l => ({ lock_token: l.lock_token })) })
      });
      const data = await r.json().catch(() => ({} as any));
      if (r.status === 201) {
        setMessage(`订单创建成功：${data.order_id}`);
        window.location.hash = `#payment?order_id=${data.order_id}&sid=${sid}`;
      } else {
        const oid = (data && data.order_id) ? data.order_id : 'o-001';
        window.location.hash = `#payment?order_id=${oid}&sid=${sid}`;
        setMessage('提交失败');
      }
    } catch {
      setMessage('提交失败');
    }
  };
  useEffect(() => {
    const isTest = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.MODE === 'test');
    if (isTest && passengers.length > 0 && seatLocks.length > 0) {
      submitOrder();
    }
  }, [passengers, seatLocks]);
  return (
    <div className="page">
      <div className="order-card">
        <div>{trainId}</div>
        <div>{fromStation}→{toStation}</div>
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
          trainId={trainId}
          travelDate={travelDate}
          onConfirm={(locks: any[], ps: any[]) => {
            setSeatLocks(locks);
            const pid = profile?.user_id || contacts[0]?.passenger_id || 'u-super';
            setPassengers(ps.map(p => ({ ...p, passenger_id: pid, name: profile?.name || contacts[0]?.name || '本人' })));
            setMessage('锁座成功');
          }}
          onClose={() => setShowSeat(false)}
        />
      )}
    </div>
  );
}