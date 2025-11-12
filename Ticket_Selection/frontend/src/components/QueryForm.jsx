import React, { useState, useEffect } from 'react';

function QueryForm({ onQuery, stations, disabled }) {
    const [fromStation, setFromStation] = useState('北京');
    const [toStation, setToStation] = useState('上海');
    const [departDate, setDepartDate] = useState('2025-11-11');
    const [fromSuggestions, setFromSuggestions] = useState([]);
    const [toSuggestions, setToSuggestions] = useState([]);
    const [error, setError] = useState('');

    const getSuggestions = (keyword, setSuggestions) => {
        console.log(stations);
        if (keyword) {
            const filtered = stations.filter(station => station.includes(keyword));
            setSuggestions(filtered);
        } else {
            setSuggestions([]);
        }
    };

    const handleFromChange = (e) => {
        const value = e.target.value;
        setFromStation(value);
        getSuggestions(value, setFromSuggestions);
    };

    const handleToChange = (e) => {
        const value = e.target.value;
        setToStation(value);
        getSuggestions(value, setToSuggestions);
    };

    const handleSuggestionClick = (station, setStation, setSuggestions) => {
        setStation(station);
        setSuggestions([]);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!stations.includes(fromStation) || !stations.includes(toStation)) {
            setError('出发地或目的地无效，请从建议列表中选择。');
            return;
        }
        setError('');
        onQuery({ fromStation, toStation, departDate });
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={fromStation}
                    onChange={handleFromChange}
                    placeholder="出发地"
                    required
                    disabled={disabled}
                />
                {fromSuggestions.length > 0 && (
                    <ul style={{ position: 'absolute', zIndex: 1, listStyle: 'none', padding: 0, margin: 0, border: '1px solid #ccc', backgroundColor: 'white' }}>
                        {fromSuggestions.map(station => (
                            <li key={station} onClick={() => handleSuggestionClick(station, setFromStation, setFromSuggestions)} style={{ padding: '5px', cursor: 'pointer' }}>
                                {station}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <button type="button" onClick={() => {
                const temp = fromStation;
                setFromStation(toStation);
                setToStation(temp);
            }}>⇄</button>
            <div style={{ position: 'relative' }}>
                <input
                    type="text"
                    value={toStation}
                    onChange={handleToChange}
                    placeholder="目的地"
                    required
                    disabled={disabled}
                />
                {toSuggestions.length > 0 && (
                    <ul style={{ position: 'absolute', zIndex: 1, listStyle: 'none', padding: 0, margin: 0, border: '1px solid #ccc', backgroundColor: 'white' }}>
                        {toSuggestions.map(station => (
                            <li key={station} onClick={() => handleSuggestionClick(station, setToStation, setToSuggestions)} style={{ padding: '5px', cursor: 'pointer' }}>
                                {station}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
            <input
                type="date"
                value={departDate}
                onChange={(e) => setDepartDate(e.target.value)}
                required
                disabled={disabled}
            />
            <button type="submit" disabled={disabled}>查询</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
        </form>
    );
}

export default QueryForm;