import React, { useEffect, useState } from 'react';
import SeatSelectionModal from './SeatSelectionModal';
import WarmTipModal from './WarmTipModal';
import '../index.css';

export default function OrderFilling() {
  const [profile, setProfile] = useState<{ username: string; name: string; user_id?: string } | null>(null);
  const [contacts, setContacts] = useState<any[]>([]);
  const [seatLocks, setSeatLocks] = useState<any[]>([]);
  const [selectedSeats, setSelectedSeats] = useState<any[]>([]);
  const [passengers, setPassengers] = useState<any[]>([]);
  const [message, setMessage] = useState<string>('');
  const [showSeat, setShowSeat] = useState<boolean>(false);
  const [showWarmTip, setShowWarmTip] = useState<boolean>(false);
  const [syncError, setSyncError] = useState<string>('');
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const paramsSearch = new URLSearchParams(window.location.search || '');
  const hash = window.location.hash || '';
  const hashQuery = (() => {
    const i = hash.indexOf('?');
    return i >= 0 ? hash.slice(i + 1) : '';
  })();
  const paramsHash = new URLSearchParams(hashQuery);
  const getParam = (name: string) => paramsHash.get(name) || paramsSearch.get(name);

  const trainId = getParam('trainNo') || 'G123';
  const fromStation = getParam('fromStation') || '北京南';
  const toStation = getParam('toStation') || '上海虹桥';
  const travelDate = getParam('date') || '2025-11-17';

  const seatsCacheKeyBase = (sid: string) => `TM_SELECTED_SEATS:${sid || 'anonymous'}:${trainId}:${travelDate}`;

  const getContactsCacheKey = (sid: string) => `TM_CONTACTS_CACHE:${sid || 'anonymous'}`;
  const contactsCacheTtlMs = 2 * 60 * 1000;

  const safeParseJson = (raw: string | null) => {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch (e) {
      return null;
    }
  };

  const maskIdForDisplay = (id: string) => {
    if (!id) return '';
    if (id.length > 10) return id.slice(0, 6) + '********' + id.slice(-4);
    return id;
  };

  const fallbackContacts = [
    {
      passenger_id: 'p-001',
      name: '张三',
      id_type: '居民身份证',
      id_number: '110101199001011234',
      masked_id_number: '110101********1234',
      verified: true,
    },
  ];

  const normalizePassengers = (data: any) => {
    const list = Array.isArray(data?.passengers) ? data.passengers : [];
    const mapped = list
      .map((p: any) => {
        const passenger_id = typeof p?.passenger_id === 'string' ? p.passenger_id : '';
        const name = typeof p?.name === 'string' ? p.name : '';
        const id_type = typeof p?.id_type === 'string' ? p.id_type : '';
        const id_number = typeof p?.id_number === 'string' ? p.id_number : '';
        const verified_status = typeof p?.verified_status === 'string' ? p.verified_status : '';
        if (!passenger_id || !name) return null;
        return {
          passenger_id,
          name,
          id_type,
          id_number,
          masked_id_number: maskIdForDisplay(id_number),
          verified: verified_status === '已通过',
        };
      })
      .filter(Boolean);
    return mapped as any[];
  };

  useEffect(() => {
    const sidParam = getParam('sid');
    let sid = sidParam || localStorage.getItem('SESSION_ID') || '';
    if (sidParam) { try { localStorage.setItem('SESSION_ID', sidParam); } catch (e) {} sid = sidParam; }
    
    // Check if sid is present
    if (!sid) {
       setSyncError('未检测到登录状态，请先登录');
       setContacts(fallbackContacts); // Or empty? Fallback for now.
       return;
    }

    const authBases = ['http://localhost:8080/api/v1', 'http://localhost:8081/api/v1', 'http://127.0.0.1:8082/api/v1'];

    const touchSession = async () => {
      for (const base of authBases) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 2500);
        try {
          const r = await fetch(`${base}/auth/session`, { headers: { Authorization: `Bearer ${sid}` }, signal: controller.signal });
          if (r.ok) return { ok: true, base };
        } catch (e) {
        } finally {
          clearTimeout(timeout);
        }
      }
      return { ok: false, base: '' };
    };

    const tryFetchProfile = async (base: string) => {
      try {
        const r = await fetch(`${base}/auth/session/profile`, { headers: { Authorization: `Bearer ${sid}` } });
        if (!r.ok) return false;
        const data = await r.json().catch(() => ({}));
        setProfile({ username: data.username, name: data.name, user_id: data.user_id });
        return true;
      } catch (e) {}
      return false;
    };

    const fetchContacts = async () => {
      setIsSyncing(true);
      setSyncError('');

      const logBase = {
        ts: new Date().toISOString(),
        user_id: profile?.user_id,
        sid,
      };

      const cacheKey = getContactsCacheKey(sid);
      const cached = safeParseJson(localStorage.getItem(cacheKey));
      const cachedContacts = Array.isArray(cached?.contacts) ? cached.contacts : null;
      const cachedAt = typeof cached?.saved_at === 'number' ? cached.saved_at : 0;
      const cacheFresh = cachedAt > 0 && Date.now() - cachedAt <= contactsCacheTtlMs;
      if (cacheFresh && cachedContacts && cachedContacts.length > 0) {
        setContacts(cachedContacts);
        setPassengers(prev => prev.filter(p => cachedContacts.some((m: any) => m.passenger_id === p.passenger_id)));
        console.info({ ...logBase, event: 'PASSENGERS_CACHE_APPLIED', count: cachedContacts.length });
      }

      try {
        const doFetch = async (attempt: number) => {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 5000);
          try {
            await touchSession();
            const rc = await fetch('http://localhost:8083/api/v1/passengers?showFull=true', {
              headers: { Authorization: `Bearer ${sid}` },
              signal: controller.signal,
            });
            if (!rc.ok) {
              const error = new Error(`SYNC_HTTP_${rc.status}`);
              (error as any).status = rc.status;
              throw error;
            }
            const data = await rc.json();
            const mapped = normalizePassengers(data);
            try {
              localStorage.setItem(cacheKey, JSON.stringify({ saved_at: Date.now(), contacts: mapped }));
            } catch (e) {}
            setContacts(mapped);
            setPassengers(prev => prev.filter(p => mapped.some(m => m.passenger_id === p.passenger_id)));
            console.info({ ...logBase, event: 'PASSENGERS_SYNC_OK', count: mapped.length, attempt });
          } catch (e) {
            if (attempt < 2) {
              await new Promise(r => setTimeout(r, 300 * attempt));
              return doFetch(attempt + 1);
            }
            throw e;
          } finally {
            clearTimeout(timeout);
          }
        };

        await doFetch(1);
      } catch (e) {
        const error = e as any;
        const errorCode = typeof error?.message === 'string' ? error.message : 'SYNC_FAILED';
        const status = typeof error?.status === 'number' ? error.status : undefined;
        console.error({ ...logBase, event: 'PASSENGERS_SYNC_FAIL', error_code: errorCode, status });

        const cached = safeParseJson(localStorage.getItem(cacheKey));
        const cachedContacts = Array.isArray(cached?.contacts) ? cached.contacts : null;
        if (cachedContacts && cachedContacts.length > 0) {
          setContacts(cachedContacts);
          setSyncError('网络异常，已展示最近一次缓存联系人');
          console.info({ ...logBase, event: 'PASSENGERS_SYNC_CACHE_HIT', count: cachedContacts.length });
          return;
        }

        setContacts(fallbackContacts);
        setPassengers(prev => prev.filter(p => fallbackContacts.some((m: any) => m.passenger_id === p.passenger_id)));
        if (status === 401 || status === 403) setSyncError('登录已过期，请重新登录');
        else setSyncError('获取联系人失败，请检查网络或稍后重试');
      } finally {
        setIsSyncing(false);
      }
    };

    // Expose fetchContacts to global scope for button click
    (window as any).refreshContacts = fetchContacts;

    (async () => {
      const touched = await touchSession();
      if (touched.ok) {
        try { localStorage.setItem('TM_AUTH_BASE', touched.base); } catch (e) {}
        await tryFetchProfile(touched.base);
      } else {
        for (const base of authBases) {
          if (await tryFetchProfile(base)) break;
        }
      }
      
      await fetchContacts();
      try {
        const raw = localStorage.getItem(seatsCacheKeyBase(sid));
        if (raw) {
          const data = JSON.parse(raw);
          if (Array.isArray(data)) setSelectedSeats(data);
        }
      } catch (e) {}
    })();
  }, []);

  const handleRefresh = () => {
    if ((window as any).refreshContacts) {
      (window as any).refreshContacts();
    }
  };

  const openSeatSelection = () => {
    setMessage('');
    if (passengers.length === 0) {
      setMessage('请选择乘车人');
      return;
    }
    if (isSubmitting) return;
    setShowSeat(true);
  };

  // 座位选择确认后直接提交订单
  const handleSeatConfirm = async (seats: any[]) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setSelectedSeats(seats);
    
    try {
      const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
      localStorage.setItem(seatsCacheKeyBase(sid), JSON.stringify(seats));
      
      // 先锁定座位
      const lockRes = await fetch('http://localhost:3001/api/v1/seats/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sid}` },
        body: JSON.stringify({ train_id: trainId, travel_date: travelDate, seats: seats })
      });
      
      if (!lockRes.ok) {
        setShowSeat(false);
        setMessage('锁座失败，座位可能已被占用，请重新选择');
        setIsSubmitting(false);
        return;
      }
      
      const lockData = await lockRes.json();
      const locks = lockData.locks || [];
      setSeatLocks(locks);
      
      // 提交订单
      const orderData = {
        train_id: trainId,
        travel_date: travelDate,
        from_station: fromStation,
        to_station: toStation,
        passengers: passengers,
        seat_locks: locks.map((lock: any) => ({ 
          lock_token: lock.lock_token,
          seat_no: lock.seat_no,
          carriage_no: lock.carriage_no
        }))
      };
      
      const orderRes = await fetch('http://localhost:3001/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sid}`
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await orderRes.json().catch(() => ({}));
      
      if (orderRes.status === 201) {
        const orderId = String(data.order_id || '').trim();
        if (!orderId) {
          setShowSeat(false);
          setMessage('提交订单失败');
          setIsSubmitting(false);
          return;
        }
        try {
          localStorage.removeItem(seatsCacheKeyBase(sid));
        } catch (e) {}
        setSelectedSeats([]);
        setSeatLocks([]);
        setShowSeat(false);
        // 跳转到支付页面
        window.location.hash = `#payment?order_id=${orderId}&sid=${encodeURIComponent(sid)}`;
      } else {
        setShowSeat(false);
        setMessage('提交订单失败');
      }
    } catch (e) {
      setShowSeat(false);
      setMessage('网络错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  const submitOrder = async (locks?: any[]) => {
    setMessage('');
    try {
      const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
      const locksToUse = locks || seatLocks;
      
      const orderData = {
        train_id: trainId,
        travel_date: travelDate,
        from_station: fromStation,
        to_station: toStation,
        passengers: passengers,
        seat_locks: locksToUse.map(lock => ({ 
          lock_token: lock.lock_token,
          seat_no: lock.seat_no,
          carriage_no: lock.carriage_no
        }))
      };
      
      const res = await fetch('http://localhost:3001/api/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sid}`
        },
        body: JSON.stringify(orderData)
      });
      
      const data = await res.json().catch(() => ({}));
      
      if (res.status === 201) {
        const orderId = String(data.order_id || '').trim();
        if (!orderId) {
          setMessage('提交订单失败');
          return;
        }
        try {
          const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
          localStorage.removeItem(seatsCacheKeyBase(sid));
        } catch (e) {}
        setSelectedSeats([]);
        setSeatLocks([]);
        window.location.hash = `#payment?order_id=${orderId}&sid=${encodeURIComponent(sid)}`;
      } else {
        setMessage('提交订单失败');
      }
    } catch (e) {
      setMessage('网络错误');
    }
  };

  const togglePassenger = (p: any) => {
    setPassengers(prev => {
      const exists = prev.some(x => x.passenger_id === p.passenger_id);
      const next = exists ? prev.filter(x => x.passenger_id !== p.passenger_id) : [...prev, p];
      return next;
    });
  };

  // 点击提交订单按钮 -> 打开座位选择弹窗
  const startSubmit = () => {
    setMessage('');
    if (passengers.length === 0) {
      setMessage('请选择乘车人');
      return;
    }
    if (isSubmitting) return;
    // 直接打开座位选择弹窗
    setShowSeat(true);
  };

  const proceedSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
      const res = await fetch('http://localhost:3001/api/v1/seats/lock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${sid}` },
        body: JSON.stringify({ train_id: trainId, travel_date: travelDate, seats: selectedSeats })
      });
      if (res.ok) {
        const data = await res.json();
        const locks = data.locks || [];
        setSeatLocks(locks);
        await submitOrder(locks);
      } else {
        setMessage('锁座失败，座位可能已被占用，请重新选择');
      }
    } catch (e) {
      setMessage('网络错误');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="order-filling-page">
      {/* 12306 官方风格头部 */}
      <div className="ticket-header">
        <div className="wrapper">
          <div className="header-con">
            <h1 className="logo">
              <a href="http://localhost:8080/">中国铁路12306</a>
            </h1>
            <div className="header-right">
              <div className="header-search">
                <div className="search-bd">
                  <input type="text" className="search-input" placeholder="搜索车票、餐饮、常旅客、相关规章" />
                </div>
                <a className="search-btn" href="javascript:;">
                  <span>🔍</span>
                </a>
              </div>
              <ul className="header-menu">
                <li className="menu-item"><a href="javascript:;">无障碍</a></li>
                <li className="menu-item menu-line">|</li>
                <li className="menu-item"><a href="javascript:;">敬老版</a></li>
                <li className="menu-item menu-line">|</li>
                <li className="menu-item"><a href="javascript:;">English</a></li>
                <li className="menu-item menu-line">|</li>
                <li className="menu-item"><a href="javascript:;">我的12306</a></li>
              </ul>
            </div>
          </div>
        </div>
        <div className="nav-box">
          <div className="wrapper">
            <ul className="nav">
              <li className="nav-item"><a href="http://localhost:8080/" className="nav-hd">首页</a></li>
              <li className="nav-item active"><a href="javascript:;" className="nav-hd">车票</a></li>
              <li className="nav-item"><a href="javascript:;" className="nav-hd">团购服务</a></li>
              <li className="nav-item"><a href="javascript:;" className="nav-hd">会员服务</a></li>
              <li className="nav-item"><a href="javascript:;" className="nav-hd">站车服务</a></li>
              <li className="nav-item"><a href="javascript:;" className="nav-hd">商旅服务</a></li>
              <li className="nav-item"><a href="javascript:;" className="nav-hd">出行指南</a></li>
            </ul>
          </div>
        </div>
      </div>

      {/* 列车信息区域（浅蓝色背景） */}
      <div className="train-info-banner">
        <div className="wrapper">
          <div className="train-info-header">
            <h3>列车信息（以下为预订车次信息）</h3>
          </div>
          <div className="train-info-content">
            <div className="train-details">
              <span className="date">{travelDate} (周一)</span>
              <span className="train-no">{trainId}</span>
              <span className="route">{fromStation}站 ({getParam('departTime') || '06:10'}开) ━ {toStation}站 ({getParam('arriveTime') || '12:09'}到)</span>
            </div>
            <div className="seat-types">
              <span className="seat-item">一等座 <span className="price">¥{getParam('firstClassPrice') || '576.0'}元</span> <span className="count">{getParam('firstClassCount') || '8'}张</span> 有票</span>
              <span className="seat-item">商务座 <span className="price">¥{getParam('businessPrice') || '1873.0'}元</span> <span className="count">{getParam('businessCount') || '8'}张</span> <span className="count">{getParam('businessCount2') || '15'}张</span></span>
              <span className="seat-item">二等座 <span className="price">¥{getParam('secondClassPrice') || '969.0'}元</span> <span className="count">{getParam('secondClassCount') || '9'}张</span> 有票</span>
            </div>
            <div className="info-notice">
              * 当前价格为成年旅客所需价格，儿童票、学生票、残疾军人（警察）优惠票及支付方式可能影响票价，具体请参照订单确认信息为准。
            </div>
          </div>
        </div>
      </div>

      {/* 乘客信息填写区域 */}
      <div className="wrapper main-content">
        <div className="passenger-info-section">
          <div className="section-title-bar">
            <span className="icon-passenger">👤</span>
            <span>乘客信息</span>
            <span className="tip-text">（填写说明）</span>
            <div className="search-passenger">
              <input type="text" placeholder="输入乘客姓名" className="passenger-search-input" />
              <button className="passenger-search-btn">🔍</button>
            </div>
          </div>

          <div className="passenger-selection-area">
            {/* 乘车人复选框列表 */}
            <div className="passenger-checkbox-section">
              <div className="checkbox-label">
                <span className="label-icon">👤</span>
                <span className="label-text">乘车人</span>
              </div>
              <div className="checkbox-list">
                {contacts.length === 0 && (
                  <span className="no-contacts-hint">暂无常用联系人</span>
                )}
                {contacts.map(c => {
                  const isSelected = !!passengers.find(x => x.passenger_id === c.passenger_id);
                  return (
                    <label key={c.passenger_id} className={`checkbox-item ${isSelected ? 'checked' : ''}`}>
                      <input 
                        type="checkbox" 
                        checked={isSelected}
                        onChange={() => togglePassenger(c)}
                      />
                      <span className={`passenger-name ${isSelected ? 'selected' : ''}`}>{c.name}</span>
                    </label>
                  );
                })}
                <button onClick={handleRefresh} disabled={isSyncing} className="refresh-link-btn">
                  {isSyncing ? '刷新中...' : '🔄'}
                </button>
              </div>
              {syncError && <span className="error-hint">{syncError}</span>}
            </div>

            {/* 已选乘客表格 - 只在有选中乘客时显示 */}
            {passengers.length > 0 && (
              <div className="passenger-table">
                <div className="passenger-row passenger-table-header">
                  <div className="col-seq">序号</div>
                  <div className="col-ticket">票种</div>
                  <div className="col-seat">席别</div>
                  <div className="col-name">姓名</div>
                  <div className="col-id-type">证件类型</div>
                  <div className="col-id-number">证件号码</div>
                  <div className="col-actions"></div>
                </div>

                {passengers.map((p, index) => {
                  const contact = contacts.find(c => c.passenger_id === p.passenger_id) || p;
                  return (
                    <div key={p.passenger_id} className="passenger-row selected">
                      <div className="col-seq">{index + 1}</div>
                      <div className="col-ticket">
                        <select className="select-input">
                          <option>成人票</option>
                          <option>儿童票</option>
                          <option>学生票</option>
                        </select>
                      </div>
                      <div className="col-seat">
                        <select className="select-input">
                          <option>二等座 (¥{getParam('secondClassPrice') || '576.0'}元)</option>
                          <option>一等座</option>
                          <option>商务座</option>
                          <option>硬卧</option>
                          <option>软卧</option>
                        </select>
                      </div>
                      <div className="col-name">{contact.name}</div>
                      <div className="col-id-type">
                        <select className="select-input">
                          <option>{contact.id_type || '居民身份证'}</option>
                          <option>护照</option>
                          <option>港澳通行证</option>
                        </select>
                      </div>
                      <div className="col-id-number">{contact.masked_id_number || ''}</div>
                      <div className="col-actions">
                        <button 
                          className="remove-btn"
                          onClick={() => togglePassenger(contact)}
                          aria-label="移除乘客"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 广告横幅 - 中国铁路保险 */}
        <div className="ad-banner">
          <div className="ad-banner-logo">
            <span>🚄 中国铁路保险</span>
          </div>
          <div className="ad-banner-text">
            <h3>乘意相伴 安心出行</h3>
            <p>乘意险配置开启·保障范围更全面</p>
          </div>
        </div>

        {message && <div className="msg-box">{message}</div>}

        {selectedSeats.length > 0 && (
          <div className="selected-seats-info">
            <div className="info-title">已选座位：</div>
            <div className="seats-list">{selectedSeats.map((s: any) => `${s.carriage_no}车${s.seat_no}`).join('、')}</div>
            <button onClick={() => {
              setSelectedSeats([]);
              setSeatLocks([]);
              try {
                const sid = localStorage.getItem('SESSION_ID') || 'sess-super-12306';
                localStorage.removeItem(seatsCacheKeyBase(sid));
              } catch (e) {}
            }} className="clear-seats-btn">清空选座</button>
          </div>
        )}

        {/* 协议确认 */}
        <div className="agreement-section">
          <label className="agreement-checkbox">
            <input type="checkbox" defaultChecked />
            <span>提交订单表示已阅读并同意</span>
          </label>
          <a href="javascript:;" className="agreement-link">《国铁集团铁路旅客运输规程》</a>
          <a href="javascript:;" className="agreement-link">《服务条款》</a>
        </div>

        {/* 操作按钮 */}
        <div className="action-buttons">
          <button className="btn-back" onClick={() => window.history.back()}>上一步</button>
          <button className="btn-submit-order" onClick={startSubmit} disabled={isSubmitting}>提交订单</button>
        </div>

        {/* 温馨提示 */}
        <div className="submit-section">
          <div className="warm-tips">
            <h4>温馨提示：</h4>
            <ol>
              <li><span className="highlight-red">一张有效身份证件同一乘车日期同一车次只能购买一张车票</span>，高铁动卧列车除外。改签或变更到站后车票的乘车日期在春运期间，如再办理退票将按票面价格20%核收退票费。请合理安排行程，更多改签规则请查看<a href="javascript:;" className="link-orange">《退改说明》</a>。</li>
              <li>购买儿童票时，乘车儿童有有效身份证件的，请填写本人有效身份证件信息。自2023年1月1日起，每一名持票成年人旅客可免费携带一名未满6周岁且不单独占用席位的儿童乘车，超过一名时，超过人数应购买儿童优惠票。免费儿童可以在购票成功后添加。</li>
              <li>购买残疾军人（伤残警察）优待票的，须在购票后、开车前办理换票手续方可进站乘车。换票时，不符合规定的减价优待条件，没有有效"中华人民共和国残疾军人证"或"中华人民共和国伤残人民警察证"的，不予换票，所购车票按规定办理退票手续。</li>
              <li>一天内3次申请车票成功后取消订单（包含无座票申请成功5次计为取消1次），当日将不能在12306继续购票。</li>
              <li><span className="highlight-red">购买铁路乘意险的注册用户年龄须在18周岁以上</span>，使用非中国居民身份证注册的用户如购买铁路乘意险，须在<a href="javascript:;" className="link-blue">我的12306——个人信息</a>如实填写"出生日期"。</li>
              <li>父母为未成年子女投保，须在<a href="javascript:;" className="link-blue">我的乘车人</a>登记未成年子女的有效身份证件信息。</li>
            </ol>
          </div>
        </div>
      </div>

      {/* 页脚提示 */}
      <div className="page-footer">
        <div className="wrapper">
          <p>提交车单前请认真核对以下信息是否正确 《铁路免票集团线旅客发票查询规定》</p>
        </div>
      </div>

      {showWarmTip && (
        <WarmTipModal 
          onConfirm={() => {
            setShowWarmTip(false);
            proceedSubmit();
          }} 
          onCancel={() => setShowWarmTip(false)} 
        />
      )}

      {showSeat && (
        <SeatSelectionModal 
          trainId={trainId}
          travelDate={travelDate}
          fromStation={fromStation}
          toStation={toStation}
          departTime={getParam('departTime') || '06:10'}
          arriveTime={getParam('arriveTime') || '12:09'}
          passengerCount={passengers.length}
          passengers={passengers.map(p => {
            const contact = contacts.find(c => c.passenger_id === p.passenger_id) || p;
            return {
              passenger_id: p.passenger_id,
              name: contact.name || '',
              id_type: contact.id_type || '居民身份证',
              masked_id_number: contact.masked_id_number || ''
            };
          })}
          onConfirm={handleSeatConfirm}
          onCancel={() => setShowSeat(false)}
        />
      )}
    </div>
  );
}
