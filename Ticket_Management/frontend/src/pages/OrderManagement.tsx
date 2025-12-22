import React, { useEffect, useMemo, useState } from 'react';
const HOME_URL: string = (import.meta as any).env?.VITE_HOME_URL || 'http://localhost:8080/';
import '../index.css';

export default function OrderManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [sid, setSid] = useState<string | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const hash = window.location.hash || '';
  const hashQuery = (() => { const i = hash.indexOf('?'); return i >= 0 ? hash.slice(i + 1) : ''; })();
  const paramsHash = useMemo(() => new URLSearchParams(hashQuery), []);
  const paramsSearch = useMemo(() => new URLSearchParams(window.location.search || ''), []);
  const getParam = (name: string) => paramsHash.get(name) || paramsSearch.get(name);
  const prebook = getParam('prebook') === '1';
  const preTrain = {
    code: getParam('trainNo') || '',
    from: getParam('fromStation') || '',
    to: getParam('toStation') || '',
    date: getParam('date') || '',
  };
  const [seatClass, setSeatClass] = useState<string>('二等座');
  const [passengerName, setPassengerName] = useState<string>('本人');
  const [filterTrain, setFilterTrain] = useState<string>('');
  const [filterDate, setFilterDate] = useState<string>('');

  useEffect(() => {
    try {
      const pSearch = new URLSearchParams(window.location.search || '');
      const pHash = new URLSearchParams(hashQuery);
      const sidParam = pHash.get('sid') || pSearch.get('sid');
      let s = sidParam || localStorage.getItem('SESSION_ID') || null;
      if (sidParam) {
        try { localStorage.setItem('SESSION_ID', sidParam); } catch (e) {}
        const clean = window.location.origin + window.location.pathname + window.location.hash;
        window.history.replaceState({}, document.title, clean);
      }
      setSid(s || null);
    } catch (e) { setSid(null); }
  }, []);

  async function refreshOrders() {
    try {
      const r = await fetch('http://localhost:3001/api/v1/orders', { headers: sid ? { Authorization: 'Bearer ' + sid } : {} });
      if (r.ok) {
        const data = await r.json();
        if (Array.isArray(data.orders)) setOrders(data.orders);
      }
    } catch (e) {}
  }

  useEffect(() => { if (sid !== undefined) { refreshOrders(); } }, [sid]);

  const filtered = orders.filter(o => {
    const byTrain = filterTrain ? String(o.train?.code || '').includes(filterTrain) : true;
    const byDate = filterDate ? String(o.travel_date || o.booked_at || '').slice(0, 10) === filterDate : true;
    return byTrain && byDate;
  });

  async function submitOrder() {
    if (!sid) return alert('请先登录');
    const payload = {
      train_id: preTrain.code,
      travel_date: preTrain.date,
      from_station: preTrain.from,
      to_station: preTrain.to,
      passengers: [{ name: passengerName }],
      seat_locks: [{ lock_token: seatClass }],
    };
    const r = await fetch('http://localhost:3001/api/v1/orders', {
      method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + sid }, body: JSON.stringify(payload)
    });
    if (r.status === 201) { await refreshOrders(); alert('下单成功'); }
    else { const t = await r.text(); alert('下单失败：' + (t || r.status)); }
  }

  async function doCancel(id: string) {
    const r = await fetch(`http://localhost:3001/api/v1/orders/${id}/cancel`, { method: 'POST', headers: sid ? { Authorization: 'Bearer ' + sid } : {} });
    if (r.ok) {
      setCancelTarget(null);
      setShowSuccess(true);
      await refreshOrders();
    } else {
      try {
        const data = await r.json();
        if (r.status === 429 || data?.error === 'CANCEL_RATE_LIMIT_EXCEEDED') {
          alert('您今日取消订单次数已达上限，无法继续购票');
          return;
        }
        if (r.status === 400 || data?.error === 'INVALID_ORDER_STATE') {
          alert('当前订单不可取消');
          return;
        }
        if (r.status === 404 || data?.error === 'ORDER_NOT_FOUND') {
          alert('订单不存在或已处理');
          return;
        }
      } catch (e) {
      }
      alert('取消失败');
    }
  }

  return (
    <>
      <header className="site-header">
        <div className="container">
          <div className="brand">
            <span className="logo">◎</span>
            <span className="title">中国铁路12306</span>
          </div>
          <nav className="nav">
            <a href={HOME_URL}>首页</a>
          </nav>
        </div>
      </header>
      <div className="page">
        {getParam('loginRequired') === '1' && (
          <div className="order-card" style={{ marginBottom: 16 }}>未登录，无法预订</div>
        )}
        {prebook && (
          <div className="order-card" style={{ marginBottom: 16 }}>
            <div className="section-title">预订信息确认</div>
            <div><span>车次号</span><span>：{preTrain.code}</span></div>
            <div><span>出发站</span><span>：{preTrain.from}</span></div>
            <div><span>到达站</span><span>：{preTrain.to}</span></div>
            <div><span>乘车日期</span><span>：{preTrain.date}</span></div>
            <div style={{ marginTop: 8 }}>
              <label>席别：</label>
              <select value={seatClass} onChange={e => setSeatClass(e.target.value)}>
                <option>二等座</option>
                <option>一等座</option>
                <option>商务座</option>
              </select>
            </div>
            <div style={{ marginTop: 8 }}>
              <label>乘客姓名：</label>
              <input value={passengerName} onChange={e => setPassengerName(e.target.value)} />
            </div>
            <button className="btn-primary" style={{ marginTop: 12 }} onClick={submitOrder}>提交订单</button>
          </div>
        )}

        <div className="section-title">未完成订单</div>
        <div className="filters-row" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
          <input placeholder="按车次号筛选" value={filterTrain} onChange={e => setFilterTrain(e.target.value)} />
          <input placeholder="按日期筛选 YYYY-MM-DD" value={filterDate} onChange={e => setFilterDate(e.target.value)} />
          <button className="btn-primary" onClick={refreshOrders}>刷新</button>
        </div>
        {filtered.length === 0 && <div className="order-card">暂无订单</div>}
        {filtered.map((o: any) => (
          <div className="order-card" key={o.order_id} style={{ marginBottom: 12 }}>
            <div><span>订单号</span><span>：{o.order_id}</span></div>
            <div><span>乘车日期</span><span>：{String(o.travel_date || o.booked_at || '').slice(0, 10) || '-'}</span></div>
            <div><span>车次号</span><span>：{o.train?.code}</span></div>
            <div><span>乘客姓名</span><span>：{(o.passengers || []).map((p: any) => p.name).join('、')}</span></div>
            <div><span>席别</span><span>：{(o.seats || []).map((s: any) => s.seat_class).join('、')}</span></div>
            <div><span>价格</span><span>：{`¥${Number(o.price_total).toFixed(2)}`}</span></div>
            <div><span>状态</span><span>：{o.status}</span></div>
            <div style={{ marginTop: 8, display: 'flex', gap: 8 }}>
              <button className="btn-cancel" onClick={() => setCancelTarget(o.order_id)}>取消订单</button>
              {o.status === 'unpaid' && <button className="btn-primary" onClick={() => window.location.hash = `#payment?order_id=${o.order_id}`}>去支付</button>}
            </div>
          </div>
        ))}
      </div>
      
      {cancelTarget && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <span>提示</span>
              <span className="modal-close" onClick={() => setCancelTarget(null)}>×</span>
            </div>
            <div className="modal-body">
              <div className="modal-icon">⚠</div>
              <div>
                <div style={{ fontWeight: 'bold', marginBottom: 8 }}>您确认取消订单吗？</div>
                <div style={{ color: '#666', lineHeight: '1.5' }}>一天内3次申请车票成功后取消订单（包含无座票时取消5次计为取消1次），当日将不能在12306继续购票。</div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-cancel" onClick={() => setCancelTarget(null)}>取消</button>
              <button className="btn-primary" onClick={() => doCancel(cancelTarget!)}>确定</button>
            </div>
          </div>
        </div>
      )}

      {showSuccess && (
        <div className="modal-backdrop">
          <div className="modal-container">
            <div className="modal-header">
              <span>提示</span>
              <span className="modal-close" onClick={() => setShowSuccess(false)}>×</span>
            </div>
            <div className="modal-body">
              <div className="modal-icon success">✔</div>
              <div style={{ fontSize: '16px', marginTop: 4, fontWeight: 'bold' }}>取消订单成功</div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowSuccess(false)}>确定</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
