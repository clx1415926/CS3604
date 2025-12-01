import React, { useState, useEffect, useMemo } from 'react';

function QueryForm({ onQuery, stations, disabled }) {
    const [fromStation, setFromStation] = useState('北京');
    const [toStation, setToStation] = useState('上海');
    const [departDate, setDepartDate] = useState('2025-12-15');
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [error, setError] = useState('');
    const [showFromSug, setShowFromSug] = useState(false);
    const [showToSug, setShowToSug] = useState(false);

    const cities = useMemo(() => {
        const list = Array.isArray(stations) ? stations : [];
        return list.filter(name => !/(南$|北$|东$|西$|虹桥$|松江$|站$)/.test(name));
    }, [stations]);

    const getSuggestions = (keyword, setSuggestions) => {
        if (keyword) {
            const filtered = cities.filter(city => city.includes(keyword));
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const handleFromChange = (e) => {
        const value = e.target.value;
        setFromStation(value);
        getSuggestions(value, setFromSuggestions);
        setShowFromSug(true);
    };

    const handleToChange = (e) => {
        const value = e.target.value;
        setToStation(value);
        getSuggestions(value, setToSuggestions);
        setShowToSug(true);
    };

    const handleSuggestionClick = (value, setValue, setSuggestions, setShow) => {
        setValue(value);
        setSuggestions([]);
        setShow(false);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!cities.includes(fromStation) || !cities.includes(toStation)) {
            setError('出发地或目的地无效，请从建议列表中选择。');
            return;
        }
        setError('');
        onQuery({ fromStation, toStation, departDate });
    };

    return (
        <form onSubmit={handleSubmit} className="query-form">
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
                        value={fromStation}
                        onChange={handleFromChange}
                        placeholder="出发地"
                        required
                        disabled={disabled}
                        onFocus={() => setShowFromSug(true)}
                        onBlur={() => setTimeout(() => setShowFromSug(false), 150)}
                    />
                    {showFromSug && fromSuggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {fromSuggestions.map(s => (
                                <li key={`from-${s}`} onMouseDown={() => handleSuggestionClick(s, setFromStation, setFromSuggestions, setShowFromSug)}>{s}</li>
                            ))}
                        </ul>
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
                        value={toStation}
                        onChange={handleToChange}
                        placeholder="目的地"
                        required
                        disabled={disabled}
                        onFocus={() => setShowToSug(true)}
                        onBlur={() => setTimeout(() => setShowToSug(false), 150)}
                    />
                    {showToSug && toSuggestions.length > 0 && (
                        <ul className="suggestions-list">
                            {toSuggestions.map(s => (
                                <li key={`to-${s}`} onMouseDown={() => handleSuggestionClick(s, setToStation, setToSuggestions, setShowToSug)}>{s}</li>
                            ))}
                        </ul>
                    )}
                </div>
                <div className="form-group">
                    <label htmlFor="departDate">出发日</label>
                    <input
                        type="date"
                        id="departDate"
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
                <button type="submit" className="submit-btn" disabled={disabled}>查询</button>
            </div>
            {error && <p className="error-message">{error}</p>}
        </form>
    );
}

export default QueryForm;