import React, { useEffect, useState } from 'react';
import '../index.css';

export default function OrderManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch('http://localhost:3001/api/v1/orders?status=unpaid');
        if (r.ok) {
          const data = await r.json();
          if (Array.isArray(data.orders)) setOrders(data.orders);
        }
      } catch (e) {}
    })();
  }, []);
  const o = orders[0] || null;
  return (
    <>
      <header className="site-header">
        <div className="container">
          <div className="brand">
            <span className="logo">◎</span>
            <span className="title">中国铁路12306</span>
          </div>
          <nav className="nav">
            <a href="#">首页</a>
            <a href="#">客运首页</a>
            <a href="#" className="active">车票</a>
          </nav>
        </div>
      </header>
      <div className="page">
        <div className="section-title">未完成订单</div>
        <div className="order-card">
          <div><span>订票日期</span><span>：{o ? new Date(o.booked_at).toLocaleString() : ''}</span></div>
          <div><span>车次号</span><span>：{o ? o.train.code : ''}</span></div>
          <div><span>乘客姓名</span><span>：{o ? (o.passengers || []).map((p: any) => p.name).join('、') : ''}</span></div>
          <div><span>席别</span><span>：{o ? (o.seats || []).map((s: any) => s.seat_class).join('、') : ''}</span></div>
          <div><span>价格</span><span>：{o ? `¥${Number(o.price_total).toFixed(2)}` : ''}</span></div>
          <button className="btn-primary">取消订单</button>
        </div>
      </div>
    </>
  );
}