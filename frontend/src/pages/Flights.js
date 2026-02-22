import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchFlights,
  createFlight,
  deleteFlight,
  selectAllFlights,
  selectFlightsLoading,
  selectFlightsError,
} from '../store/flightSlice.js';
import FlightCard from '../components/FlightCard.js';
import FlightMap from '../components/FlightMap.js';
import { validateFlightForm } from '../utils/validators.js';

const STATUSES = ['ALL', 'SCHEDULED', 'BOARDING', 'AIRBORNE', 'LANDED', 'DELAYED', 'CANCELLED'];

const EMPTY_FORM = {
  flightNumber: '',
  originIcao: '',
  destinationIcao: '',
  scheduledDeparture: '',
  scheduledArrival: '',
  aircraftType: '',
  registration: '',
  captain: '',
  firstOfficer: '',
};

export default function Flights() {
  const dispatch = useDispatch();
  const flights = useSelector(selectAllFlights);
  const loading = useSelector(selectFlightsLoading);
  const error = useSelector(selectFlightsError);

  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    dispatch(fetchFlights());
  }, [dispatch]);

  const filtered = flights.filter((f) => {
    const matchStatus = statusFilter === 'ALL' || f.status === statusFilter;
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      f.flightNumber?.toLowerCase().includes(q) ||
      f.origin?.icao?.toLowerCase().includes(q) ||
      f.destination?.icao?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  function handleFormChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) setFormErrors((prev) => ({ ...prev, [name]: '' }));
  }

  function handleSubmit(e) {
    e.preventDefault();
    const errors = validateFlightForm(form);
    if (Object.keys(errors).length) {
      setFormErrors(errors);
      return;
    }
    dispatch(createFlight(form));
    setShowForm(false);
    setForm(EMPTY_FORM);
  }

  function handleDelete(id) {
    if (window.confirm('Delete this flight? This action cannot be undone.')) {
      dispatch(deleteFlight(id));
      if (selectedFlight?.id === id) setSelectedFlight(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-800">Flights</h1>
        <button className="btn-primary text-sm" onClick={() => setShowForm(true)}>
          + New Flight
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          placeholder="Search flight, airport…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-400 w-56"
        />
        <div className="flex gap-1 flex-wrap">
          {STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`text-xs px-3 py-1.5 rounded-full font-medium transition-colors ${
                statusFilter === s
                  ? 'bg-sky-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="card border-red-200 text-sm text-red-600">⚠ {error}</div>
      )}

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Flight list */}
        <div className="lg:col-span-3 space-y-3">
          {loading ? (
            <p className="text-sm text-gray-400 animate-pulse">Loading flights…</p>
          ) : filtered.length === 0 ? (
            <div className="card text-center text-gray-400 py-10">No flights match your filter.</div>
          ) : (
            filtered.map((f) => (
              <div key={f.id} className="relative group">
                <FlightCard flight={f} onClick={setSelectedFlight} />
                <button
                  onClick={() => handleDelete(f.id)}
                  className="absolute top-3 right-3 text-xs text-red-400 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-600"
                  title="Delete flight"
                >
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Detail panel */}
        <div className="lg:col-span-2 space-y-4">
          {selectedFlight ? (
            <>
              <FlightMap flight={selectedFlight} />
              <FlightDetails flight={selectedFlight} />
            </>
          ) : (
            <div className="card flex items-center justify-center h-48 text-gray-400 text-sm">
              Select a flight to view details
            </div>
          )}
        </div>
      </div>

      {/* New Flight Modal */}
      {showForm && (
        <Modal title="New Flight" onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Flight Number *" error={formErrors.flightNumber}>
                <input name="flightNumber" value={form.flightNumber} onChange={handleFormChange}
                  className="form-input" placeholder="SKY001" />
              </FormField>
              <FormField label="Aircraft Type">
                <input name="aircraftType" value={form.aircraftType} onChange={handleFormChange}
                  className="form-input" placeholder="B737-800" />
              </FormField>
              <FormField label="Origin ICAO *" error={formErrors.originIcao}>
                <input name="originIcao" value={form.originIcao} onChange={handleFormChange}
                  className="form-input uppercase" placeholder="KJFK" maxLength={4} />
              </FormField>
              <FormField label="Destination ICAO *" error={formErrors.destinationIcao}>
                <input name="destinationIcao" value={form.destinationIcao} onChange={handleFormChange}
                  className="form-input uppercase" placeholder="KLAX" maxLength={4} />
              </FormField>
              <FormField label="Scheduled Departure *" error={formErrors.scheduledDeparture}>
                <input name="scheduledDeparture" type="datetime-local" value={form.scheduledDeparture}
                  onChange={handleFormChange} className="form-input" />
              </FormField>
              <FormField label="Scheduled Arrival *" error={formErrors.scheduledArrival}>
                <input name="scheduledArrival" type="datetime-local" value={form.scheduledArrival}
                  onChange={handleFormChange} className="form-input" />
              </FormField>
              <FormField label="Captain">
                <input name="captain" value={form.captain} onChange={handleFormChange}
                  className="form-input" placeholder="Capt. J. Smith" />
              </FormField>
              <FormField label="First Officer">
                <input name="firstOfficer" value={form.firstOfficer} onChange={handleFormChange}
                  className="form-input" placeholder="F/O A. Jones" />
              </FormField>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="btn-primary">Create Flight</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

function FlightDetails({ flight }) {
  return (
    <div className="card space-y-2 text-sm">
      <h3 className="font-semibold text-slate-700">Flight Details — {flight.flightNumber}</h3>
      <DetailRow label="Status" value={flight.status} />
      <DetailRow label="Aircraft" value={`${flight.aircraft?.type} (${flight.aircraft?.registration})`} />
      <DetailRow label="Captain" value={flight.captain} />
      <DetailRow label="First Officer" value={flight.firstOfficer} />
      <DetailRow label="Fuel (kg)" value={flight.fuel} />
      <DetailRow label="Passengers" value={flight.passengers} />
      <DetailRow label="Route" value={flight.route?.join(' → ')} />
    </div>
  );
}

function DetailRow({ label, value }) {
  if (!value) return null;
  return (
    <div className="flex gap-2">
      <span className="text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-gray-700">{value}</span>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-slate-800">{title}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">✕</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}

function FormField({ label, error, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-0.5">{error}</p>}
    </div>
  );
}
