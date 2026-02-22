import React from 'react';

/**
 * FlightMap renders a simple SVG-based flight route visualization.
 * In production this would integrate with a mapping library such as
 * Leaflet or MapboxGL with real aviation chart tiles.
 */
export default function FlightMap({ flight, className = '' }) {
  if (!flight) {
    return (
      <div className={`card flex items-center justify-center h-48 ${className}`}>
        <p className="text-gray-400 text-sm">No flight selected</p>
      </div>
    );
  }

  const { origin, destination, waypoints = [], progress = 0 } = flight;

  // Normalize lat/lon to SVG canvas coordinates [0, 100]
  function toSVG(lat, lon, minLat, maxLat, minLon, maxLon) {
    const x = ((lon - minLon) / (maxLon - minLon || 1)) * 90 + 5;
    const y = 95 - ((lat - minLat) / (maxLat - minLat || 1)) * 90;
    return { x, y };
  }

  const allPoints = [origin, ...waypoints, destination].filter(Boolean);
  const lats = allPoints.map((p) => p.lat).filter(Boolean);
  const lons = allPoints.map((p) => p.lon).filter(Boolean);
  const minLat = Math.min(...lats) - 2;
  const maxLat = Math.max(...lats) + 2;
  const minLon = Math.min(...lons) - 2;
  const maxLon = Math.max(...lons) + 2;

  const points = allPoints.map((p) =>
    p.lat && p.lon ? toSVG(p.lat, p.lon, minLat, maxLat, minLon, maxLon) : null
  );

  const validPoints = points.filter(Boolean);
  if (validPoints.length < 2) {
    return <MapPlaceholder origin={origin} destination={destination} className={className} />;
  }

  const polyline = validPoints.map((p) => `${p.x},${p.y}`).join(' ');

  // Compute aircraft position along the route based on progress (0-100)
  const idx = Math.min(
    Math.floor((progress / 100) * (validPoints.length - 1)),
    validPoints.length - 2
  );
  const frac = ((progress / 100) * (validPoints.length - 1)) % 1;
  const acPos = {
    x: validPoints[idx].x + (validPoints[idx + 1].x - validPoints[idx].x) * frac,
    y: validPoints[idx].y + (validPoints[idx + 1].y - validPoints[idx].y) * frac,
  };

  return (
    <div className={`card overflow-hidden ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-semibold text-gray-700">
          {origin?.icao} → {destination?.icao}
        </h4>
        {progress > 0 && (
          <span className="text-xs text-sky-600 font-medium">{progress}% complete</span>
        )}
      </div>

      <svg viewBox="0 0 100 100" className="w-full rounded bg-sky-50 border border-sky-100">
        {/* Grid lines */}
        {[20, 40, 60, 80].map((v) => (
          <React.Fragment key={v}>
            <line x1={v} y1="0" x2={v} y2="100" stroke="#e0f2fe" strokeWidth="0.3" />
            <line x1="0" y1={v} x2="100" y2={v} stroke="#e0f2fe" strokeWidth="0.3" />
          </React.Fragment>
        ))}

        {/* Planned route (dashed) */}
        <polyline
          points={polyline}
          fill="none"
          stroke="#94a3b8"
          strokeWidth="0.8"
          strokeDasharray="2,1.5"
        />

        {/* Completed route (solid) */}
        {progress > 0 && (
          <polyline
            points={[...validPoints.slice(0, idx + 1), acPos]
              .map((p) => `${p.x},${p.y}`)
              .join(' ')}
            fill="none"
            stroke="#0ea5e9"
            strokeWidth="1"
          />
        )}

        {/* Waypoints */}
        {validPoints.slice(1, -1).map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="1" fill="#64748b" />
        ))}

        {/* Origin */}
        <circle cx={validPoints[0].x} cy={validPoints[0].y} r="2" fill="#22c55e" />
        <text x={validPoints[0].x + 2} y={validPoints[0].y - 1.5} fontSize="3.5" fill="#15803d">
          {origin?.icao}
        </text>

        {/* Destination */}
        <circle
          cx={validPoints[validPoints.length - 1].x}
          cy={validPoints[validPoints.length - 1].y}
          r="2"
          fill="#ef4444"
        />
        <text
          x={validPoints[validPoints.length - 1].x + 2}
          y={validPoints[validPoints.length - 1].y - 1.5}
          fontSize="3.5"
          fill="#b91c1c"
        >
          {destination?.icao}
        </text>

        {/* Aircraft icon */}
        {progress > 0 && (
          <text x={acPos.x - 2.5} y={acPos.y + 1.5} fontSize="5" fill="#0369a1">
            ✈
          </text>
        )}
      </svg>
    </div>
  );
}

function MapPlaceholder({ origin, destination, className }) {
  return (
    <div className={`card flex flex-col items-center justify-center h-48 bg-sky-50 ${className}`}>
      <div className="flex items-center gap-4 text-slate-600">
        <div className="text-center">
          <p className="text-2xl font-bold">{origin?.icao ?? '???'}</p>
          <p className="text-xs text-gray-400">{origin?.name}</p>
        </div>
        <div className="flex items-center gap-1 text-sky-500">
          <div className="h-px w-8 bg-sky-300" />
          <span className="text-xl">✈</span>
          <div className="h-px w-8 bg-sky-300" />
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{destination?.icao ?? '???'}</p>
          <p className="text-xs text-gray-400">{destination?.name}</p>
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">Coordinate data unavailable for map render</p>
    </div>
  );
}
