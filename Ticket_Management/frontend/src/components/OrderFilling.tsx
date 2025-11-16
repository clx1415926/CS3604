import React from 'react';
import '../index.css';

export default function OrderFilling() {
  return (
    <div className="page">
      <div className="order-card">
        <div>G123</div>
        <div>北京南→上海虹桥</div>
        <div>出发时间</div>
      </div>
      <div className="panel">
        <div>常用联系人</div>
        <div>证件类型</div>
        <div>证件号</div>
      </div>
      <button className="btn-primary" disabled>提交订单</button>
    </div>
  );
}