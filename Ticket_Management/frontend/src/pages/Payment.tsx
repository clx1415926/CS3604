import React, { useEffect, useState } from 'react';

console.log('🎯 Payment.tsx 模块已加载');

export default function Payment() {
  console.log('🎯 Payment 组件被渲染');
  
  const [orderId, setOrderId] = useState<string>('');
  const [orderAmount, setOrderAmount] = useState<string>('0.00');
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [message, setMessage] = useState<string>('');
  const [isNavigating, setIsNavigating] = useState<boolean>(false);

  useEffect(() => {
    console.log('🎯 Payment useEffect 执行');
    const h = window.location.hash || '';
    console.log('🎯 初始化时的 hash:', h);
    const m = h.match(/order_id=([^&]+)/);
    const extractedOrderId = (m ? decodeURIComponent(m[1]) : 'o-001').trim();
    console.log('🎯 提取的订单ID:', extractedOrderId);
    setOrderId(extractedOrderId);
    
    // 获取订单详情
    if (extractedOrderId) {
      fetchOrderDetails(extractedOrderId, h);
    }
  }, []);
  
  const fetchOrderDetails = async (oid: string, hash: string) => {
    try {
      const mSid = hash.match(/sid=([^&]+)/);
      const sid = (mSid ? decodeURIComponent(mSid[1]) : (localStorage.getItem('SESSION_ID') || '')).trim();
      
      if (!sid) {
        console.log('未找到 session ID');
        return;
      }
      
      console.log('正在获取订单详情:', oid, 'sid:', sid);
      const response = await fetch(`http://localhost:3001/api/v1/orders/${oid}`, {
        headers: { Authorization: `Bearer ${sid}` }
      });
      
      console.log('订单详情响应状态:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('订单详情响应数据:', data);
        
        // 后端返回的格式是 { order: {...} }
        const orderData = data.order || data;
        console.log('解析后的订单数据:', orderData);
        console.log('订单座位信息:', orderData.seats);
        console.log('订单价格信息:', orderData.price_total);
        
        setOrderDetails(orderData);
        
        if (orderData.price_total !== undefined && orderData.price_total !== null) {
          const amount = Number(orderData.price_total).toFixed(2);
          setOrderAmount(amount);
          console.log('设置订单金额:', amount);
        } else {
          console.error('订单数据中没有price_total字段');
        }
      } else {
        console.error('获取订单详情失败，状态码:', response.status);
        const errorText = await response.text();
        console.error('错误响应:', errorText);
      }
    } catch (error) {
      console.error('获取订单详情失败:', error);
    }
  };

  const pay = async () => {
    console.log('=== 支付流程开始 ===');
    setMessage('');
    try {
      const h = window.location.hash || '';
      console.log('1. 当前 URL hash:', h);
      
      const mSid = h.match(/sid=([^&]+)/);
      const sid = (mSid ? decodeURIComponent(mSid[1]) : (localStorage.getItem('SESSION_ID') || 'sess-super-12306')).trim();
      console.log('2. 提取的 session ID:', sid);
      console.log('3. 使用的 orderId:', orderId);
      
      try { localStorage.setItem('SESSION_ID', sid); } catch (e) {}
      
      const apiUrl = `http://localhost:3001/api/v1/orders/${orderId}/pay`;
      console.log('4. 调用支付接口:', apiUrl);
      console.log('5. 请求头 Authorization:', `Bearer ${sid}`);
      
      const r = await fetch(apiUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${sid}` },
      });
      
      console.log('6. 响应状态码:', r.status);
      console.log('7. 响应 ok 状态:', r.ok);
      
      const data = await r.json();
      console.log('8. 响应数据:', data);
      
      if (r.ok) {
        console.log('9. 支付成功分支');
        setMessage('支付成功，正在跳转...');
        console.log('10. 已设置消息: 支付成功，正在跳转...');
        
        setTimeout(() => {
          const target = `http://localhost:5176/#/otn/view/train_order.html?orderId=${orderId}&sid=${encodeURIComponent(sid)}`;
          console.log('11. 准备跳转到:', target);
          window.location.href = target;
          console.log('12. 跳转命令已执行');
        }, 800);
        console.log('13. 已设置 800ms 后跳转的定时器');
      } else {
        console.log('14. 支付失败分支');
        const errMsg = data && data.error ? String(data.error) : '支付失败';
        console.log('15. 错误信息:', errMsg);
        setMessage(errMsg);
      }
    } catch (error) {
      console.error('16. 捕获异常:', error);
      setMessage('支付失败');
    }
    console.log('=== 支付流程结束 ===');
  };

  const deferPay = () => {
    setMessage('');
    setIsNavigating(true);
    const h = window.location.hash || '';
    const mSid = h.match(/sid=([^&]+)/);
    const sid = (mSid ? decodeURIComponent(mSid[1]) : (localStorage.getItem('SESSION_ID') || 'sess-super-12306')).trim();
    try { localStorage.setItem('SESSION_ID', sid); } catch (e) {}
    const target = `http://localhost:5176/#/otn/view/train_order.html?sid=${encodeURIComponent(sid)}`;
    window.location.href = target;
    const MODE = (import.meta as any).env?.MODE || (import.meta as any).env?.NODE_ENV || '';
    if (String(MODE).toLowerCase() === 'test') {
      window.location.hash = '#';
    }
  };

  return (
    <div className="page" aria-busy={isNavigating} aria-live="polite">
      <div className="section-title">订单支付</div>
      <div className="order-card">
        <div>订单号：{orderId}</div>
        <div>金额：¥{orderAmount}</div>
        {orderDetails && (
          <>
            <div>车次：{orderDetails.train?.code || '-'}</div>
            <div>乘车日期：{orderDetails.travel_date || '-'}</div>
            <div>出发站：{orderDetails.train?.from || '-'}</div>
            <div>到达站：{orderDetails.train?.to || '-'}</div>
            <div>座位信息：{(orderDetails.seats || []).map((s: any) => `${s.carriage_no}车${s.seat_no}(${s.seat_class})`).join('、') || '-'}</div>
            <div>乘客：{(orderDetails.passengers || []).map((p: any) => p.name).join('、') || '-'}</div>
          </>
        )}
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
        <button className="btn-primary" disabled={isNavigating} onClick={() => {
          console.log('🔴 立即支付按钮被点击！');
          pay();
        }}>立即支付</button>
        <button className="btn-secondary" disabled={isNavigating} onClick={deferPay}>稍后支付</button>
        <div>{message}</div>
      </div>
      {isNavigating && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ padding: 16, background: '#fff', border: '1px solid #eee', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 14 }}>
            正在跳转订单中心...
          </div>
        </div>
      )}
    </div>
  );
}
