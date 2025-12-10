import React, { useState, useEffect, useMemo, useRef } from 'react';

function QueryForm({ onQuery, stations, disabled, initialFrom, initialTo, initialDate }) {
    const [fromStation, setFromStation] = useState(() => {
        if (initialFrom) return initialFrom;
        try { const p = new URLSearchParams(window.location.search || ''); return p.get('from') || ''; } catch(e) { return ''; }
    });
    const [toStation, setToStation] = useState(() => {
        if (initialTo) return initialTo;
        try { const p = new URLSearchParams(window.location.search || ''); return p.get('to') || ''; } catch(e) { return ''; }
    });
    const [departDate, setDepartDate] = useState(() => {
        if (initialDate) return initialDate;
        try { const p = new URLSearchParams(window.location.search || ''); const d = p.get('date'); if (d) return d; } catch(e) {}
        const t=new Date(); const y=t.getFullYear(); const m=String(t.getMonth()+1).padStart(2,'0'); const d=String(t.getDate()).padStart(2,'0'); return `${y}-${m}-${d}`;
    });
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [error, setError] = useState('');
    const [showFromSug, setShowFromSug] = useState(false);
    const [showToSug, setShowToSug] = useState(false);
    const fromPanelGuard = useRef(false);
    const toPanelGuard = useRef(false);
    const fromInputRef = useRef(null);
    const toInputRef = useRef(null);
    const fromPanelRef = useRef(null);
    const toPanelRef = useRef(null);

    useEffect(() => {
        console.log('[QueryForm] mount props', { initialFrom, initialTo, initialDate });
        console.log('[QueryForm] mount state', { fromStation, toStation, departDate });
    }, []);

    const cities = useMemo(() => {
        const list = Array.isArray(stations) ? stations : [];
        return list.filter(name => !/(南$|北$|东$|西$|虹桥$|松江$|站$)/.test(name));
    }, [stations]);

    const defaultCities = useMemo(() => [
        '北京','上海','广州','深圳','长春','成都','重庆','杭州','南京','武汉','西安','长沙','郑州','合肥','济南','天津','南昌','福州','厦门','青岛','昆明','贵阳','兰州','南宁','沈阳','大连','哈尔滨','长春','石家庄','太原','乌鲁木齐','呼和浩特','银川','拉萨','海口','三亚','苏州','无锡','宁波','温州','嘉兴','绍兴','台州','金华','舟山','泉州','莆田','漳州','汕头','揭阳','佛山','东莞','中山','珠海','惠州','江门','肇庆','南通','扬州','泰州','盐城','徐州','连云港','淮安','宿迁','洛阳','开封','邯郸','保定','唐山','秦皇岛','廊坊','烟台','威海','潍坊','泰安','淄博','日照','临沂','德州','聊城','济宁','曲靖','玉溪','丽江','大理','西宁','咸阳','宝鸡','延安','榆林'
    ], []);

    const pinyinInitials = useMemo(() => ({
        '北京':'B','上海':'S','广州':'G','深圳':'S','长春':'C','成都':'C','重庆':'C','杭州':'H','南京':'N','武汉':'W','西安':'X','长沙':'C','郑州':'Z','合肥':'H','济南':'J','天津':'T','南昌':'N','福州':'F','厦门':'X','青岛':'Q','昆明':'K','贵阳':'G','兰州':'L','南宁':'N','沈阳':'S','大连':'D','哈尔滨':'H','长春':'C','石家庄':'S','太原':'T','乌鲁木齐':'W','呼和浩特':'H','银川':'Y','拉萨':'L','海口':'H','三亚':'S','苏州':'S','无锡':'W','宁波':'N','温州':'W','嘉兴':'J','绍兴':'S','台州':'T','金华':'J','舟山':'Z','泉州':'Q','莆田':'P','漳州':'Z','汕头':'S','揭阳':'J','佛山':'F','东莞':'D','中山':'Z','珠海':'Z','惠州':'H','江门':'J','肇庆':'Z','南通':'N','扬州':'Y','泰州':'T','盐城':'Y','徐州':'X','连云港':'L','淮安':'H','宿迁':'S','洛阳':'L','开封':'K','邯郸':'H','保定':'B','唐山':'T','秦皇岛':'Q','廊坊':'L','烟台':'Y','威海':'W','潍坊':'W','泰安':'T','淄博':'Z','日照':'R','临沂':'L','德州':'D','聊城':'L','济宁':'J','曲靖':'Q','玉溪':'Y','丽江':'L','大理':'D','西宁':'X','咸阳':'X','宝鸡':'B','延安':'Y','榆林':'Y'
    }), []);

    const allCities = useMemo(() => {
        const base = cities && cities.length ? cities : defaultCities;
        return Array.from(new Set(base));
    }, [cities, defaultCities]);

    const getSuggestions = (keyword, setSuggestions) => {
        if (keyword) {
            const filtered = allCities.filter(city => city.includes(keyword));
            setSuggestions(filtered);
        } else {
            setSuggestions(allCities);
        }
    };

    const handleFromChange = (e) => {
        const value = e.target.value;
        setFromStation(value);
        getSuggestions(value, setFromSuggestions);
        setShowFromSug(true);
        console.log('[QueryForm] from change', value);
    };

    const handleToChange = (e) => {
        const value = e.target.value;
        setToStation(value);
        getSuggestions(value, setToSuggestions);
        setShowToSug(true);
        console.log('[QueryForm] to change', value);
    };

    const handleSuggestionClick = (value, setValue, setSuggestions, setShow) => {
        setValue(value);
        setSuggestions([]);
        setShow(false);
        console.log('[QueryForm] suggestion choose', value);
    };

    useEffect(() => {
        console.log('[QueryForm] props update', { initialFrom, initialTo, initialDate });
        if (initialFrom) setFromStation(initialFrom);
        if (initialTo) setToStation(initialTo);
        if (initialDate) setDepartDate(initialDate);
    }, [initialFrom, initialTo, initialDate]);

    useEffect(() => {
        console.log('[QueryForm] state change', { fromStation, toStation, departDate });
    }, [fromStation, toStation, departDate]);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!allCities.includes(fromStation) || !allCities.includes(toStation)) {
            setError('出发地或目的地无效，请从建议列表中选择。');
            return;
        }
        setError('');
        const payload = { fromStation, toStation, departDate };
        console.log('[QueryForm] submit', payload);
        onQuery(payload);
    };

    const [activeType, setActiveType] = useState('domestic');
    const [activeGroup, setActiveGroup] = useState('hot');

    const hotCities = useMemo(() => ['北京','上海','广州','深圳','长春','成都','重庆','杭州','南京','武汉','西安','郑州','长沙','合肥','济南','天津','南昌','福州','厦门','青岛'], []);

    const groupDefs = useMemo(() => ([
        { key: 'hot', label: '热门' },
        { key: 'ABCDE', label: 'ABCDE' },
        { key: 'FGHIJ', label: 'FGHIJ' },
        { key: 'KLMNO', label: 'KLMNO' },
        { key: 'PQRST', label: 'PQRST' },
        { key: 'UVWXYZ', label: 'UVWXYZ' }
    ]), []);

    const lettersInGroup = (grp) => {
        if (grp === 'ABCDE') return ['A','B','C','D','E'];
        if (grp === 'FGHIJ') return ['F','G','H','I','J'];
        if (grp === 'KLMNO') return ['K','L','M','N','O'];
        if (grp === 'PQRST') return ['P','Q','R','S','T'];
        if (grp === 'UVWXYZ') return ['U','V','W','X','Y','Z'];
        return [];
    };

    const getInitial = (name) => pinyinInitials[name] || '';

    const groupedCities = useMemo(() => {
        if (activeGroup === 'hot') return hotCities.filter(c => allCities.includes(c));
        const letters = lettersInGroup(activeGroup);
        const res = [];
        allCities.forEach((c) => {
            const inl = getInitial(c);
            if (letters.includes(inl)) res.push(c);
        });
        return res.length ? res : allCities;
    }, [activeGroup, allCities, hotCities]);

    const intlCities = useMemo(() => ['香港西九龙','香港','澳门','台北','东京','首尔'], []);
    const intlInitials = useMemo(() => ({
        '香港西九龙': 'X',
        '香港': 'X',
        '澳门': 'A',
        '台北': 'T',
        '东京': 'D',
        '首尔': 'S'
    }), []);
    const intlGroupedCities = useMemo(() => {
        if (activeGroup === 'hot') return intlCities;
        const letters = lettersInGroup(activeGroup);
        const res = [];
        intlCities.forEach((c) => {
            const inl = intlInitials[c] || getInitial(c);
            if (letters.includes(inl)) res.push(c);
        });
        return res;
    }, [activeGroup, intlCities, intlInitials]);

    const renderSuggestionPanel = (setValue, setSuggestions, setShow, guardRef, panelRef) => (
        <div className="suggestions-panel" ref={panelRef} onMouseDown={() => { guardRef.current = true; setTimeout(() => { guardRef.current = false; }, 180); }}>
            <div className="suggestions-sidebar">
                <button type="button" className={activeType === 'domestic' ? 'side-btn active' : 'side-btn'} onMouseDown={() => setActiveType('domestic')}>国内站点</button>
                <button type="button" className={activeType === 'international' ? 'side-btn active' : 'side-btn'} onMouseDown={() => setActiveType('international')}>国际站点</button>
            </div>
            <div className="suggestions-content">
                <div className="suggestion-tabs">
                    {groupDefs.map(g => (
                        <button type="button" key={g.key} className={activeGroup === g.key ? 'suggestion-tab active' : 'suggestion-tab'} onMouseDown={() => setActiveGroup(g.key)}>{g.label}</button>
                    ))}
                </div>
                <div className="suggestions-grid">
                    {(activeType === 'domestic' ? groupedCities : intlGroupedCities).map(c => (
                        <div key={c} className="suggestion-item" onMouseDown={() => handleSuggestionClick(c, setValue, setSuggestions, setShow)}>{c}</div>
                    ))}
                </div>
            </div>
        </div>
    );

    useEffect(() => {
        const handler = (e) => {
            const t = e.target;
            const inFrom = (fromInputRef.current && fromInputRef.current.contains(t)) || (fromPanelRef.current && fromPanelRef.current.contains(t));
            const inTo = (toInputRef.current && toInputRef.current.contains(t)) || (toPanelRef.current && toPanelRef.current.contains(t));
            if (fromPanelGuard.current || toPanelGuard.current) return;
            if (!inFrom) setShowFromSug(false);
            if (!inTo) setShowToSug(false);
        };
        document.addEventListener('mousedown', handler);
        return () => { document.removeEventListener('mousedown', handler); };
    }, []);

    return (
        <form onSubmit={handleSubmit} className="query-form query-box">
            <div className="form-row">
                <div className="form-group radio-group">
                    <label><input type="radio" name="trip-type" value="single" defaultChecked /> 单程</label>
                    <label><input type="radio" name="trip-type" value="round" /> 往返</label>
                </div>
            </div>
            <div className="form-row">
                <div className="form-group">
                    <label htmlFor="fromStation">出发地</label>
                    <input
                        type="text"
                        id="fromStation"
                        name="leftTicketDTO.from_station_name"
                        className="inp-txt"
                        value={fromStation}
                        onChange={handleFromChange}
                        placeholder="出发地"
                        required
                        disabled={disabled}
                        ref={fromInputRef}
                        onFocus={() => { getSuggestions((fromStation || '').trim(), setFromSuggestions); setShowFromSug(true); }}
                        onBlur={() => setTimeout(() => { if (!fromPanelGuard.current) setShowFromSug(false); }, 150)}
                    />
                    {showFromSug && (
                        fromStation ? (
                            fromSuggestions.length > 0 && (
                                <ul className="suggestions-list">
                                    {fromSuggestions.map(s => (
                                        <li key={`from-${s}`} onMouseDown={() => handleSuggestionClick(s, setFromStation, setFromSuggestions, setShowFromSug)}>{s}</li>
                                    ))}
                                </ul>
                            )
                        ) : renderSuggestionPanel(setFromStation, setFromSuggestions, setShowFromSug, fromPanelGuard, fromPanelRef)
                    )}
                </div>
                <button type="button" className="swap-btn" onClick={() => {
                    const temp = fromStation;
                    setFromStation(toStation);
                    setToStation(temp);
                }}>⇄</button>
                <div className="form-group">
                    <label htmlFor="toStation">目的地</label>
                    <input
                        type="text"
                        id="toStation"
                        name="leftTicketDTO.to_station_name"
                        className="inp-txt"
                        value={toStation}
                        onChange={handleToChange}
                        placeholder="目的地"
                        required
                        disabled={disabled}
                        ref={toInputRef}
                        onFocus={() => { getSuggestions((toStation || '').trim(), setToSuggestions); setShowToSug(true); }}
                        onBlur={() => setTimeout(() => { if (!toPanelGuard.current) setShowToSug(false); }, 150)}
                    />
                    {showToSug && (
                        toStation ? (
                            toSuggestions.length > 0 && (
                                <ul className="suggestions-list">
                                    {toSuggestions.map(s => (
                                        <li key={`to-${s}`} onMouseDown={() => handleSuggestionClick(s, setToStation, setToSuggestions, setShowToSug)}>{s}</li>
                                    ))}
                                </ul>
                            )
                        ) : renderSuggestionPanel(setToStation, setToSuggestions, setShowToSug, toPanelGuard, toPanelRef)
                    )}
                </div>
                <div className="form-group">
                    <label htmlFor="departDate">出发日</label>
                    <input
                        type="date"
                        id="departDate"
                        name="leftTicketDTO.train_date"
                        className="inp_selected"
                        value={departDate}
                        onChange={(e) => setDepartDate(e.target.value)}
                        required
                        disabled={disabled}
                    />
                </div>
                <div className="form-group radio-group">
                    <label><input type="radio" name="passenger-type" value="normal" defaultChecked /> 普通</label>
                    <label><input type="radio" name="passenger-type" value="student" /> 学生</label>
                </div>
                <button type="submit" id="query_ticket" className="submit-btn btn92s" disabled={disabled}>查询</button>
            </div>
            {error && <p className="error-message">{error}</p>}
        </form>
    );
}

export default QueryForm;
