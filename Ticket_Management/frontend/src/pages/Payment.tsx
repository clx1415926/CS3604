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
      const sid = (mSid ? decodeURIComponent(mSid[1]) : (localStorage.getItem('SESSION_ID') || 'sess-super-12306')).trim();
      try { localStorage.setItem('SESSION_ID', sid); } catch (e) {}
      const r = await fetch(`http://localhost:3001/api/v1/orders/${orderId}/pay`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sid}` },
      });
      const data = await r.json();
      if (r.ok) {
        setMessage('支付成功，正在跳转...');
        setTimeout(() => {
          const target = `http://localhost:5176/#/otn/view/train_order.html?orderId=${orderId}&sid=${encodeURIComponent(sid)}`;
          window.location.href = target;
        }, 800);
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
      <div className="panel">
        <div>支付方式</div>
        <ul>
          <li>支付宝</li>
          <li>微信</li>
          <li>银联</li>
        </ul>
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
        <button className="btn-primary" onClick={pay}>立即支付</button>
        <div>{message}</div>
      </div>
    </div>
  );
}
