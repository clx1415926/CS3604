import React, { useEffect, useState, useRef } from 'react';
import './OrderCenter.css';

interface Order {
  order_id: string;
  booked_at: string;
  travel_date?: string | null;
  train: {
    code: string;
    from: string;
    to: string;
    depart_time: string;
    arrive_time: string;
  };
  passengers: { name: string }[];
  seats: { seat_class: string; carriage_no: string; seat_no: string }[];
  price_total: number;
  status: string;
}

function formatDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export default function OrderCenter() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sid, setSid] = useState('');
  const [highlightId, setHighlightId] = useState('');
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const orderRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const renewTimerRef = useRef<number | null>(null);
  const [activeTab, setActiveTab] = useState<'unfinished' | 'upcoming' | 'history'>('unfinished');
  const today = formatDate(new Date());
  const [startDate, setStartDate] = useState(today);
  const [endDate, setEndDate] = useState(today);
  const [query, setQuery] = useState('');

  const getOrderDisplayDate = (order: Order) => {
    if (order.travel_date) return String(order.travel_date).slice(0, 10);
    return String(order.booked_at || '').slice(0, 10);
  };

  // Unified SID reader: hash (?sid=...), search (?sid=...), session/local storage
  const getSid = () => {
    const fromHash = (() => {
      const h = window.location.hash || '';
      const m = h.match(/sid=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : '';
    })();
    const fromSearch = (() => {
      const s = window.location.search || '';
      const m = s.match(/sid=([^&]+)/);
      return m ? decodeURIComponent(m[1]) : '';
    })();
    const fromSession = sessionStorage.getItem('session_id') || '';
    const fromLocal = localStorage.getItem('SESSION_ID') || '';
    const sid = fromHash || fromSearch || fromSession || fromLocal;
    if (sid) { try { localStorage.setItem('SESSION_ID', sid); } catch (e) {} }
    return sid;
  };

  const markExpired = (reason: string) => {
    const text = '登录已过期，请重新登录';
    console.info({ ts: new Date().toISOString(), event: 'UC_SESSION_EXPIRED', reason });
    setError(text);
    try { sessionStorage.setItem('UC_ERROR_TEXT', text); } catch (e) {}
    try { window.dispatchEvent(new CustomEvent('uc:auth-changed', { detail: { sid: '', logged_in: false } })); } catch (e) {}
  };

  const renewSession = async (reason: string) => {
    const sidNow = getSid();
    setSid(sidNow);
    if (!sidNow) {
      markExpired('missing_sid');
      return false;
    }

    const bases = ['http://localhost:8080/api/v1', 'http://localhost:8081/api/v1', 'http://127.0.0.1:8082/api/v1'];
    let sawUnauthorized = false;
    for (const base of bases) {
      const controller = new AbortController();
      const timeout = window.setTimeout(() => controller.abort(), 2500);
      try {
        const r = await fetch(`${base}/auth/session`, {
          headers: { Authorization: `Bearer ${sidNow}` },
          signal: controller.signal,
        });
        if (r.status === 401) {
          sawUnauthorized = true;
          continue;
        }
        if (r.ok) {
          console.info({ ts: new Date().toISOString(), event: 'UC_SESSION_RENEW_OK', base, reason });
          try { localStorage.setItem('UC_AUTH_BASE', base); } catch (e) {}
          try { window.dispatchEvent(new CustomEvent('uc:auth-changed', { detail: { sid: sidNow, logged_in: true, base } })); } catch (e) {}
          return true;
        }
      } catch (e) {
      } finally {
        clearTimeout(timeout);
      }
    }

    if (sawUnauthorized) markExpired('renew_unauthorized');
    return false;
  };

  useEffect(() => {
    // Extract orderId from hash query params
    const hash = window.location.hash;
    const match = hash.match(/[?&]orderId=([^&]+)/);
    if (match) {
      setHighlightId(match[1]);
    }

    // Ensure SID is captured from hash/search and persisted locally
    const sidNow = getSid();
    setSid(sidNow);

    renewSession('mount');
    if (renewTimerRef.current) window.clearInterval(renewTimerRef.current);
    renewTimerRef.current = window.setInterval(() => {
      renewSession('interval');
    }, 5 * 60 * 1000);

    fetchOrders();

    return () => {
      if (renewTimerRef.current) window.clearInterval(renewTimerRef.current);
      renewTimerRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (highlightId && orders.length > 0) {
      const el = orderRefs.current[highlightId];
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add a temporary highlight effect
        el.style.backgroundColor = '#fffbeb';
        setTimeout(() => {
          el.style.backgroundColor = '';
        }, 3000);
      }
    }
  }, [highlightId, orders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Get session ID
      const sid = getSid();
      setSid(sid);
      if (!sid) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      await renewSession('fetch_orders');

      const res = await fetch('http://localhost:8083/api/v1/orders', {
        headers: {
          'Authorization': `Bearer ${sid}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) markExpired('orders_401');
        else setError('获取订单失败');
      } else {
        const data = await res.json();
        const list = data.orders || [];
        console.info({ ts: new Date().toISOString(), event: 'UC_ORDERS_LOADED', count: Array.isArray(list) ? list.length : 0 });
        // Sort by booked_at desc
        const sorted = list.sort((a: Order, b: Order) => 
          new Date(b.booked_at).getTime() - new Date(a.booked_at).getTime()
        );
        setOrders(sorted);
      }
    } catch (e) {
      setError('网络异常');
    } finally {
      setLoading(false);
    }
  };

  async function doCancel(id: string) {
    const sid = getSid();
    setSid(sid);
    if (!sid) {
      markExpired('cancel_missing_sid');
      return;
    }
    await renewSession('cancel');
    try {
      const r = await fetch(`http://localhost:3001/api/v1/orders/${id}/cancel`, { method: 'POST', headers: sid ? { Authorization: 'Bearer ' + sid } : {} });
      if (r.ok) {
        setCancelTarget(null);
        setShowSuccess(true);
        await fetchOrders();
        return;
      }
      const data = await r.json().catch(() => ({} as any));
      setCancelTarget(null);
      if (r.status === 401) {
        markExpired('cancel_401');
        return;
      }
      if (r.status === 429 || data?.error === 'CANCEL_RATE_LIMIT_EXCEEDED') {
        setError('您今日取消订单次数已达上限，无法继续购票');
        return;
      }
      if (r.status === 400 || data?.error === 'INVALID_ORDER_STATE') {
        setError('当前订单不可取消');
        return;
      }
      if (r.status === 404 || data?.error === 'ORDER_NOT_FOUND') {
        setError('订单不存在或已处理');
        return;
      }
      setError('取消订单失败，请稍后重试');
    } catch (e) {
      setCancelTarget(null);
      setError('网络异常');
    }
  }

  function inDateRange(order: Order) {
    try {
      const base = order.travel_date || order.booked_at;
      const t = new Date(String(base).includes('T') ? String(base) : `${String(base)}T00:00:00`).getTime();
      if (startDate) {
        const s = new Date(startDate);
        s.setHours(0, 0, 0, 0);
        if (t < s.getTime()) return false;
      }
      if (endDate) {
        const e = new Date(endDate);
        e.setHours(23, 59, 59, 999);
        if (t > e.getTime()) return false;
      }
      return true;
    } catch {
      return true;
    }
  }

  function matchQuery(order: Order) {
    const q = query.trim();
    if (!q) return true;
    if (order.order_id.includes(q)) return true;
    if (order.train.code.includes(q)) return true;
    if (order.passengers.some(p => p.name.includes(q))) return true;
    return false;
  }

  const displayOrders = orders
    .filter(o => {
      if (activeTab === 'unfinished') return o.status === 'unpaid';
      if (activeTab === 'upcoming') return o.status === 'paid';
      return o.status === 'canceled';
    })
    .filter(o => inDateRange(o))
    .filter(o => matchQuery(o));

  if (loading) return <div style={{ padding: 20 }}>加载中...</div>;
  if (error) {
    const toLogin = () => {
      try { sessionStorage.setItem('UC_RETURN_URL', window.location.href); } catch (e) {}
      window.location.href = 'http://localhost:8080/login.html';
    };
    return (
      <div style={{ padding: 20, color: 'red' }}>
        <div style={{ marginBottom: 10 }}>{error}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ padding: '6px 10px', border: '1px solid #dcdfe6', borderRadius: 4, cursor: 'pointer' }} onClick={() => { setError(''); fetchOrders(); }}>重试</button>
          <button style={{ padding: '6px 10px', background: '#ff8a00', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }} onClick={toLogin}>去登录</button>
        </div>
      </div>
    );
  }

  return (
    <div className="order-center">
      <div className="order-tabs">
        <button className={`order-tab ${activeTab === 'unfinished' ? 'active' : ''}`} onClick={() => setActiveTab('unfinished')}>未完成订单</button>
        <button className={`order-tab ${activeTab === 'upcoming' ? 'active' : ''}`} onClick={() => setActiveTab('upcoming')}>未出行订单</button>
        <button className={`order-tab ${activeTab === 'history' ? 'active' : ''}`} onClick={() => setActiveTab('history')}>历史订单</button>
      </div>

      <div className="order-filter-row">
        <span className="order-filter-label">按出行日期查询</span>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="order-filter-date" />
        <span className="order-filter-sep">—</span>
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="order-filter-date" />
        <input className="order-filter-input" placeholder="订单编号/车次/旅客姓名" value={query} onChange={e => setQuery(e.target.value)} />
        <button className="order-filter-btn" onClick={() => { setStartDate(startDate); setEndDate(endDate); setQuery(query); }}>查询</button>
      </div>

      {displayOrders.length === 0 ? (
        <div className="empty-card">
          <div className="empty-content">
            <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
              <rect x="12" y="10" width="32" height="44" rx="4" stroke="#6aa8ff" strokeWidth="2" />
              <circle cx="46" cy="42" r="9" stroke="#6aa8ff" strokeWidth="2" />
              <line x1="51" y1="47" x2="58" y2="54" stroke="#6aa8ff" strokeWidth="2" />
              <line x1="18" y1="20" x2="36" y2="20" stroke="#6aa8ff" strokeWidth="2" />
              <line x1="18" y1="26" x2="32" y2="26" stroke="#6aa8ff" strokeWidth="2" />
            </svg>
            <div className="empty-text">
              <div className="empty-line">您没有{activeTab === 'unfinished' ? '未完成' : activeTab === 'upcoming' ? '未出行' : '历史'}的订单哦～</div>
              <div className="empty-line">您可以通过<a href="http://localhost:5173/index.html" className="empty-link">车票预订</a>功能，来制定出行计划。</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="order-list">
          {displayOrders.map(order => (
            <div
              key={order.order_id}
              ref={el => orderRefs.current[order.order_id] = el}
              style={{
                border: highlightId === order.order_id ? '2px solid #ff9900' : '1px solid #ddd',
                borderRadius: 4,
                padding: 16,
                backgroundColor: '#fff',
                transition: 'background-color 0.5s'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, borderBottom: '1px solid #eee', paddingBottom: 8 }}>
                <div>
                  <span style={{ fontWeight: 'bold', marginRight: 12 }}>{getOrderDisplayDate(order)}</span>
                  <span style={{ color: '#666' }}>订单号：{order.order_id}</span>
                </div>
                <div>
                  <span style={{ 
                    fontWeight: 'bold', 
                    color: order.status === 'paid' ? 'green' : (order.status === 'canceled' ? '#999' : '#f60') 
                  }}>
                    {order.status === 'paid' ? '支付成功' : (order.status === 'canceled' ? '已取消' : '未支付')}
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 4 }}>
                    {order.train.from} → {order.train.to} <span style={{ fontSize: 14, fontWeight: 'normal', color: '#666' }}>({order.train.code})</span>
                  </div>
                  <div style={{ color: '#666' }}>
                    {order.train.depart_time} 开
                  </div>
                </div>
                <div style={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {order.passengers.map((p, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: 12, fontSize: 14 }}>
                      <span style={{ width: 80 }}>{p.name}</span>
                      <span>{order.seats[idx]?.seat_class || order.seats[0]?.seat_class}</span>
                      <span>{order.seats[idx]?.carriage_no || order.seats[0]?.carriage_no}车{order.seats[idx]?.seat_no || order.seats[0]?.seat_no}号</span>
                    </div>
                  ))}
                </div>
                <div style={{ flex: 1, textAlign: 'center', fontWeight: 'bold', color: '#f60', fontSize: 18 }}>
                  ¥{order.price_total}
                </div>
                <div style={{ flex: 1, textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ color: '#999' }}>{order.status === 'paid' ? '支付成功' : (order.status === 'canceled' ? '已取消' : '未支付')}</div>
                  {order.status === 'unpaid' && (
                    <div style={{ display: 'flex', gap: 4 }}>
                      <button 
                        style={{ padding: '4px 8px', background: '#fff', border: '1px solid #dcdfe6', borderRadius: 4, cursor: 'pointer', color: '#666' }} 
                        onClick={() => setCancelTarget(order.order_id)}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = '#c6e2ff'; e.currentTarget.style.color = '#409eff'; e.currentTarget.style.backgroundColor = '#ecf5ff'; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = '#dcdfe6'; e.currentTarget.style.color = '#666'; e.currentTarget.style.backgroundColor = '#fff'; }}
                      >
                        取消订单
                      </button>
                      <a 
                        href={sid ? `http://localhost:5174/#payment?order_id=${order.order_id}&sid=${encodeURIComponent(sid)}` : `http://localhost:5174/#payment?order_id=${order.order_id}`} 
                        style={{ padding: '5px 9px', background: '#ff8a00', border: 'none', borderRadius: 4, cursor: 'pointer', color: '#fff', textDecoration: 'none', fontSize: '13px', display: 'inline-block' }}
                      >
                        去支付
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="hint-panel">
        <div className="hint-title">温馨提示</div>
        <ul className="hint-list">
          <li>未完成订单请在规定时间内完成网上支付。</li>
          <li>如订单成功或取消订单之后，您将无法购买其他车票。</li>
          <li>支付失败或订单异常，请前往人工窗口办理或联系在线客服。</li>
          <li>更多事项详见相关站点公告及客运组织规则。</li>
        </ul>
      </div>

      {cancelTarget && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 4, width: 480, maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden', fontSize: 14 }}>
            <div style={{ padding: '0 16px', height: 40, lineHeight: '40px', background: '#2d7dd2', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>提示</span>
              <span style={{ cursor: 'pointer', fontSize: 20, opacity: 0.8 }} onClick={() => setCancelTarget(null)}>×</span>
            </div>
            <div style={{ padding: '30px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ fontSize: 32, color: '#ffb800', lineHeight: 1 }}>⚠</div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>您确认取消订单吗？</div>
                <div style={{ color: '#666', lineHeight: '1.5' }}>一天内3次申请车票成功后取消订单（包含无座票时取消5次计为取消1次），当日将不能在12306继续购票。</div>
              </div>
            </div>
            <div style={{ padding: '10px 20px 20px', display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button 
                style={{ background: '#fff', color: '#666', border: '1px solid #dcdfe6', padding: '9px 23px', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
                onClick={() => setCancelTarget(null)}
              >
                取消
              </button>
              <button 
                style={{ background: '#ff8a00', color: '#fff', border: 'none', padding: '9px 23px', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
                onClick={() => doCancel(cancelTarget!)}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', borderRadius: 4, width: 480, maxWidth: '90%', boxShadow: '0 4px 12px rgba(0,0,0,0.15)', overflow: 'hidden', fontSize: 14 }}>
            <div style={{ padding: '0 16px', height: 40, lineHeight: '40px', background: '#2d7dd2', color: '#fff', fontSize: 14, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>提示</span>
              <span style={{ cursor: 'pointer', fontSize: 20, opacity: 0.8 }} onClick={() => setShowSuccess(false)}>×</span>
            </div>
            <div style={{ padding: '30px 20px', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ fontSize: 32, color: '#2ecc71', lineHeight: 1 }}>✔</div>
              <div style={{ fontSize: 16, marginTop: 4, fontWeight: 'bold' }}>取消订单成功</div>
            </div>
            <div style={{ padding: '10px 20px 20px', display: 'flex', justifyContent: 'center', gap: 12 }}>
              <button 
                style={{ background: '#ff8a00', color: '#fff', border: 'none', padding: '9px 23px', borderRadius: 4, cursor: 'pointer', fontSize: 14 }}
                onClick={() => setShowSuccess(false)}
              >
                确定
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
