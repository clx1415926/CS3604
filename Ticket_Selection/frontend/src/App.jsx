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

    return (
        <div>
            <Header />
            <main className="container">
                <QueryForm onQuery={handleQuery} stations={stations} disabled={!stationsLoaded} />
                <div style={{ display: 'block', marginTop: '20px' }}>
                    <FilterPanel onFilterChange={handleFilterChange}
                        availableFromStations={[...new Set(trains.map(t => t.fromStation))]}
                        availableToStations={[...new Set(trains.map(t => t.toStation))]}
                    />
                    <div style={{ flex: 1, marginTop: '20px' }}>
                        <TrainList trains={trains} />
                    </div>
                </div>
            </main>
        </div>
    );
}

export default App;