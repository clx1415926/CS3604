import React, { useEffect, useState, useRef } from 'react';

interface Order {
  order_id: string;
  booked_at: string;
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

export default function OrderCenter() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [highlightId, setHighlightId] = useState('');
  const orderRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    // Extract orderId from hash query params
    const hash = window.location.hash;
    const match = hash.match(/[?&]orderId=([^&]+)/);
    if (match) {
      setHighlightId(match[1]);
    }

    // Extract SID from URL to ensure login state
    const mSid = hash.match(/[?&]sid=([^&]+)/);
    if (mSid) {
      const sid = decodeURIComponent(mSid[1]);
      localStorage.setItem('SESSION_ID', sid);
    }

    fetchOrders();
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
      const sid = localStorage.getItem('SESSION_ID');
      if (!sid) {
        setError('请先登录');
        setLoading(false);
        return;
      }

      const res = await fetch('http://localhost:3001/api/v1/orders', {
        headers: {
          'Authorization': `Bearer ${sid}`
        }
      });

      if (!res.ok) {
        if (res.status === 401) setError('登录已过期');
        else setError('获取订单失败');
      } else {
        const data = await res.json();
        const list = data.orders || [];
        // Debug: 查看订单数据
        console.log('📦 订单数据:', JSON.stringify(list, null, 2));
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

  if (loading) return <div style={{ padding: 20 }}>加载中...</div>;
  if (error) return <div style={{ padding: 20, color: 'red' }}>{error}</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ fontSize: 20, marginBottom: 20 }}>火车票订单</h2>
      {orders.length === 0 ? (
        <div>暂无订单</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {orders.map(order => (
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
                  <span style={{ fontWeight: 'bold', marginRight: 12 }}>{order.booked_at.split('T')[0]}</span>
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

                <div style={{ flex: 1, textAlign: 'right', fontWeight: 'bold', color: '#f60', fontSize: 18 }}>
                  ¥{order.price_total}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
