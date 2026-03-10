import React from 'react';
import { formatUTC, formatDuration } from '../utils/formatters.js';

const STATUS_STYLES = {
  SCHEDULED: 'bg-blue-100 text-blue-800',
  BOARDING: 'bg-yellow-100 text-yellow-800',
  DEPARTED: 'bg-indigo-100 text-indigo-800',
  AIRBORNE: 'bg-green-100 text-green-800',
  LANDED: 'bg-gray-100 text-gray-700',
  DELAYED: 'bg-red-100 text-red-800',
  CANCELLED: 'bg-red-200 text-red-900',
  DIVERTED: 'bg-orange-100 text-orange-800',
};

export default function FlightCard({ flight, onClick, compact = false }) {
  if (!flight) return null;

  const {
    flightNumber,
    aircraft,
    origin,
    destination,
    scheduledDeparture,
    scheduledArrival,
    actualDeparture,
    status,
    captain,
    firstOfficer,
    altitude,
    groundSpeed,
  } = flight;

  const statusStyle = STATUS_STYLES[status] ?? 'bg-gray-100 text-gray-700';

  return (
    <div
      className={`card cursor-pointer hover:shadow-md transition-shadow duration-200 ${compact ? 'p-3' : 'p-4'}`}
      onClick={() => onClick?.(flight)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.(flight)}
    >
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <span className="text-lg font-bold text-slate-800 tracking-wide">
            {flightNumber}
          </span>
          {aircraft && (
            <span className="ml-2 text-xs text-gray-500 font-mono">
              {aircraft.registration} · {aircraft.type}
            </span>
          )}
        </div>
        <span className={`status-badge ${statusStyle}`}>{status}</span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-3 mb-3">
        <div className="text-center">
          <p className="text-xl font-bold text-slate-700">{origin?.icao}</p>
          <p className="text-xs text-gray-500">{origin?.name}</p>
          <p className="text-sm font-mono text-gray-600">
            {formatUTC(actualDeparture || scheduledDeparture)}
          </p>
        </div>

        <div className="flex-1 flex flex-col items-center">
          <div className="flex items-center w-full">
            <div className="h-px flex-1 bg-gray-300" />
            <span className="mx-2 text-gray-400">✈</span>
            <div className="h-px flex-1 bg-gray-300" />
          </div>
          <span className="text-xs text-gray-400 mt-1">
            {formatDuration(scheduledDeparture, scheduledArrival)}
          </span>
        </div>

        <div className="text-center">
          <p className="text-xl font-bold text-slate-700">{destination?.icao}</p>
          <p className="text-xs text-gray-500">{destination?.name}</p>
          <p className="text-sm font-mono text-gray-600">
            {formatUTC(scheduledArrival)}
          </p>
        </div>
      </div>

      {/* Details row (hidden in compact mode) */}
      {!compact && (
        <div className="border-t border-gray-100 pt-3 flex flex-wrap gap-4 text-xs text-gray-600">
          {captain && (
            <div>
              <span className="font-medium text-gray-700">Captain: </span>
              {captain}
            </div>
          )}
          {firstOfficer && (
            <div>
              <span className="font-medium text-gray-700">F/O: </span>
              {firstOfficer}
            </div>
          )}
          {altitude && (
            <div>
              <span className="font-medium text-gray-700">Alt: </span>
              FL{Math.round(altitude / 100)}
            </div>
          )}
          {groundSpeed && (
            <div>
              <span className="font-medium text-gray-700">GS: </span>
              {groundSpeed} kt
            </div>
          )}
        </div>
      )}
    </div>
  );
}
