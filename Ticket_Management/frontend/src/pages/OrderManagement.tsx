import React from 'react';
import '../index.css';

export default function OrderManagement() {
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
          <div>订票日期</div>
          <div>车次号</div>
          <div>乘客姓名</div>
          <div>席别</div>
          <div>价格</div>
          <button className="btn-primary">取消订单</button>
        </div>
      </div>
    </>
  );
}