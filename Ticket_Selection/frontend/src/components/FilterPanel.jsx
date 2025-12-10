import React, { useState, useEffect } from 'react';

function FilterPanel({ onFilterChange, availableFromStations = [], availableToStations = [], initialTrainTypes = [], initialStudent = false }) {
    const [trainTypes, setTrainTypes] = useState([]);
    const [seatTypes, setSeatTypes] = useState([]);
    const [selectedFromStations, setSelectedFromStations] = useState([]);
    const [selectedToStations, setSelectedToStations] = useState([]);
    const [isStudent, setIsStudent] = useState(false);
    useEffect(() => { console.log('[FilterPanel] mount', { initialTrainTypes, initialStudent }); }, []);

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
        const payload = { trainTypes, seatTypes, fromStations: selectedFromStations, toStations: selectedToStations, student: isStudent ? '1' : '0' };
        console.log('[FilterPanel] change', payload);
        onFilterChange(payload);
    }, [trainTypes, seatTypes, selectedFromStations, selectedToStations, isStudent]);

    useEffect(() => {
        try {
            if (Array.isArray(initialTrainTypes) && initialTrainTypes.length > 0) {
                setTrainTypes(initialTrainTypes);
                const nodes = Array.from(document.querySelectorAll('.filter-panel .train-type-item'));
                nodes.forEach(n => { if (initialTrainTypes.includes(n.value)) n.checked = true; });
                console.log('[FilterPanel] apply initialTrainTypes', initialTrainTypes);
            }
            if (initialStudent) {
                setIsStudent(true);
                const studentNode = document.querySelector('.filter-panel .student-item');
                if (studentNode) studentNode.checked = true;
                console.log('[FilterPanel] apply initialStudent', initialStudent);
            }
        } catch (e) {}
    }, []);

    return (
        <div className="filter-panel">
            <div className="filter-group">
                <h4>车次类型:</h4>
                <div className="checkbox-group">
                    <label><input className="train-type-item check" name="cc_type" type="checkbox" value="G" onChange={handleTrainTypeChange} /> GC-高铁/城际</label>
                    <label><input className="train-type-item check" name="cc_type" type="checkbox" value="D" onChange={handleTrainTypeChange} /> D-动车</label>
                    <label><input className="train-type-item check" name="cc_type" type="checkbox" value="Z" onChange={handleTrainTypeChange} /> Z-直达</label>
                    <label><input className="train-type-item check" name="cc_type" type="checkbox" value="T" onChange={handleTrainTypeChange} /> T-特快</label>
                    <label><input className="train-type-item check" name="cc_type" type="checkbox" value="K" onChange={handleTrainTypeChange} /> K-快速</label>
                    <label><input className="train-type-item check" name="cc_type" type="checkbox" value="OTHER" onChange={handleTrainTypeChange} /> 其他</label>
                </div>
            </div>

            <div className="filter-group">
                <h4>显示选项:</h4>
                <div className="checkbox-group">
                    <label><input id="avail_zk" className="check" type="checkbox" /> 显示折扣车次</label>
                    <label><input id="avail_jf" className="check" type="checkbox" /> 显示积分兑换车次</label>
                    <label><input id="avail_ticket" className="check" type="checkbox" /> 显示全部可预订车次</label>
                    <label><input className="student-item check" type="checkbox" onChange={(e) => setIsStudent(e.target.checked)} /> 学生票</label>
                </div>
            </div>

            <div className="filter-group">
                <h4>出发车站:</h4>
                <div className="checkbox-group">
                    {availableFromStations.length > 0 && (
                        <label><input className="check" type="checkbox" onChange={(e) => {
                            const checked = e.target.checked;
                            const nodes = Array.from(document.querySelectorAll('.filter-panel .from-station-item'));
                            nodes.forEach(n => { n.checked = checked; });
                            setSelectedFromStations(checked ? [...availableFromStations] : []);
                        }} /> 全部</label>
                    )}
                    {availableFromStations.map(st => (
                        <label key={`from-${st}`}>
                            <input className="from-station-item check" type="checkbox" onChange={(e) => toggleFromStation(st, e.target.checked)} /> {st}
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-group">
                <h4>到达车站:</h4>
                <div className="checkbox-group">
                    {availableToStations.length > 0 && (
                        <label><input className="check" type="checkbox" onChange={(e) => {
                            const checked = e.target.checked;
                            const nodes = Array.from(document.querySelectorAll('.filter-panel .to-station-item'));
                            nodes.forEach(n => { n.checked = checked; });
                            setSelectedToStations(checked ? [...availableToStations] : []);
                        }} /> 全部</label>
                    )}
                    {availableToStations.map(st => (
                        <label key={`to-${st}`}>
                            <input className="to-station-item check" type="checkbox" onChange={(e) => toggleToStation(st, e.target.checked)} /> {st}
                        </label>
                    ))}
                </div>
            </div>

            <div className="filter-group">
                <h4>车次席别:</h4>
                <div className="checkbox-group">
                    <label><input className="seat-type-item check" type="checkbox" value="商务座" onChange={handleSeatTypeChange} /> 商务座/特等座</label>
                    <label><input className="seat-type-item check" type="checkbox" value="一等座" onChange={handleSeatTypeChange} /> 一等座</label>
                    <label><input className="seat-type-item check" type="checkbox" value="二等座" onChange={handleSeatTypeChange} /> 二等座</label>
                    <label><input className="seat-type-item check" type="checkbox" value="软卧" onChange={handleSeatTypeChange} /> 软卧/动卧/一等卧</label>
                    <label><input className="seat-type-item check" type="checkbox" value="硬卧" onChange={handleSeatTypeChange} /> 硬卧/二等卧</label>
                    <label><input className="seat-type-item check" type="checkbox" value="硬座" onChange={handleSeatTypeChange} /> 硬座</label>
                    <label><input className="seat-type-item check" type="checkbox" value="无座" onChange={handleSeatTypeChange} /> 无座</label>
                </div>
            </div>
            <div className="filter-actions">
                <button onClick={() => { setIsStudent(false); handleReset(); }} className="reset-btn">重置</button>
            </div>
        </div>
    );
}

export default FilterPanel;
