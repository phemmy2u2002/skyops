import React, { useState } from 'react';
import { formatUTC } from '../utils/formatters.js';

const FLIGHT_CATEGORY_STYLES = {
  VFR: 'bg-green-100 text-green-800 border-green-200',
  MVFR: 'bg-blue-100 text-blue-800 border-blue-200',
  IFR: 'bg-red-100 text-red-800 border-red-200',
  LIFR: 'bg-purple-100 text-purple-800 border-purple-200',
};

function parseVisibility(metar) {
  const match = metar?.raw?.match(/\b(\d{4}|[MP]?\d+(?:\/\d+)?SM)\b/);
  return match ? match[1] : 'N/A';
}

function WindDisplay({ direction, speed, gust }) {
  if (!speed && speed !== 0) return <span className="text-gray-400">—</span>;
  const gustStr = gust ? `G${gust}` : '';
  const dirStr = direction === 0 && speed === 0 ? 'CALM' : `${String(direction).padStart(3, '0')}°`;
  return (
    <span className="font-mono">
      {dirStr} {speed}{gustStr} kt
    </span>
  );
}

export default function WeatherWidget({ icao, metar, taf, loading, error }) {
  const [activeTab, setActiveTab] = useState('metar');

  if (loading) {
    return (
      <div className="card animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-full" />
          <div className="h-3 bg-gray-200 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200">
        <p className="text-sm text-red-600">
          ⚠ Failed to load weather for {icao}: {error}
        </p>
      </div>
    );
  }

  const flightCategory = metar?.flightCategory ?? 'VFR';
  const categoryStyle =
    FLIGHT_CATEGORY_STYLES[flightCategory] ?? FLIGHT_CATEGORY_STYLES.VFR;

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-slate-700">{icao}</h3>
          <span
            className={`status-badge border ${categoryStyle} font-semibold`}
          >
            {flightCategory}
          </span>
        </div>
        {metar?.observationTime && (
          <span className="text-xs text-gray-400 font-mono">
            {formatUTC(metar.observationTime)}Z
          </span>
        )}
      </div>

      {/* Weather fields */}
      {metar && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm mb-3">
          <WeatherField label="Wind">
            <WindDisplay
              direction={metar.windDirection}
              speed={metar.windSpeed}
              gust={metar.windGust}
            />
          </WeatherField>
          <WeatherField label="Visibility">
            {metar.visibility ?? parseVisibility(metar)} SM
          </WeatherField>
          <WeatherField label="Ceiling">
            {metar.ceiling ? `${metar.ceiling} ft` : 'CLR'}
          </WeatherField>
          <WeatherField label="Temp / Dew">
            {metar.temperature}° / {metar.dewpoint}° C
          </WeatherField>
          <WeatherField label="Altimeter">
            {metar.altimeter ? `${metar.altimeter} inHg` : '—'}
          </WeatherField>
          <WeatherField label="Conditions">
            {metar.conditions?.join(', ') || 'Clear'}
          </WeatherField>
        </div>
      )}

      {/* METAR / TAF Tabs */}
      <div className="border-t border-gray-100 pt-3">
        <div className="flex gap-2 mb-2">
          {['metar', 'taf'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-medium px-3 py-1 rounded-full transition-colors ${
                activeTab === tab
                  ? 'bg-sky-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        <pre className="text-xs text-gray-600 font-mono whitespace-pre-wrap bg-gray-50 rounded p-2 max-h-32 overflow-y-auto">
          {activeTab === 'metar'
            ? metar?.raw ?? 'No METAR available'
            : taf?.raw ?? 'No TAF available'}
        </pre>
      </div>
    </div>
  );
}

function WeatherField({ label, children }) {
  return (
    <div>
      <span className="text-xs text-gray-400 block">{label}</span>
      <span className="font-medium text-gray-700">{children}</span>
    </div>
  );
}
