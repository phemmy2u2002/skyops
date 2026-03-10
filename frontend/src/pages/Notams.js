import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchNotams, selectAllNotams, selectNotamsLoading, selectNotamsError } from '../store/flightSlice.js';
import NotamList from '../components/NotamList.js';
import { validateIcao } from '../utils/validators.js';

const NOTAM_TYPES = ['All', 'Aerodrome', 'Navigation', 'Airspace', 'Obstacle', 'Warning'];

export default function Notams() {
  const dispatch = useDispatch();
  const notams = useSelector(selectAllNotams);
  const loading = useSelector(selectNotamsLoading);
  const error = useSelector(selectNotamsError);

  const [icaoInput, setIcaoInput] = useState('');
  const [icaoError, setIcaoError] = useState('');
  const [activeIcao, setActiveIcao] = useState('KJFK');
  const [typeFilter, setTypeFilter] = useState('All');
  const [freeText, setFreeText] = useState('');
  const [selectedNotam, setSelectedNotam] = useState(null);

  useEffect(() => {
    dispatch(fetchNotams({ icao: activeIcao }));
  }, [dispatch, activeIcao]);

  function handleSearch(e) {
    e.preventDefault();
    const icao = icaoInput.trim().toUpperCase();
    if (!validateIcao(icao)) {
      setIcaoError('Enter a valid 4-letter ICAO code');
      return;
    }
    setIcaoError('');
    setActiveIcao(icao);
    setIcaoInput('');
  }

  const filtered = notams.filter((n) => {
    const matchType =
      typeFilter === 'All' || n.category?.toLowerCase() === typeFilter.toLowerCase();
    const q = freeText.toLowerCase();
    const matchText =
      !q ||
      n.id?.toLowerCase().includes(q) ||
      n.text?.toLowerCase().includes(q) ||
      n.subject?.toLowerCase().includes(q);
    return matchType && matchText;
  });

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">NOTAMs</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Notices to Air Missions for <span className="font-mono font-semibold text-sky-600">{activeIcao}</span>
        </p>
      </div>

      {/* Airport search */}
      <form onSubmit={handleSearch} className="flex gap-2 items-start">
        <div>
          <div className="flex gap-2">
            <input
              value={icaoInput}
              onChange={(e) => { setIcaoInput(e.target.value.toUpperCase()); setIcaoError(''); }}
              placeholder="ICAO (e.g. EGLL)"
              maxLength={4}
              className="border border-gray-300 rounded-lg px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-sky-400 w-36"
            />
            <button type="submit" className="btn-primary text-sm">Search</button>
          </div>
          {icaoError && <p className="text-xs text-red-500 mt-1">{icaoError}</p>}
        </div>
      </form>

      {/* Filters row */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Type filter chips */}
        <div className="flex gap-1 flex-wrap">
          {NOTAM_TYPES.map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                typeFilter === t
                  ? 'bg-sky-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {/* Free-text search */}
        <input
          type="search"
          placeholder="Filter text…"
          value={freeText}
          onChange={(e) => setFreeText(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 w-48"
        />

        {filtered.length > 0 && (
          <span className="text-xs text-gray-400">{filtered.length} NOTAM{filtered.length !== 1 ? 's' : ''}</span>
        )}
      </div>

      {/* Two-column layout on large screens */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        <div className="lg:col-span-3">
          <NotamList
            notams={filtered}
            loading={loading}
            error={error}
            onSelect={setSelectedNotam}
          />
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2">
          {selectedNotam ? (
            <div className="card sticky top-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-slate-700 font-mono">{selectedNotam.id}</h3>
                <button onClick={() => setSelectedNotam(null)} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
              <div className="space-y-2 text-sm">
                <NotamDetailRow label="Type" value={selectedNotam.type} />
                <NotamDetailRow label="Category" value={selectedNotam.category} />
                <NotamDetailRow label="Location" value={selectedNotam.location} />
                <NotamDetailRow label="Effective" value={`${selectedNotam.effectiveFrom} → ${selectedNotam.effectiveTo}`} />
                <NotamDetailRow label="Lower" value={selectedNotam.lowerLimit !== undefined ? `${selectedNotam.lowerLimit} ft` : undefined} />
                <NotamDetailRow label="Upper" value={selectedNotam.upperLimit !== undefined ? `${selectedNotam.upperLimit} ft` : undefined} />
              </div>
              <pre className="mt-3 text-xs font-mono text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-3 max-h-64 overflow-y-auto">
                {selectedNotam.fullText || selectedNotam.text}
              </pre>
            </div>
          ) : (
            <div className="card flex items-center justify-center h-36 text-gray-400 text-sm">
              Select a NOTAM to view full details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NotamDetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-24 shrink-0">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}
