import React, { useState } from 'react';
import { formatUTC } from '../utils/formatters.js';

const TYPE_LABELS = {
  N: 'New',
  R: 'Replaced',
  C: 'Cancelled',
};

const PURPOSE_COLORS = {
  NM: 'bg-blue-100 text-blue-800',
  BO: 'bg-orange-100 text-orange-800',
  MIL: 'bg-red-100 text-red-800',
  CHECKLIST: 'bg-gray-100 text-gray-700',
};

export default function NotamList({ notams = [], loading, error, onSelect }) {
  const [expanded, setExpanded] = useState(null);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="card animate-pulse">
            <div className="h-3 bg-gray-200 rounded w-1/3 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="card border-red-200 text-sm text-red-600">
        ⚠ Failed to load NOTAMs: {error}
      </div>
    );
  }

  if (!notams.length) {
    return (
      <div className="card text-center text-gray-500 py-8">
        <p className="text-4xl mb-2">📋</p>
        <p>No NOTAMs found for the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notams.map((notam) => {
        const isExpanded = expanded === notam.id;
        const purposeColor =
          PURPOSE_COLORS[notam.purpose] ?? PURPOSE_COLORS.CHECKLIST;

        return (
          <div
            key={notam.id}
            className={`card border transition-shadow ${
              isExpanded ? 'border-sky-300 shadow-sm' : 'border-gray-100'
            }`}
          >
            {/* NOTAM header */}
            <button
              className="w-full text-left"
              onClick={() => {
                setExpanded(isExpanded ? null : notam.id);
                onSelect?.(notam);
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-sm font-bold text-slate-700">
                    {notam.id}
                  </span>
                  <span className={`status-badge ${purposeColor}`}>
                    {notam.type ? TYPE_LABELS[notam.type] ?? notam.type : 'NOTAM'}
                  </span>
                  {notam.location && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-mono">
                      {notam.location}
                    </span>
                  )}
                </div>
                <span className="text-gray-400 shrink-0 text-sm">
                  {isExpanded ? '▲' : '▼'}
                </span>
              </div>

              {/* Subject line */}
              <p className="mt-1 text-sm text-gray-700 line-clamp-2 text-left">
                {notam.subject || notam.text}
              </p>

              {/* Validity */}
              <div className="mt-1 flex gap-3 text-xs text-gray-400">
                {notam.effectiveFrom && (
                  <span>From: {formatUTC(notam.effectiveFrom)}Z</span>
                )}
                {notam.effectiveTo && (
                  <span>To: {notam.effectiveTo === 'PERM' ? 'PERMANENT' : `${formatUTC(notam.effectiveTo)}Z`}</span>
                )}
              </div>
            </button>

            {/* Expanded full text */}
            {isExpanded && (
              <div className="mt-3 border-t border-gray-100 pt-3">
                <pre className="text-xs font-mono text-gray-700 whitespace-pre-wrap bg-gray-50 rounded p-3 max-h-48 overflow-y-auto">
                  {notam.fullText || notam.text}
                </pre>
                {notam.lowerLimit !== undefined && (
                  <div className="mt-2 flex gap-4 text-xs text-gray-500">
                    <span>Lower: {notam.lowerLimit} ft</span>
                    <span>Upper: {notam.upperLimit} ft</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
