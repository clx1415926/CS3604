import React, { useEffect, useState } from 'react';

export default function Payment() {
  const [orderId, setOrderId] = useState<string>('');
  const [message, setMessage] = useState<string>('');

  useEffect(() => {
    const h = window.location.hash || '';
    const m = h.match(/order_id=([^&]+)/);
    setOrderId((m ? decodeURIComponent(m[1]) : 'o-001').trim());
  }, []);

  const pay = async () => {
    setMessage('');
    try {
      const h = window.location.hash || '';
      const mSid = h.match(/sid=([^&]+)/);
      const sidRaw = (mSid ? decodeURIComponent(mSid[1]) : (localStorage.getItem('SESSION_ID') || '')).trim();
      if (!sidRaw) { setMessage('未登录'); return; }
      const sid = sidRaw;
      try { localStorage.setItem('SESSION_ID', sid); } catch (e) {}
      const r = await fetch(`http://localhost:3001/api/v1/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sid}` },
      });
      const data = await r.json();
      if (r.ok) {
        setMessage('支付成功');
        setTimeout(() => { window.location.hash = ''; }, 800);
      } else {
        setMessage(data && data.error ? String(data.error) : '支付失败');
      }
    } catch {
      setMessage('支付失败');
    }
  };

  return (
    <div className="page">
      <div className="section-title">订单支付</div>
      <div className="order-card">
        <div>订单号：{orderId}</div>
        <div>金额：¥576.00</div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button className="btn-primary" onClick={pay}>立即支付</button>
        <div>{message}</div>
      </div>
    </div>
  );
}
