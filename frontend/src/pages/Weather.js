import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWeatherBatch, selectWeatherByIcao } from '../store/weatherSlice.js';
import WeatherWidget from '../components/WeatherWidget.js';
import { validateIcao } from '../utils/validators.js';

const DEFAULT_AIRPORTS = ['KJFK', 'KLAX', 'EGLL', 'EDDF', 'OMDB', 'VHHH', 'YSSY', 'CYYZ'];

export default function Weather() {
  const dispatch = useDispatch();
  const weatherMap = useSelector(selectWeatherByIcao);
  const [airports, setAirports] = useState(DEFAULT_AIRPORTS);
  const [input, setInput] = useState('');
  const [inputError, setInputError] = useState('');

  useEffect(() => {
    dispatch(fetchWeatherBatch(airports));
  }, [dispatch, airports]);

  function handleAdd(e) {
    e.preventDefault();
    const icao = input.trim().toUpperCase();
    if (!validateIcao(icao)) {
      setInputError('Enter a valid 4-letter ICAO code (e.g. KJFK)');
      return;
    }
    if (airports.includes(icao)) {
      setInputError(`${icao} is already in the list`);
      return;
    }
    setAirports((prev) => [...prev, icao]);
    setInput('');
    setInputError('');
  }

  function handleRemove(icao) {
    setAirports((prev) => prev.filter((a) => a !== icao));
  }

  function handleRefresh() {
    dispatch(fetchWeatherBatch(airports));
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Weather</h1>
          <p className="text-sm text-gray-500 mt-0.5">METAR &amp; TAF for monitored airports</p>
        </div>
        <button onClick={handleRefresh} className="btn-secondary text-sm flex items-center gap-1">
          🔄 Refresh
        </button>
      </div>

      {/* Add airport */}
      <form onSubmit={handleAdd} className="flex gap-2 items-start">
        <div>
          <input
            value={input}
            onChange={(e) => {
              setInput(e.target.value.toUpperCase());
              setInputError('');
            }}
            placeholder="Add ICAO (e.g. EGLL)"
            maxLength={4}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-400 w-36"
          />
          {inputError && (
            <p className="text-xs text-red-500 mt-1">{inputError}</p>
          )}
        </div>
        <button type="submit" className="btn-primary text-sm">Add Airport</button>
      </form>

      {/* Airport chips */}
      <div className="flex flex-wrap gap-2">
        {airports.map((icao) => {
          const cat = weatherMap[icao]?.metar?.flightCategory;
          const colors = {
            VFR: 'bg-green-100 text-green-800',
            MVFR: 'bg-blue-100 text-blue-800',
            IFR: 'bg-red-100 text-red-800',
            LIFR: 'bg-purple-100 text-purple-800',
          };
          const style = colors[cat] ?? 'bg-gray-100 text-gray-700';
          return (
            <span
              key={icao}
              className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-mono font-medium ${style}`}
            >
              {icao}
              {cat && <span className="opacity-60">·{cat}</span>}
              <button
                onClick={() => handleRemove(icao)}
                className="ml-1 hover:text-red-600 transition-colors"
                aria-label={`Remove ${icao}`}
              >
                ✕
              </button>
            </span>
          );
        })}
      </div>

      {/* Weather grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {airports.map((icao) => {
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
  );
}
