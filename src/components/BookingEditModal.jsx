import React, { useState, useEffect } from 'react';
import { X, Save, Edit2, Bus, User, MapPin, Clock, FileText } from 'lucide-react';
import { CAMPUS_STOPS } from '../utils/realTimeEngine';

const ALL_STATUSES = [
  'Accepted',
  'Waiting',
  'Requested',
  'On Going',
  'Completed',
  'Dropped',
  'Declined',
  'No Show',
  'Cancelled',
];

const FLEET_VEHICLES = [
  { number: 'NB-002-RF', details: 'UA3282 White Bus | 12 Seater' },
  { number: 'NB-003-RF', details: 'UA3282 White Bus | 12 Seater' },
  { number: 'DL-04-AB-1290', details: 'Shuttle Van B4 | 8 Seater' },
  { number: 'KA-05-MN-9921', details: 'Campus Cruiser 7 | 15 Seater' },
  { number: 'MH-12-PQ-4412', details: 'Green Electric MiniBus | 16 Seater' },
  { number: 'UP-32-BZ-8821', details: 'City Runner 3 | 10 Seater' },
  { number: '-', details: 'Unassigned / Capacity Full' },
];

export const BookingEditModal = ({
  booking,
  drivers = [],
  onClose,
  onSave,
}) => {
  if (!booking) return null;

  const [employeeName, setEmployeeName] = useState(booking.employeeName || '');
  const [employeeId, setEmployeeId] = useState(booking.employeeId || '');
  const [role, setRole] = useState(booking.role || 'Student');
  const [fromLocation, setFromLocation] = useState(booking.fromLocation || CAMPUS_STOPS[0]);
  const [toLocation, setToLocation] = useState(booking.toLocation || CAMPUS_STOPS[1]);
  const [status, setStatus] = useState(booking.status || 'Accepted');
  const [vehicleNumber, setVehicleNumber] = useState(booking.vehicleNumber || 'NB-002-RF');
  const [vehicleDetails, setVehicleDetails] = useState(booking.vehicleDetails || 'UA3282 White Bus | 12 Seater');
  const [requestedPickupTime, setRequestedPickupTime] = useState(booking.requestedPickupTime || '11:00');
  const [plannedDropTime, setPlannedDropTime] = useState(booking.plannedDropTime || '11:15');
  const [driverName, setDriverName] = useState(booking.driverName || 'Unassigned');
  const [driverPhone, setDriverPhone] = useState(booking.driverPhone || '+1-322-493-3292');
  const [delayMinutes, setDelayMinutes] = useState(booking.delayMinutes || 0);
  const [notes, setNotes] = useState(booking.notes || '');

  // Keep state synced if booking changes
  useEffect(() => {
    if (booking) {
      setEmployeeName(booking.employeeName || '');
      setEmployeeId(booking.employeeId || '');
      setRole(booking.role || 'Student');
      setFromLocation(booking.fromLocation || CAMPUS_STOPS[0]);
      setToLocation(booking.toLocation || CAMPUS_STOPS[1]);
      setStatus(booking.status || 'Accepted');
      setVehicleNumber(booking.vehicleNumber || 'NB-002-RF');
      setVehicleDetails(booking.vehicleDetails || 'UA3282 White Bus | 12 Seater');
      setRequestedPickupTime(booking.requestedPickupTime || '11:00');
      setPlannedDropTime(booking.plannedDropTime || '11:15');
      setDriverName(booking.driverName || 'Unassigned');
      setDriverPhone(booking.driverPhone || '+1-322-493-3292');
      setDelayMinutes(booking.delayMinutes || 0);
      setNotes(booking.notes || '');
    }
  }, [booking]);

  const handleVehicleChange = (vNum) => {
    setVehicleNumber(vNum);
    const found = FLEET_VEHICLES.find((v) => v.number === vNum);
    if (found) setVehicleDetails(found.details);
    const assignedDriver = drivers.find((driver) => driver.vehicleNumber === vNum);
    if (assignedDriver) {
      setDriverName(assignedDriver.name);
      setDriverPhone(assignedDriver.phone);
    } else if (vNum === '-') {
      setDriverName('Unassigned');
      setDriverPhone('-');
    }
  };

  const handleDriverChange = (dName) => {
    setDriverName(dName);
    const found = drivers.find((d) => d.name === dName);
    if (found) {
      setDriverPhone(found.phone);
      handleVehicleChange(found.vehicleNumber);
    } else {
      setVehicleNumber('-');
      setVehicleDetails('Unassigned / Capacity Full');
      setDriverPhone('-');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      employeeName,
      employeeId,
      role,
      fromLocation,
      toLocation,
      status,
      vehicleNumber,
      vehicleDetails,
      requestedPickupTime,
      plannedDropTime,
      driverName,
      driverPhone,
      delayMinutes: Number(delayMinutes) || 0,
      notes,
    });
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Edit2 size={18} color="var(--brand-blue)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              Modify Booking #{booking.id} (Admin Dispatch)
            </h3>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Passenger Info & Role */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Passenger Name</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Student / Staff ID</label>
                <input
                  type="text"
                  required
                  className="form-control"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Commuter Type</label>
                <select
                  className="form-control"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                >
                  <option value="Student">Student</option>
                  <option value="Staff">Faculty / Staff</option>
                </select>
              </div>
            </div>

            {/* Status & Delay */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Booking Status</label>
                <select
                  className="form-control"
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  style={{ fontWeight: 700 }}
                >
                  {ALL_STATUSES.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Delay (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  max="120"
                  className="form-control"
                  value={delayMinutes}
                  onChange={(e) => setDelayMinutes(e.target.value)}
                />
              </div>
            </div>

            {/* Pickup & Destination Stops */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div className="form-group">
                <label>Pickup Location</label>
                <select
                  className="form-control"
                  value={fromLocation}
                  onChange={(e) => setFromLocation(e.target.value)}
                >
                  {CAMPUS_STOPS.map((st) => (
                    <option key={st} value={st}>{st}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Drop Destination</label>
                <select
                  className="form-control"
                  value={toLocation}
                  onChange={(e) => setToLocation(e.target.value)}
                >
                  {CAMPUS_STOPS.map((st) => (
                    <option key={st} value={st} disabled={st === fromLocation}>{st}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Transit Times */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div className="form-group">
                <label style={{ fontSize: '0.72rem' }}>Requested Pickup</label>
                <input
                  type="time"
                  required
                  className="form-control"
                  value={requestedPickupTime}
                  readOnly
                  title="Pickup time is set by the commuter and cannot be changed by admin"
                />
              </div>

              <div className="form-group">
                <label style={{ fontSize: '0.72rem' }}>Planned Drop</label>
                <input
                  type="time"
                  required
                  className="form-control"
                  value={plannedDropTime}
                  onChange={(e) => setPlannedDropTime(e.target.value)}
                />
              </div>

            </div>

            {/* Vehicle & Driver Reassignment */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
              <div className="form-group">
                <label>Assigned Shuttle Vehicle</label>
                <select
                  className="form-control"
                  value={vehicleNumber}
                  onChange={(e) => handleVehicleChange(e.target.value)}
                >
                  {FLEET_VEHICLES.map((v) => (
                    <option key={v.number} value={v.number}>
                      {v.number} — {v.details}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Assigned Driver</label>
                <select
                  className="form-control"
                  value={driverName}
                  onChange={(e) => handleDriverChange(e.target.value)}
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name} ({d.status})
                    </option>
                  ))}
                  <option value="Unassigned">Unassigned</option>
                </select>
              </div>
            </div>

            {/* Special Instructions / Notes */}
            <div className="form-group">
              <label>Special Instructions & Dispatch Notes</label>
              <textarea
                rows={2}
                className="form-control"
                placeholder="Add special instructions, priority notes, or passenger requirements..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ background: 'var(--brand-blue)' }}>
              <Save size={16} />
              <span>Save & Dispatch Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
