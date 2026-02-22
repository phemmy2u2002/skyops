import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFlights, selectAllFlights } from '../store/flightSlice.js';
import { fetchWeatherBatch, selectWeatherByIcao } from '../store/weatherSlice.js';
import WeatherWidget from '../components/WeatherWidget.js';
import FlightMap from '../components/FlightMap.js';
import { formatUTC, formatDuration } from '../utils/formatters.js';

const BRIEFING_SECTIONS = ['Aircraft', 'Route & Fuel', 'Weather', 'NOTAMs', 'ATC', 'Crew'];

export default function Dispatch() {
  const dispatch = useDispatch();
  const flights = useSelector(selectAllFlights);
  const weatherMap = useSelector(selectWeatherByIcao);

  const [selectedFlightId, setSelectedFlightId] = useState('');
  const [acknowledged, setAcknowledged] = useState({});
  const [released, setReleased] = useState(false);
  const [remarks, setRemarks] = useState('');

  const scheduledFlights = flights.filter(
    (f) => f.status === 'SCHEDULED' || f.status === 'BOARDING'
  );

  const selectedFlight = flights.find((f) => f.id === selectedFlightId) ?? null;

  useEffect(() => {
    dispatch(fetchFlights());
  }, [dispatch]);

  useEffect(() => {
    if (selectedFlight) {
      const icaos = [
        selectedFlight.origin?.icao,
        selectedFlight.destination?.icao,
      ].filter(Boolean);
      if (icaos.length) dispatch(fetchWeatherBatch(icaos));
      // Reset briefing state on flight change
      setAcknowledged({});
      setReleased(false);
      setRemarks('');
    }
  }, [dispatch, selectedFlightId]);

  const allAcknowledged =
    BRIEFING_SECTIONS.length > 0 &&
    BRIEFING_SECTIONS.every((s) => acknowledged[s]);

  function toggleAck(section) {
    setAcknowledged((prev) => ({ ...prev, [section]: !prev[section] }));
  }

  function handleRelease() {
    if (!allAcknowledged) return;
    setReleased(true);
  }

  const originWeather = weatherMap[selectedFlight?.origin?.icao];
  const destWeather = weatherMap[selectedFlight?.destination?.icao];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Flight Dispatch</h1>
        <p className="text-sm text-gray-500 mt-0.5">Pre-flight release and briefing</p>
      </div>

      {/* Flight selector */}
      <div className="card max-w-md">
        <label className="block text-xs font-medium text-gray-600 mb-1">Select Flight</label>
        <select
          value={selectedFlightId}
          onChange={(e) => setSelectedFlightId(e.target.value)}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400"
        >
          <option value="">— Choose a flight —</option>
          {scheduledFlights.map((f) => (
            <option key={f.id} value={f.id}>
              {f.flightNumber} · {f.origin?.icao} → {f.destination?.icao} · {formatUTC(f.scheduledDeparture)}Z
            </option>
          ))}
        </select>
      </div>

      {!selectedFlight && (
        <div className="card text-center text-gray-400 py-16">
          <p className="text-4xl mb-3">🗂️</p>
          <p>Select a scheduled flight above to begin the dispatch briefing.</p>
        </div>
      )}

      {selectedFlight && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: briefing checklist */}
          <div className="lg:col-span-2 space-y-4">
            {/* Flight summary */}
            <div className="card bg-slate-800 text-white">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xl font-bold">{selectedFlight.flightNumber}</span>
                {released && (
                  <span className="status-badge bg-green-400 text-green-900 font-semibold">
                    ✓ RELEASED
                  </span>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <SummaryItem label="Origin" value={selectedFlight.origin?.icao} />
                <SummaryItem label="Destination" value={selectedFlight.destination?.icao} />
                <SummaryItem label="STD" value={`${formatUTC(selectedFlight.scheduledDeparture)}Z`} />
                <SummaryItem label="Est. Duration" value={formatDuration(selectedFlight.scheduledDeparture, selectedFlight.scheduledArrival)} />
                <SummaryItem label="Aircraft" value={selectedFlight.aircraft?.registration} />
                <SummaryItem label="Type" value={selectedFlight.aircraft?.type} />
                <SummaryItem label="Captain" value={selectedFlight.captain} />
                <SummaryItem label="F/O" value={selectedFlight.firstOfficer} />
              </div>
            </div>

            {/* Briefing checklist */}
            <div className="card space-y-3">
              <h3 className="font-semibold text-slate-700">Briefing Checklist</h3>
              {BRIEFING_SECTIONS.map((section) => (
                <label
                  key={section}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    acknowledged[section]
                      ? 'bg-green-50 border-green-200'
                      : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!acknowledged[section]}
                    onChange={() => toggleAck(section)}
                    disabled={released}
                    className="w-4 h-4 accent-green-600"
                  />
                  <span className={`text-sm font-medium ${acknowledged[section] ? 'text-green-700' : 'text-gray-700'}`}>
                    {section} briefing reviewed
                  </span>
                  {acknowledged[section] && <span className="ml-auto text-green-500 text-xs">✓</span>}
                </label>
              ))}
            </div>

            {/* Dispatcher remarks */}
            <div className="card">
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Dispatcher Remarks
              </label>
              <textarea
                value={remarks}
                onChange={(e) => setRemarks(e.target.value)}
                disabled={released}
                rows={3}
                placeholder="Add any special instructions or remarks…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 disabled:bg-gray-50 disabled:text-gray-400"
              />
            </div>

            {/* Release button */}
            <div className="flex items-center gap-3">
              {!released ? (
                <>
                  <button
                    onClick={handleRelease}
                    disabled={!allAcknowledged}
                    className={`btn-primary text-sm px-6 ${
                      !allAcknowledged ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    Release Flight
                  </button>
                  {!allAcknowledged && (
                    <span className="text-xs text-gray-400">
                      Complete all briefing sections to release
                    </span>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-green-600">
                  <span className="text-xl">✅</span>
                  <span className="font-medium">
                    {selectedFlight.flightNumber} released for departure
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right: map + weather */}
          <div className="space-y-4">
            <FlightMap flight={selectedFlight} />

            {originWeather && (
              <WeatherWidget
                icao={selectedFlight.origin?.icao}
                metar={originWeather?.metar}
                taf={originWeather?.taf}
                loading={originWeather?.loading}
                error={originWeather?.error}
              />
            )}
            {destWeather && (
              <WeatherWidget
                icao={selectedFlight.destination?.icao}
                metar={destWeather?.metar}
                taf={destWeather?.taf}
                loading={destWeather?.loading}
                error={destWeather?.error}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div>
      <p className="text-xs text-slate-400">{label}</p>
      <p className="font-medium text-white">{value ?? '—'}</p>
    </div>
  );
}
