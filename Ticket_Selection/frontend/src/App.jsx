import React, { useState, useEffect, useMemo } from 'react';
import QueryForm from './components/QueryForm';
import TrainList from './components/TrainList';
import FilterPanel from './components/FilterPanel';

function App() {
    const [trains, setTrains] = useState([]);
    const [stations, setStations] = useState([]);
    const [query, setQuery] = useState(null);
    const [filters, setFilters] = useState({ trainTypes: [], seatTypes: [], fromStations: [], toStations: [] });
    const [stationsLoaded, setStationsLoaded] = useState(false);
    const [baseFromStations, setBaseFromStations] = useState([]);
    const [baseToStations, setBaseToStations] = useState([]);
    const initialParams = useMemo(() => {
        let base = { from: '', to: '', date: '', student: '', highspeed: '', type: '' };
        try {
            const p = new URLSearchParams(window.location.search || '');
            base.from = p.get('from') || '';
            base.to = p.get('to') || '';
            base.date = p.get('date') || '';
            base.student = p.get('student') || '';
            base.highspeed = p.get('highspeed') || '';
            base.type = p.get('type') || '';
        } catch (e) {}
        try {
            const raw = localStorage.getItem('LAST_QUERY');
            if (raw) {
                const q = JSON.parse(raw);
                ['from','to','date','student','highspeed','type'].forEach(k => {
                    if (!base[k] && q && q[k]) base[k] = q[k];
                });
            }
        } catch (e) {}
        return base;
    }, []);
    useEffect(() => { console.log('[App] initialParams', initialParams); }, [initialParams]);
    const [autoQueried, setAutoQueried] = useState(false);

    const handleQuery = (query) => {
        console.log('[App] handleQuery', query);
        setQuery(query);
    };

    const handleFilterChange = (newFilters) => {
        console.log('[App] handleFilterChange', newFilters);
        setFilters(newFilters);
    };


    useEffect(() => {
        const fetchStations = async () => {
            try {
                console.log('[App] fetchStations start');
                const response = await fetch(`http://localhost:3000/api/stations`);
                const data = await response.json();
                const list = Array.isArray(data) ? data.map(s => s.name ?? s) : (data.stations || []);
                const fallback = [
                    '北京','北京南','北京西','上海','上海虹桥','上海南','广州','广州南','深圳','深圳北',
                    '成都','成都东','重庆','重庆西','杭州','杭州东','南京','南京南','西安','西安北','武汉','长沙','长沙南'
                ];
                setStations((list && list.length > 0) ? list : fallback);
                console.log('[App] fetchStations ok', { count: (list && list.length) ? list.length : fallback.length });
            } catch (e) {
                console.error('[App] fetchStations error', e);
                setStations([
                    '北京','北京南','北京西','上海','上海虹桥','上海南','广州','广州南','深圳','深圳北',
                    '成都','成都东','重庆','重庆西','杭州','杭州东','南京','南京南','西安','西安北','武汉','长沙','长沙南'
                ]);
            } finally {
                setStationsLoaded(true);
                console.log('[App] stationsLoaded', true);
            }
        };
        fetchStations();
    }, []);

    useEffect(() => {
        if (!autoQueried && initialParams && initialParams.from && initialParams.to) {
            const d = initialParams.date || (function(){ const t = new Date(); const y=t.getFullYear(); const m=String(t.getMonth()+1).padStart(2,'0'); const dd=String(t.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; })();
            console.log('[App] auto query init', { from: initialParams.from, to: initialParams.to, date: d });
            setQuery({ fromStation: initialParams.from, toStation: initialParams.to, departDate: d });
            setAutoQueried(true);
        }
    }, [autoQueried, initialParams]);

    useEffect(() => {
        if (query) {
            const fetchTickets = async () => {
                const params = new URLSearchParams();
                Object.entries(query).forEach(([k, v]) => {
                    if (Array.isArray(v)) {
                        v.forEach(item => params.append(k, item));
                    } else if (v !== undefined && v !== null) {
                        params.append(k, v);
                    }
                });
                (filters.trainTypes || []).forEach(t => params.append('trainTypes', t));
                (filters.seatTypes || []).forEach(s => params.append('seatTypes', s));
                (filters.fromStations || []).forEach(fs => params.append('fromStations', fs));
                (filters.toStations || []).forEach(ts => params.append('toStations', ts));
                if (filters && (filters.student === '1' || filters.student === true)) {
                    params.append('student', '1');
                }
                const url = `http://localhost:3000/api/tickets?${params}`;
                console.log('[App] fetchTickets', url);
                const response = await fetch(url);
                const data = await response.json();
                setTrains(data.trains);
                console.log('[App] fetchTickets done', { trains: (data.trains || []).length });
            };
            fetchTickets();
        }
    }, [query, filters]);

    // 当查询条件变化时，计算基础的车站集合（不受筛选影响）
    useEffect(() => {
        if (query) {
            const fetchBaseStations = async () => {
                const params = new URLSearchParams();
                Object.entries(query).forEach(([k, v]) => {
                    if (v !== undefined && v !== null) params.append(k, v);
                });
                const url = `http://localhost:3000/api/tickets?${params}`;
                console.log('[App] fetchBaseStations', url);
                const response = await fetch(url);
                const data = await response.json();
                const fromSet = new Set();
                const toSet = new Set();
                (data.trains || []).forEach(t => { fromSet.add(t.fromStation); toSet.add(t.toStation); });
                setBaseFromStations(Array.from(fromSet));
                setBaseToStations(Array.from(toSet));
                console.log('[App] baseStations done', { from: fromSet.size, to: toSet.size });
            };
            fetchBaseStations();
        }
    }, [query]);

    return (
        <div>
            <main className="container">
                <QueryForm onQuery={handleQuery} stations={stations} disabled={!stationsLoaded}
                    initialFrom={initialParams.from}
                    initialTo={initialParams.to}
                    initialDate={initialParams.date || (function(){ const t = new Date(); const y=t.getFullYear(); const m=String(t.getMonth()+1).padStart(2,'0'); const dd=String(t.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; })()}
                />
                <div style={{ display: 'block', marginTop: '20px' }}>
                    <FilterPanel onFilterChange={handleFilterChange}
                        availableFromStations={baseFromStations}
                        availableToStations={baseToStations}
                        initialTrainTypes={(initialParams.highspeed === '1') ? ['G','D'] : []}
                        initialStudent={(initialParams.student === '1')}
                    />
                    <div className="train-list-wrapper" style={{ flex: 1, marginTop: '20px' }}>
                        <TrainList trains={trains} />
                    </div>
                </div>
            </main>
            <div className="footer">
              <div className="footer-con wrapper">
                <div className="foot-links">
                  <h2 className="foot-con-tit">友情链接</h2>
                  <ul className="foot-links-list" role="menubar">
                    <li role="menuitem">
                      <a href="https://www.12306.cn/index/" target="_blank" rel="noreferrer">
                        <span>12306官网</span>
                      </a>
                    </li>
                  </ul>
                </div>
                <ul className="foot-code">
                  <li>
                    <h2 className="foot-con-tit">中国铁路官方微信</h2>
                    <div className="code-pic">
                      <img src="./assets/zgtlwb.png" alt="中国铁路官方微信" />
                    </div>
                  </li>
                  <li>
                    <h2 className="foot-con-tit">中国铁路官方微博</h2>
                    <div className="code-pic">
                      <img src="./assets/zgtlwx.png" alt="中国铁路官方微博" />
                    </div>
                  </li>
                  <li>
                    <h2 className="foot-con-tit">12306 公众号</h2>
                    <div className="code-pic">
                      <img src="./assets/public.png" alt="12306 公众号" />
                    </div>
                  </li>
                  <li>
                    <h2 className="foot-con-tit">铁路12306</h2>
                    <div className="code-pic">
                      <img src="./assets/download.png" alt="铁路12306" />
                      <div className="code-tips">官方APP下载，目前铁路未授权其他网站或APP开展类似服务内容，敬请广大用户注意。</div>
                    </div>
                  </li>
                </ul>
              </div>
              <div className="footer-txt">
                <p>
                  <span className="mr">版权所有©2008-2025</span>
                  <span className="mr">中国铁道科学研究院集团有限公司</span>
                  <span>技术支持：铁旅科技有限公司</span>
                </p>
                <p>
                  <span className="mr">
                    <img src="./assets/gongan.png" alt="公安" style={{width:'13px'}} />
                    <a target="blank" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010802038392" style={{color:'#c1c1c1'}}>京公网安备 11010802038392号</a>
                  </span>
                  <span className="mr">|</span>
                  <span className="mr">京ICP备05020493号-4</span>
                  <span className="mr">|</span>
                  <span>ICP证：京B2-20202537</span>
                </p>
                <div className="a11y-link">
                  <img src="./assets/footer-slh.jpg" alt="适老化无障碍服务" style={{display: 'block',width: '130px',height: '46px'}} />
                </div>
              </div>
            </div>
        </div>
    );
}

export default App;
