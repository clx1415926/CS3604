import React, { useState, useEffect } from 'react';
import Header from './components/Header';
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

    const handleQuery = (query) => {
        setQuery(query);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    useEffect(() => {
        const fetchStations = async () => {
            try {
                const response = await fetch(`http://localhost:3000/api/stations`);
                const data = await response.json();
                const list = Array.isArray(data) ? data.map(s => s.name ?? s) : (data.stations || []);
                const fallback = [
                    '北京','北京南','北京西','上海','上海虹桥','上海南','广州','广州南','深圳','深圳北',
                    '成都','成都东','重庆','重庆西','杭州','杭州东','南京','南京南','西安','西安北','武汉','长沙','长沙南'
                ];
                setStations((list && list.length > 0) ? list : fallback);
            } catch (e) {
                setStations([
                    '北京','北京南','北京西','上海','上海虹桥','上海南','广州','广州南','深圳','深圳北',
                    '成都','成都东','重庆','重庆西','杭州','杭州东','南京','南京南','西安','西安北','武汉','长沙','长沙南'
                ]);
            } finally {
                setStationsLoaded(true);
            }
        };
        fetchStations();
    }, []);

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
                const response = await fetch(`http://localhost:3000/api/tickets?${params}`);
                const data = await response.json();
                setTrains(data.trains);
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
                const response = await fetch(`http://localhost:3000/api/tickets?${params}`);
                const data = await response.json();
                const fromSet = new Set();
                const toSet = new Set();
                (data.trains || []).forEach(t => { fromSet.add(t.fromStation); toSet.add(t.toStation); });
                setBaseFromStations(Array.from(fromSet));
                setBaseToStations(Array.from(toSet));
            };
            fetchBaseStations();
        }
    }, [query]);

    return (
        <div>
            <Header />
            <main className="container">
                <QueryForm onQuery={handleQuery} stations={stations} disabled={!stationsLoaded} />
                <div style={{ display: 'block', marginTop: '20px' }}>
                    <FilterPanel onFilterChange={handleFilterChange}
                        availableFromStations={baseFromStations}
                        availableToStations={baseToStations}
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
                      <img src="/@fs/d:/HW/CS3601/CS3604/12306_ticket_selection/kyfw.12306.cn/otn/resources/images/zgtlwb.png" alt="中国铁路官方微信" />
                    </div>
                  </li>
                  <li>
                    <h2 className="foot-con-tit">中国铁路官方微博</h2>
                    <div className="code-pic">
                      <img src="/@fs/d:/HW/CS3601/CS3604/12306_ticket_selection/kyfw.12306.cn/otn/resources/images/zgtlwx.png" alt="中国铁路官方微博" />
                    </div>
                  </li>
                  <li>
                    <h2 className="foot-con-tit">12306 公众号</h2>
                    <div className="code-pic">
                      <img src="/@fs/d:/HW/CS3601/CS3604/12306_ticket_selection/kyfw.12306.cn/otn/resources/images/public.png" alt="12306 公众号" />
                    </div>
                  </li>
                  <li>
                    <h2 className="foot-con-tit">铁路12306</h2>
                    <div className="code-pic">
                      <img src="/@fs/d:/HW/CS3601/CS3604/12306_ticket_selection/kyfw.12306.cn/otn/resources/images/download.png" alt="铁路12306" />
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
                    <img src="/@fs/d:/HW/CS3601/CS3604/12306_ticket_selection/kyfw.12306.cn/otn/resources/images/gongan.png" alt="公安" style={{width:'13px'}} />
                    <a target="_blank" href="http://www.beian.gov.cn/portal/registerSystemInfo?recordcode=11010802038392" style={{color:'#c1c1c1'}}>京公网安备 11010802038392号</a>
                  </span>
                  <span className="mr">|</span>
                  <span className="mr">京ICP备05020493号-4</span>
                  <span className="mr">|</span>
                  <span>ICP证：京B2-20202537</span>
                </p>
                <div className="a11y-link">
                  <img src="/@fs/d:/HW/CS3601/CS3604/12306_ticket_selection/kyfw.12306.cn/otn/resources/images/footer-slh.jpg" alt="适老化无障碍服务" style={{display:'block',width:'130px',height:'46px'}} />
                </div>
              </div>
            </div>
        </div>
    );
}

export default App;
