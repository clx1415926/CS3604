import React, { useState, useEffect } from 'react';
import QueryForm from './components/QueryForm';
import TrainList from './components/TrainList';
import FilterPanel from './components/FilterPanel';

function App() {
    const [trains, setTrains] = useState([]);
    const [stations, setStations] = useState([]);
    const [query, setQuery] = useState(null);
    const [filters, setFilters] = useState({ trainTypes: [], seatTypes: [] });
    const [stationsLoaded, setStationsLoaded] = useState(false);

    const handleQuery = (query) => {
        setQuery(query);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
    };

    useEffect(() => {
        const fetchStations = async () => {
            const response = await fetch(`http://localhost:3000/api/stations`);
            const data = await response.json();
            if (data.stations) {
                setStations(data.stations);
                setStationsLoaded(true);
            }
        };
        fetchStations();
    }, []);

    useEffect(() => {
        if (query) {
            const fetchTickets = async () => {
                const params = new URLSearchParams({
                    ...query,
                    ...filters,
                });
                const response = await fetch(`http://localhost:3000/api/tickets?${params}`);
                const data = await response.json();
                setTrains(data.trains);
            };
            fetchTickets();
        }
    }, [query, filters]);

    return (
        <div>
            <h1>12306 车票查询</h1>
            <QueryForm onQuery={handleQuery} stations={stations} disabled={!stationsLoaded} />
            <div style={{ display: 'block', marginTop: '20px' }}>
                <FilterPanel onFilterChange={handleFilterChange} />
                <div style={{ flex: 1, marginTop: '20px' }}>
                    <TrainList trains={trains} />
                </div>
            </div>
        </div>
    );
}

export default App;