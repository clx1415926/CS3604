import React, { useEffect, useMemo, useState } from 'react'
import './leftTicket.css'

const Header = () => {
  return (
    <header className="lt-header" role="banner">
      <div className="lt-header-top">
        <div className="lt-logo">
          <strong>中国铁路12306</strong>
          <span className="lt-sub">12306 CHINA RAILWAY</span>
        </div>
        <div className="lt-search">
          <input placeholder="搜索车票、餐饮、常旅客、相关规章" />
          <button className="lt-search-btn">Q</button>
        </div>
        <nav className="lt-topmenu">
          <a href="#">无障碍</a>
          <span className="sep">|</span>
          <a href="#">敬老版</a>
          <span className="sep">|</span>
          <a href="#">English</a>
          <span className="sep">|</span>
          <a href="#">我的12306</a>
          <span className="sep">|</span>
          <a href="http://localhost:8082/login.html">登录</a>
          <a href="http://localhost:8082/register.html" className="ml">注册</a>
        </nav>
      </div>
      <div className="lt-nav">
        <a className="active" href="#">首页</a>
        <a href="#">车票</a>
        <a href="#">团体旅客</a>
        <a href="#">会员服务</a>
        <a href="#">站车服务</a>
        <a href="#">商旅服务</a>
        <a href="#">出行指南</a>
        <a href="#">信息查询</a>
      </div>
    </header>
  )
}

const parseParams = () => {
  const url = new URL(window.location.href)
  const p = Object.fromEntries(url.searchParams.entries())
  return {
    from: p.from || '',
    to: p.to || '',
    date: p.date || '',
    student: p.student === '1',
    highspeed: p.highspeed === '1',
    type: p.type || 'single',
  }
}

const LeftTicketPage = () => {
  const [form, setForm] = useState(() => parseParams())
  useEffect(() => {
    if (!form.date) {
      const t = new Date()
      const y = t.getFullYear()
      const m = String(t.getMonth()+1).padStart(2,'0')
      const d = String(t.getDate()).padStart(2,'0')
      setForm(f => ({ ...f, date: `${y}-${m}-${d}` }))
    }
  }, [])

  const results = useMemo(() => {
    // 模拟数据，仅用于视觉一致性展示
    return [
      { code: 'G28', from: '上海', to: '北京南', depart: '18:52', arrive: '23:18', duration: '04:26', biz: '二等/一等/商务', status: '有票' },
      { code: 'Z282', from: '上海', to: '北京', depart: '19:16', arrive: '09:52', duration: '14:36', biz: '硬座/软卧', status: '候补' },
      { code: 'D10', from: '上海', to: '北京', depart: '21:15', arrive: '09:26', duration: '12:11', biz: '二等/一等', status: '有票' },
      { code: 'D6', from: '上海', to: '北京', depart: '21:15', arrive: '09:26', duration: '12:11', biz: '二等', status: '有票' },
    ]
  }, [form])

  const handleSubmit = (e) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (form.from) params.set('from', form.from)
    if (form.to) params.set('to', form.to)
    if (form.date) params.set('date', form.date)
    if (form.student) params.set('student', '1')
    if (form.highspeed) params.set('highspeed', '1')
    params.set('type', form.type || 'single')
    window.history.replaceState(null, '', `?${params.toString()}`)
  }

  return (
    <div className="left-ticket-page">
      <Header />
      <main className="lt-main">
        <section className="lt-card">
          <form className="lt-form" onSubmit={handleSubmit}>
            <div className="lt-radios">
              <label><input type="radio" name="trip" checked={form.type==='single'} onChange={()=>setForm({...form,type:'single'})}/> 单程</label>
              <label><input type="radio" name="trip" disabled/> 往返</label>
              <label><input type="radio" name="trip" disabled/> 中转换乘</label>
              <label><input type="radio" name="trip" disabled/> 退改签</label>
            </div>
            <div className="lt-grid">
              <div className="row">
                <label>出发地</label>
                <input value={form.from} onChange={e=>setForm({...form,from:e.target.value})} placeholder="上海" />
                <label>到达地</label>
                <input value={form.to} onChange={e=>setForm({...form,to:e.target.value})} placeholder="北京" />
                <label>出发日期</label>
                <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} />
                <label>返程日期</label>
                <input type="date" disabled />
                <div className="opts">
                  <label><input type="radio" name="user" checked={!form.student} onChange={()=>setForm({...form,student:false})}/> 普通</label>
                  <label><input type="radio" name="user" checked={form.student} onChange={()=>setForm({...form,student:true})}/> 学生</label>
                  <button type="submit" className="lt-query">查 询</button>
                </div>
              </div>
            </div>
          </form>
        </section>
        <section className="lt-table">
          <table>
            <thead>
              <tr>
                <th>车次/类型</th>
                <th>出发/到达站</th>
                <th>出发/到达时间</th>
                <th>历时</th>
                <th>商务座</th>
                <th>一等座</th>
                <th>二等座</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {results.map((r, i)=> (
                <tr key={i}>
                  <td>{r.code}</td>
                  <td>{r.from} / {r.to}</td>
                  <td>{r.depart} / {r.arrive}</td>
                  <td>{r.duration}</td>
                  <td>—</td>
                  <td>{r.biz.includes('一等')?'有':''}</td>
                  <td>{r.biz.includes('二等')?'有':''}</td>
                  <td><button className="btn-book" disabled>预订</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  )
}

export default LeftTicketPage
