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
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
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

  async function doCancel(id: string) {
    const sid = localStorage.getItem('SESSION_ID');
    const r = await fetch(`http://localhost:3001/api/v1/orders/${id}/cancel`, { method: 'POST', headers: sid ? { Authorization: 'Bearer ' + sid } : {} });
    if (r.ok) {
      setCancelTarget(null);
      setShowSuccess(true);
      await fetchOrders();
    } else {
      alert('取消失败');
    }
  }

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
                        href={`http://localhost:5174/#payment?order_id=${order.order_id}`} 
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
