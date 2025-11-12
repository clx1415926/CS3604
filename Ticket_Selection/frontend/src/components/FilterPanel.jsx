import React, { useState, useEffect } from 'react';

function FilterPanel({ onFilterChange }) {
    const [trainTypes, setTrainTypes] = useState([]);
    const [seatTypes, setSeatTypes] = useState([]);

    const handleTrainTypeChange = (e) => {
        const { value, checked } = e.target;
        setTrainTypes(prev => checked ? [...prev, value] : prev.filter(t => t !== value));
    };

    const handleSeatTypeChange = (e) => {
        const { value, checked } = e.target;
        setSeatTypes(prev => checked ? [...prev, value] : prev.filter(t => t !== value));
    };

    useEffect(() => {
        onFilterChange({ trainTypes, seatTypes });
    }, [trainTypes, seatTypes]);

    return (
        <div style={{ width: '250px', padding: '15px', border: '1px solid #eee', borderRadius: '4px' }}>
            <h4>车次类型</h4>
            <div>
                <label><input type="checkbox" value="G" onChange={handleTrainTypeChange} /> 高铁</label>
                <label><input type="checkbox" value="D" onChange={handleTrainTypeChange} /> 动车</label>
                <label><input type="checkbox" value="Z" onChange={handleTrainTypeChange} /> 直达</label>
            </div>
            <h4 style={{ marginTop: '20px' }}>席别</h4>
            <div>
                <label>
                    <input type="checkbox" name="seatTypes" value="一等座" onChange={handleSeatTypeChange} /> 一等座
                </label>
                <label>
                    <input type="checkbox" name="seatTypes" value="二等座" onChange={handleSeatTypeChange} /> 二等座
                </label>
                <label>
                    <input type="checkbox" name="seatTypes" value="软卧" onChange={handleSeatTypeChange} /> 软卧
                </label>
                <label>
                    <input type="checkbox" name="seatTypes" value="硬卧" onChange={handleSeatTypeChange} /> 硬卧
                </label>
                <label>
                    <input type="checkbox" name="seatTypes" value="商务座" onChange={handleSeatTypeChange} /> 商务座
                </label>
            </div>
        </div>
    );
}

export default FilterPanel;