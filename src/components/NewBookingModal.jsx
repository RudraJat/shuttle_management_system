import React, { useState } from 'react';
import { X, Plus, Bus } from 'lucide-react';

const CAMPUS_STOPS = [
  'Main Gate',
  'Central Library',
  'Engineering Block',
  'Data Centre',
  'Hostel Block A',
  'Girls Hostel',
  'Sports Complex',
  'Food Court',
  'Parking Lot B',
  'Administration Block',
];

export const NewBookingModal = ({
  isOpen,
  bookingDate,
  onClose,
  onCreate,
}) => {
  if (!isOpen) return null;

  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [fromLocation, setFromLocation] = useState(CAMPUS_STOPS[0]);
  const [toLocation, setToLocation] = useState(CAMPUS_STOPS[1]);
  const [requestedPickupTime, setRequestedPickupTime] = useState('12:30');
  const [plannedDropTime, setPlannedDropTime] = useState('12:45');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onCreate({
      employeeName: employeeName || 'Student Commuter',
      employeeId: employeeId || `EMP-${Math.floor(Math.random() * 900000 + 100000)}`,
      fromLocation,
      toLocation,
      requestedPickupTime,
      plannedDropTime,
      notes,
      status: 'Waiting',
      vehicleNumber: 'NB-002-RF',
      vehicleDetails: 'UA3282 White Bus | 12 Seater',
      driverName: 'Steve Smith',
      driverPhone: '+1-322-493-3292',
      driverRating: 4.5,
      date: bookingDate || new Date().toISOString().slice(0, 10),
      pickupTime: '-',
      actualDropTime: '-',
      delayMinutes: 0,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Bus size={18} color="var(--brand-primary)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Book Campus Shuttle Ride</h3>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Passenger / Student Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  className="form-control"
                  value={employeeName}
                  onChange={(e) => setEmployeeName(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Roll No / Employee ID</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 12019482"
                  className="form-control"
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Pickup Stop</label>
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
                <label>Destination Stop</label>
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Pickup Time</label>
                <input
                  type="time"
                  required
                  className="form-control"
                  value={requestedPickupTime}
                  onChange={(e) => setRequestedPickupTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Target Drop Time</label>
                <input
                  type="time"
                  required
                  className="form-control"
                  value={plannedDropTime}
                  onChange={(e) => setPlannedDropTime(e.target.value)}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Special Instructions / Destination Notes</label>
              <textarea
                rows={2}
                placeholder="e.g. Near West Gate entrance, carrying lab equipment"
                className="form-control"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Plus size={16} />
              <span>Confirm & Dispatch Booking</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
