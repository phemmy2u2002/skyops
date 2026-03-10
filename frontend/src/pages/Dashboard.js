import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { fetchFlights, selectActiveFlights, selectFlightStats } from '../store/flightSlice.js';
import { fetchWeatherBatch, selectWeatherByIcao } from '../store/weatherSlice.js';
import FlightCard from '../components/FlightCard.js';
import WeatherWidget from '../components/WeatherWidget.js';

const HUB_AIRPORTS = ['KJFK', 'KLAX', 'EGLL', 'EDDF'];

export default function Dashboard() {
  const dispatch = useDispatch();
  const activeFlights = useSelector(selectActiveFlights);
  const stats = useSelector(selectFlightStats);
  const weatherMap = useSelector(selectWeatherByIcao);

  useEffect(() => {
    dispatch(fetchFlights());
    dispatch(fetchWeatherBatch(HUB_AIRPORTS));
  }, [dispatch]);

  return (
    <div className="space-y-6">
      {/* Page title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Operations Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time flight operations overview</p>
        </div>
        <Link to="/dispatch" className="btn-primary text-sm">
          + New Dispatch
        </Link>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KpiCard label="Active Flights" value={stats.active} icon="✈️" color="text-sky-600" />
        <KpiCard label="Scheduled Today" value={stats.scheduledToday} icon="📅" color="text-blue-600" />
        <KpiCard label="Delayed" value={stats.delayed} icon="⏱️" color="text-yellow-600" />
        <KpiCard label="Completed Today" value={stats.completedToday} icon="✅" color="text-green-600" />
      </div>

      {/* Active flights + chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active flights list */}
        <div className="lg:col-span-2 space-y-3">
          <SectionHeader title="Active Flights" linkTo="/flights" linkLabel="View all" />
          {activeFlights.length === 0 ? (
            <div className="card text-center text-gray-400 py-10">No active flights at this time</div>
          ) : (
            activeFlights.slice(0, 4).map((f) => (
              <FlightCard key={f.id} flight={f} compact />
            ))
          )}
        </div>

        {/* Status chart */}
        <div className="card">
          <SectionHeader title="Today's Status" />
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={stats.chartData ?? DEMO_CHART} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar dataKey="count" fill="#0ea5e9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Hub weather */}
      <div>
        <SectionHeader title="Hub Weather" linkTo="/weather" linkLabel="Full weather" />
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mt-3">
          {HUB_AIRPORTS.map((icao) => {
            const wx = weatherMap[icao];
            return (
              <WeatherWidget
                key={icao}
                icao={icao}
                metar={wx?.metar}
                taf={wx?.taf}
                loading={wx?.loading}
                error={wx?.error}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, icon, color }) {
  return (
    <div className="card flex items-center gap-3">
      <span className="text-3xl">{icon}</span>
      <div>
        <p className={`text-2xl font-bold ${color}`}>{value ?? '—'}</p>
        <p className="text-xs text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function SectionHeader({ title, linkTo, linkLabel }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-base font-semibold text-slate-700">{title}</h2>
      {linkTo && (
        <Link to={linkTo} className="text-xs text-sky-600 hover:underline">
          {linkLabel} →
        </Link>
      )}
    </div>
  );
}

const DEMO_CHART = [
  { name: 'Sched', count: 12 },
  { name: 'Board', count: 3 },
  { name: 'Air', count: 8 },
  { name: 'Land', count: 5 },
  { name: 'Delay', count: 2 },
  { name: 'Cancel', count: 1 },
];
