import React, { useEffect, useState } from 'react';
import SeatSelectionModal from './SeatSelectionModal';
import WarmTipModal from './WarmTipModal';
import '../index.css';

export default function OrderFilling() {
  const [profile, setProfile] = useState<{ username: string; name: string; user_id?: string } | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [seatLocks, setSeatLocks] = useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [message, setMessage] = useState<string>('');
  const [showSeat, setShowSeat] = useState<boolean>(false);
  const [showWarmTip, setShowWarmTip] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

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

  const seatsCacheKeyBase = (sid: string) => `TM_SELECTED_SEATS:${sid || 'anonymous'}:${trainId}:${travelDate}`;

  const getContactsCacheKey = (sid: string) => `TM_CONTACTS_CACHE:${sid || 'anonymous'}`;
  const contactsCacheTtlMs = 2 * 60 * 1000;

  const safeParseJson = (raw: string | null) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  const maskIdForDisplay = (id: string) => {
    if (!id) return '';
    if (id.length > 10) return id.slice(0, 6) + '********' + id.slice(-4);
    return id;
  };

  const fallbackContacts = [
    {
      passenger_id: 'p-001',
      name: '张三',
      id_type: '居民身份证',
      id_number: '110101199001011234',
      masked_id_number: '110101********1234',
      verified: true,
    },
  ];

  const normalizePassengers = (data: any) => {
    const list = Array.isArray(data?.passengers) ? data.passengers : [];
    const mapped = list
      .map((p: any) => {
        const passenger_id = typeof p?.passenger_id === 'string' ? p.passenger_id : '';
        const name = typeof p?.name === 'string' ? p.name : '';
        const id_type = typeof p?.id_type === 'string' ? p.id_type : '';
        const id_number = typeof p?.id_number === 'string' ? p.id_number : '';
        const verified_status = typeof p?.verified_status === 'string' ? p.verified_status : '';
        if (!passenger_id || !name) return null;
        return {
          passenger_id,
          name,
          id_type,
          id_number,
          masked_id_number: maskIdForDisplay(id_number),
          verified: verified_status === '已通过',
        };
      })
      .filter(Boolean);
    return mapped as any[];
  };

  useEffect(() => {
    const sidParam = getParam('sid');
    let sid = sidParam || localStorage.getItem('SESSION_ID') || '';
    if (sidParam) { try { localStorage.setItem('SESSION_ID', sidParam); } catch (e) {} sid = sidParam; }
    sid = sid || 'sess-super-12306';

    const authBases = ['http://localhost:8080/api/v1', 'http://localhost:8081/api/v1', 'http://127.0.0.1:8082/api/v1'];

    const touchSession = async () => {
      for (const base of authBases) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        try {
          const r = await fetch(`${base}/auth/session`, { headers: { Authorization: `Bearer ${sid}` }, signal: controller.signal });
          if (r.ok) return { ok: true, base };
        } catch (e) {
        } finally {
          clearTimeout(timeout);
        }
      }
      return { ok: false, base: '' };
    };

    const tryFetchProfile = async (base: string) => {
      try {
        const r = await fetch(`${base}/auth/session/profile`, { headers: { Authorization: `Bearer ${sid}` } });
        if (!r.ok) return false;
        const data = await r.json().catch(() => ({}));
        setProfile({ username: data.username, name: data.name, user_id: data.user_id });
        return true;
      } catch (e) {}
      return false;
    };

    const fetchContacts = async () => {
      setIsSyncing(true);
      setSyncError('');

      const logBase = {
        ts: new Date().toISOString(),
        user_id: profile?.user_id,
        sid,
      };

      const cacheKey = getContactsCacheKey(sid);
      const cached = safeParseJson(localStorage.getItem(cacheKey));
      const cachedContacts = Array.isArray(cached?.contacts) ? cached.contacts : null;
      const cachedAt = typeof cached?.saved_at === 'number' ? cached.saved_at : 0;
      const cacheFresh = cachedAt > 0 && Date.now() - cachedAt <= contactsCacheTtlMs;
      if (cacheFresh && cachedContacts && cachedContacts.length > 0) {
        setContacts(cachedContacts);
        setPassengers(prev => prev.filter(p => cachedContacts.some((m: any) => m.passenger_id === p.passenger_id)));
        console.info({ ...logBase, event: 'PASSENGERS_CACHE_APPLIED', count: cachedContacts.length });
      }

      try {
        const doFetch = async (attempt: number) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          try {
            await touchSession();
            const rc = await fetch('http://localhost:8083/api/v1/passengers?showFull=true', {
              headers: { Authorization: `Bearer ${sid}` },
              signal: controller.signal,
            });
            if (!rc.ok) {
              const error = new Error(`SYNC_HTTP_${rc.status}`);
              (error as any).status = rc.status;
              throw error;
            }
            const data = await rc.json();
            const mapped = normalizePassengers(data);
            try {
              localStorage.setItem(cacheKey, JSON.stringify({ saved_at: Date.now(), contacts: mapped }));
            } catch (e) {}
            setContacts(mapped);
            setPassengers(prev => prev.filter(p => mapped.some(m => m.passenger_id === p.passenger_id)));
            console.info({ ...logBase, event: 'PASSENGERS_SYNC_OK', count: mapped.length, attempt });
          } catch (e) {
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 300 * attempt));
              return doFetch(attempt + 1);
            }
            throw e;
          } finally {
            clearTimeout(timeout);
          }
        };

        await doFetch(1);
      } catch (e) {
        const error = e as any;
        const errorCode = typeof error?.message === 'string' ? error.message : 'SYNC_FAILED';
        const status = typeof error?.status === 'number' ? error.status : undefined;
        console.error({ ...logBase, event: 'PASSENGERS_SYNC_FAIL', error_code: errorCode, status });

        const cached = safeParseJson(localStorage.getItem(cacheKey));
        const cachedContacts = Array.isArray(cached?.contacts) ? cached.contacts : null;
        if (cachedContacts && cachedContacts.length > 0) {
          setContacts(cachedContacts);
          setSyncError('网络异常，已展示最近一次缓存联系人');
          console.info({ ...logBase, event: 'PASSENGERS_SYNC_CACHE_HIT', count: cachedContacts.length });
          return;
        }

        setContacts(fallbackContacts);
        setPassengers(prev => prev.filter(p => fallbackContacts.some((m: any) => m.passenger_id === p.passenger_id)));
        if (status === 401 || status === 403) setSyncError('登录已过期，请重新登录');
        else setSyncError('获取联系人失败，请检查网络或稍后重试');
      } finally {
        setIsSyncing(false);
      }
    };

    // Expose fetchContacts to global scope for button click
    (window as any).refreshContacts = fetchContacts;

    (async () => {
      const touched = await touchSession();
      if (touched.ok) {
        try { localStorage.setItem('TM_AUTH_BASE', touched.base); } catch (e) {}
        await tryFetchProfile(touched.base);
      } else {
        for (const base of authBases) {
          if (await tryFetchProfile(base)) break;
        }
      }
      
      await fetchContacts();
      try {
        const raw = localStorage.getItem(seatsCacheKeyBase(sid));
        if (raw) {
          const data = JSON.parse(raw);
          if (Array.isArray(data)) setSelectedSeats(data);
        }
      } catch (e) {}
    })();
  }, []);

  const handleRefresh = () => {
    if ((window as any).refreshContacts) {
      (window as any).refreshContacts();
    }
  };

  const openSeatSelection = () => {
    setMessage('');
    if (passengers.length === 0) {
      setMessage('请选择乘车人');
      return;
    }
    if (isSubmitting) return;
    setShowSeat(true);
  };

  const handleSeatConfirm = async (seats: any[]) => {
    if (isSubmitting) return;
    setSelectedSeats(seats);
    try {
      const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
      localStorage.setItem(seatsCacheKeyBase(sid), JSON.stringify(seats));
    } catch (e) {}
    setShowSeat(false);
    setMessage(`已选择座位：${seats.map(s => `${s.carriage_no}车${s.seat_no}`).join('、')}`);
  };

  const submitOrder = async (locks?: any[]) => {
    setMessage('');
    try {
      const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
      const locksToUse = locks || seatLocks;
      
      const orderData = {
        train_id: trainId,
        travel_date: travelDate,
        from_station: fromStation,
        to_station: toStation,
        passengers: passengers,
        seat_locks: locksToUse.map(lock => ({ 
          lock_token: lock.lock_token,
          seat_no: lock.seat_no,
          carriage_no: lock.carriage_no
        }))
      };
      
      const res = await fetch('http://localhost:3001/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sid}`
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.status === 201) {
        const orderId = String(data.order_id || '').trim();
        if (!orderId) {
          setMessage('提交订单失败');
          return;
        }
        try {
          const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
          localStorage.removeItem(seatsCacheKeyBase(sid));
        } catch (e) {}
        setSelectedSeats([]);
        setSeatLocks([]);
        window.location.hash = `#payment?order_id=${orderId}&sid=${encodeURIComponent(sid)}`;
      } else {
        setMessage('提交订单失败');
      }
    } catch (e) {
      setMessage('网络错误');
    }
  };

  const togglePassenger = (p: any) => {
    setPassengers(prev => {
      const exists = prev.some(x => x.passenger_id === p.passenger_id);
      const next = exists ? prev.filter(x => x.passenger_id !== p.passenger_id) : [...prev, p];
      return next;
    });
  };

  const startSubmit = () => {
    setMessage('');
    if (passengers.length === 0) {
      setMessage('请选择乘车人');
      return;
    }
    if (!selectedSeats || selectedSeats.length === 0 || selectedSeats.length !== passengers.length) {
      setMessage('请先选择座位');
      return;
    }
    if (isSubmitting) return;
    setShowWarmTip(true);
  };

  const proceedSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
      const res = await fetch('http://localhost:3001/api/v1/seats/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sid}` },
        body: JSON.stringify({ train_id: trainId, travel_date: travelDate, seats: selectedSeats })
      });
      if (res.ok) {
        const data = await res.json();
        const locks = data.locks || [];
        setSeatLocks(locks);
        await submitOrder(locks);
      } else {
        setMessage('锁座失败，座位可能已被占用，请重新选择');
      }
    } catch (e) {
      setMessage('网络错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="order-filling-page">
      <div className="header">
        <h1>订单填写</h1>
      </div>
      
      <div className="train-info">
        <h3>{trainId}次列车</h3>
        <p>{fromStation}→{toStation}</p>
        <div>{travelDate}</div>
      </div>

      <div className="passenger-selection">
        <div className="section-header">
            <h3>常用联系人</h3>
            <div className="actions">
                <button onClick={handleRefresh} disabled={isSyncing} className="refresh-btn">
                    {isSyncing ? '刷新中...' : '刷新列表'}
                </button>
                {syncError && <span className="error-text" style={{color: 'red', marginLeft: '10px', fontSize: '12px'}}>{syncError}</span>}
            </div>
        </div>
        <div style={{ display: 'flex', gap: 16, fontWeight: 600, marginBottom: 8 }}>
          <div>证件类型</div>
          <div>证件号</div>
        </div>
        <div className="contacts-list">
          {contacts.length === 0 && <div style={{padding: '10px', color: '#666'}}>暂无常用联系人，请到个人中心添加</div>}
          {contacts.map(c => (
            <label key={c.passenger_id} className="contact-item">
              <input 
                type="checkbox" 
                checked={!!passengers.find(x => x.passenger_id === c.passenger_id)}
                onChange={() => togglePassenger(c)}
                aria-label={c.passenger_id === (contacts[0]?.passenger_id) ? '选择乘车人' : undefined}
              />
              <span>{`${c.name} (${c.masked_id_number || ''})`}</span>
              <span>{c.id_type}</span>
            </label>
          ))}
        </div>
      </div>

      {message && <div className="msg-box">{message}</div>}

      <div className="actions">
        <button className="btn-secondary" onClick={openSeatSelection} disabled={isSubmitting}>{selectedSeats.length > 0 ? '修改座位' : '选择座位'}</button>
        <button className="btn-primary" onClick={startSubmit} disabled={isSubmitting}>提交订单</button>
      </div>

      {selectedSeats.length > 0 && (
        <div style={{ marginTop: 12, padding: 10, background: '#f0f9ff', borderRadius: 4, border: '1px solid #91d5ff' }}>
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 4, color: '#1890ff' }}>已选座位：</div>
          <div style={{ fontSize: 13, color: '#333' }}>{selectedSeats.map((s: any) => `${s.carriage_no}车${s.seat_no}`).join('、')}</div>
          <div style={{ marginTop: 8 }}>
            <button 
              onClick={() => {
                setSelectedSeats([]);
                setSeatLocks([]);
                try {
                  const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
                  localStorage.removeItem(seatsCacheKeyBase(sid));
                } catch (e) {}
              }}
              className="btn-secondary"
            >清空选座</button>
          </div>
        </div>
      )}

      {showWarmTip && (
        <WarmTipModal 
          onConfirm={() => {
            setShowWarmTip(false);
            proceedSubmit();
          }} 
          onCancel={() => setShowWarmTip(false)} 
        />
      )}

      {showSeat && (
        <SeatSelectionModal 
          trainId={trainId}
          travelDate={travelDate}
          passengerCount={passengers.length}
          onConfirm={handleSeatConfirm}
          onCancel={() => setShowSeat(false)}
        />
      )}
    </div>
  );
}
