import React, { useState, useEffect } from 'react';

function FilterPanel({ onFilterChange, availableFromStations = [], availableToStations = [] }) {
    const [trainTypes, setTrainTypes] = useState([]);
    const [seatTypes, setSeatTypes] = useState([]);
    const [selectedFromStations, setSelectedFromStations] = useState([]);
    const [selectedToStations, setSelectedToStations] = useState([]);

    const handleTrainTypeChange = (e) => {
        const { value, checked } = e.target;
        setTrainTypes(prev => checked ? [...prev, value] : prev.filter(t => t !== value));
    };

    const handleSeatTypeChange = (e) => {
        const { value, checked } = e.target;
        setSeatTypes(prev => checked ? [...prev, value] : prev.filter(t => t !== value));
    };

    const toggleFromStation = (station, checked) => {
        setSelectedFromStations(prev => checked ? [...prev, station] : prev.filter(s => s !== station));
    };

    const toggleToStation = (station, checked) => {
        setSelectedToStations(prev => checked ? [...prev, station] : prev.filter(s => s !== station));
    };

    const handleReset = () => {
        setTrainTypes([]);
        setSeatTypes([]);
        setSelectedFromStations([]);
        setSelectedToStations([]);
        document.querySelectorAll('.filter-panel input[type="checkbox"]').forEach(el => el.checked = false);
    };

    useEffect(() => {
        onFilterChange({ trainTypes, seatTypes, fromStations: selectedFromStations, toStations: selectedToStations });
    }, [trainTypes, seatTypes, selectedFromStations, selectedToStations]);

    return (
        <div className="filter-panel">
            <div className="filter-group">
                <h4>车次类型</h4>
                <div className="checkbox-group">
                    <label><input type="checkbox" value="G" onChange={handleTrainTypeChange} /> 高铁 (G)</label>
                    <label><input type="checkbox" value="D" onChange={handleTrainTypeChange} /> 动车 (D)</label>
                    <label><input type="checkbox" value="C" onChange={handleTrainTypeChange} /> 城际 (C)</label>
                    <label><input type="checkbox" value="Z" onChange={handleTrainTypeChange} /> 直达 (Z)</label>
                    <label><input type="checkbox" value="T" onChange={handleTrainTypeChange} /> 特快 (T)</label>
                    <label><input type="checkbox" value="K" onChange={handleTrainTypeChange} /> 快速 (K)</label>
                </div>
            </div>

            <div className="filter-group">
                <h4>出发车站</h4>
                <div className="checkbox-group">
                    {availableFromStations.length > 0 && (
                        <label><input type="checkbox" onChange={(e) => {
                            const checked = e.target.checked;
                            const nodes = Array.from(document.querySelectorAll('.filter-panel .from-station-item'));
                            nodes.forEach(n => { n.checked = checked; });
                            setSelectedFromStations(checked ? [...availableFromStations] : []);
                        }} /> 全部</label>
                    )}
                    {availableFromStations.map(st => (
                        <label key={`from-${st}`}>
                            <input className="from-station-item" type="checkbox" onChange={(e) => toggleFromStation(st, e.target.checked)} /> {st}
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-group">
                <h4>到达车站</h4>
                <div className="checkbox-group">
                    {availableToStations.length > 0 && (
                        <label><input type="checkbox" onChange={(e) => {
                            const checked = e.target.checked;
                            const nodes = Array.from(document.querySelectorAll('.filter-panel .to-station-item'));
                            nodes.forEach(n => { n.checked = checked; });
                            setSelectedToStations(checked ? [...availableToStations] : []);
                        }} /> 全部</label>
                    )}
                    {availableToStations.map(st => (
                        <label key={`to-${st}`}>
                            <input className="to-station-item" type="checkbox" onChange={(e) => toggleToStation(st, e.target.checked)} /> {st}
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-group">
                <h4>席别</h4>
                <div className="checkbox-group">
                    <label><input type="checkbox" value="商务座" onChange={handleSeatTypeChange} /> 商务座</label>
                    <label><input type="checkbox" value="一等座" onChange={handleSeatTypeChange} /> 一等座</label>
                    <label><input type="checkbox" value="二等座" onChange={handleSeatTypeChange} /> 二等座</label>
                    <label><input type="checkbox" value="软卧" onChange={handleSeatTypeChange} /> 软卧</label>
                    <label><input type="checkbox" value="硬卧" onChange={handleSeatTypeChange} /> 硬卧</label>
                    <label><input type="checkbox" value="硬座" onChange={handleSeatTypeChange} /> 硬座</label>
                </div>
            </div>
            <div className="filter-actions">
                <button onClick={handleReset} className="reset-btn">重置</button>
            </div>
        </div>
    );
}

export default FilterPanel;