const mongoose = require('mongoose');

const crewMemberSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    name: { type: String, required: true, trim: true },
    role: {
      type: String,
      enum: ['captain', 'first_officer', 'flight_engineer', 'purser', 'cabin_crew'],
      required: true,
    },
    licenseNumber: { type: String, trim: true },
  },
  { _id: false }
);

const flightSchema = new mongoose.Schema(
  {
    flightNumber: {
      type: String,
      required: true,
      uppercase: true,
      trim: true,
      match: /^[A-Z]{2,3}\d{1,4}[A-Z]?$/,
      index: true,
    },
    departure: {
      icao: { type: String, required: true, uppercase: true, trim: true, length: 4 },
      iata: { type: String, uppercase: true, trim: true },
      name: { type: String, trim: true },
    },
    destination: {
      icao: { type: String, required: true, uppercase: true, trim: true, length: 4 },
      iata: { type: String, uppercase: true, trim: true },
      name: { type: String, trim: true },
    },
    departureTime: { type: Date, required: true },
    arrivalTime: { type: Date, required: true },
    aircraft: {
      registration: { type: String, required: true, uppercase: true, trim: true },
      type: { type: String, required: true, trim: true },
      icaoCode: { type: String, uppercase: true, trim: true },
    },
    status: {
      type: String,
      enum: ['scheduled', 'boarding', 'departed', 'airborne', 'landed', 'arrived', 'delayed', 'cancelled', 'diverted'],
      default: 'scheduled',
      index: true,
    },
    crew: { type: [crewMemberSchema], default: [] },
    passengers: {
      booked: { type: Number, default: 0, min: 0 },
      checkedIn: { type: Number, default: 0, min: 0 },
      capacity: { type: Number, required: true, min: 1 },
    },
    route: {
      distance: { type: Number, min: 0 },        // nautical miles
      plannedAltitude: { type: Number, min: 0 }, // feet
      waypoints: [{ type: String, uppercase: true, trim: true }],
    },
    fuel: {
      planned: { type: Number, min: 0 },   // kg
      actual: { type: Number, min: 0 },    // kg
      onBoard: { type: Number, min: 0 },   // kg
    },
    remarks: { type: String, trim: true, maxlength: 1000 },
    dispatchedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

flightSchema.virtual('duration').get(function () {
  if (this.departureTime && this.arrivalTime) {
    return Math.round((this.arrivalTime - this.departureTime) / 60000); // minutes
  }
  return null;
});

flightSchema.index({ 'departure.icao': 1, departureTime: 1 });
flightSchema.index({ 'destination.icao': 1, arrivalTime: 1 });

module.exports = mongoose.model('Flight', flightSchema);
