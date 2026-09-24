import React, { useState, useMemo } from 'react';
import { X, Plus, Bus, AlertTriangle, CheckCircle2, User, Clock } from 'lucide-react';
import { CAMPUS_STOPS } from '../utils/realTimeEngine';

const timeToHour = (value) => {
  if (!value || value === '-') return null;
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) + Number(match[2]) / 60;
};

export const NewBookingModal = ({
  isOpen,
  bookingDate,
  drivers = [],
  bookings = [],
  onClose,
  onCreate,
}) => {
  if (!isOpen) return null;

  const [employeeName, setEmployeeName] = useState('');
  const [employeeId, setEmployeeId] = useState('');
  const [fromLocation, setFromLocation] = useState(CAMPUS_STOPS[0]);
  const [toLocation, setToLocation] = useState(CAMPUS_STOPS[1]);
  const [requestedPickupTime, setRequestedPickupTime] = useState('11:00');
  const [plannedDropTime, setPlannedDropTime] = useState('11:20');
  const [selectedDriverId, setSelectedDriverId] = useState(drivers[0]?.id || 'auto');
  const [notes, setNotes] = useState('');

  // Selected driver resolution
  const selectedDriver = useMemo(() => {
    if (selectedDriverId === 'auto' || selectedDriverId === 'none') return null;
    return drivers.find((d) => d.id === selectedDriverId) || null;
  }, [selectedDriverId, drivers]);

  // Real-time timing & collision verification
  const timingValidation = useMemo(() => {
    const pickupHour = timeToHour(requestedPickupTime);
    const dropHour = timeToHour(plannedDropTime);

    if (pickupHour === null || dropHour === null) {
      return { valid: false, error: 'Please enter valid pickup and drop times.' };
    }

    if (dropHour <= pickupHour) {
      return {
        valid: false,
        error: `Planned drop time (${plannedDropTime}) must be strictly after pickup time (${requestedPickupTime}).`,
      };
    }

    // If a specific driver is chosen
    if (selectedDriver) {
      const driverStart = Number(selectedDriver.startDutyHour ?? selectedDriver.dutyStartHour ?? 8);
      const driverEnd = Number(selectedDriver.endDutyHour ?? selectedDriver.dutyEndHour ?? 18);

      if (pickupHour < driverStart) {
        return {
          valid: false,
          error: `Collision: Ride pickup (${requestedPickupTime}) is before ${selectedDriver.name}'s duty start (${driverStart}:00). Ride cannot be booked before driver duty starts!`,
        };
      }

      if (dropHour > driverEnd) {
        return {
          valid: false,
          error: `Collision: Ride drop (${plannedDropTime}) extends beyond ${selectedDriver.name}'s duty end (${driverEnd}:00). Ride cannot go beyond driver duty!`,
        };
      }

      // Check break collision for this driver
      const breakBlocks = (selectedDriver.blocks || []).filter((b) => b.type === 'BREAK');
      const collidingBreak = breakBlocks.find(
        (b) => pickupHour < b.endHour && dropHour > b.startHour
      );
      if (collidingBreak) {
        return {
          valid: false,
          error: `Collision: ${selectedDriver.name} is on scheduled break (${collidingBreak.startHour}:00 - ${collidingBreak.endHour}:00).`,
        };
      }
    } else if (selectedDriverId === 'auto') {
      // Find an eligible on-duty driver
      const eligibleDriver = drivers.find((d) => {
        const dStart = Number(d.startDutyHour ?? d.dutyStartHour ?? 8);
        const dEnd = Number(d.endDutyHour ?? d.dutyEndHour ?? 18);
        if (pickupHour < dStart || dropHour > dEnd) return false;
        const breaks = (d.blocks || []).filter((b) => b.type === 'BREAK');
        const hasBreakCollision = breaks.some((b) => pickupHour < b.endHour && dropHour > b.startHour);
        return !hasBreakCollision;
      });

      if (!eligibleDriver && drivers.length > 0) {
        const minStart = Math.min(...drivers.map((d) => Number(d.startDutyHour ?? d.dutyStartHour ?? 8)));
        const maxEnd = Math.max(...drivers.map((d) => Number(d.endDutyHour ?? d.dutyEndHour ?? 18)));
        return {
          valid: false,
          error: `No driver is on duty between ${requestedPickupTime} and ${plannedDropTime}. Network operational window is ${minStart}:00 to ${maxEnd}:00.`,
        };
      }
    }

    return { valid: true, error: null };
  }, [requestedPickupTime, plannedDropTime, selectedDriver, selectedDriverId, drivers]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!timingValidation.valid) {
      alert(timingValidation.error);
      return;
    }

    const pickupHour = timeToHour(requestedPickupTime);
    const dropHour = timeToHour(plannedDropTime);

    let assigned = selectedDriver;
    if (!assigned && selectedDriverId === 'auto') {
      assigned = drivers.find((d) => {
        const dStart = Number(d.startDutyHour ?? d.dutyStartHour ?? 8);
        const dEnd = Number(d.endDutyHour ?? d.dutyEndHour ?? 18);
        return pickupHour >= dStart && dropHour <= dEnd;
      }) || drivers[0];
    }

    onCreate({
      employeeName: employeeName.trim() || 'Student Commuter',
      employeeId: employeeId.trim() || `EMP-${Math.floor(Math.random() * 900000 + 100000)}`,
      fromLocation,
      toLocation,
      requestedPickupTime,
      plannedDropTime,
      notes,
      status: 'Waiting',
      vehicleNumber: assigned?.vehicleNumber || 'NB-002-RF',
      vehicleDetails: assigned?.vehicleDetails || 'UA3282 White Bus | 12 Seater',
      driverName: assigned?.name || 'Steve Smith',
      driverPhone: assigned?.phone || '+1-322-493-3292',
      driverRating: assigned?.rating || 4.5,
      date: bookingDate || new Date().toISOString().slice(0, 10),
      pickupTime: '-',
      actualDropTime: '-',
      delayMinutes: 0,
    });
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" style={{ maxWidth: '540px' }} onClick={(e) => e.stopPropagation()}>
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
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
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

            {/* Time selection */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              <div className="form-group">
                <label>Requested Pickup Time</label>
                <input
                  type="time"
                  required
                  className="form-control"
                  value={requestedPickupTime}
                  onChange={(e) => setRequestedPickupTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Planned Drop Time</label>
                <input
                  type="time"
                  required
                  className="form-control"
                  value={plannedDropTime}
                  onChange={(e) => setPlannedDropTime(e.target.value)}
                />
              </div>
            </div>

            {/* Driver & Shuttle Assignment with Shift Window Info */}
            <div className="form-group">
              <label>Assign Driver & Shuttle</label>
              <select
                className="form-control"
                value={selectedDriverId}
                onChange={(e) => setSelectedDriverId(e.target.value)}
              >
                <option value="auto">⚡ Auto-Assign Best Available On-Duty Driver</option>
                {drivers.map((d) => {
                  const dStart = d.startDutyHour ?? d.dutyStartHour ?? 8;
                  const dEnd = d.endDutyHour ?? d.dutyEndHour ?? 18;
                  return (
                    <option key={d.id} value={d.id}>
                      {d.name} ({d.vehicleNumber}) — Shift: {dStart}:00 to {dEnd}:00 ({d.status})
                    </option>
                  );
                })}
                <option value="none">Queue for Manual Dispatch (Unassigned)</option>
              </select>
              {selectedDriver && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '0.76rem',
                    color: '#10b981',
                    marginTop: '4px',
                  }}
                >
                  <Clock size={12} />
                  <span>
                    {selectedDriver.name}'s Shift Window:{' '}
                    <strong>
                      {selectedDriver.startDutyHour ?? selectedDriver.dutyStartHour ?? 8}:00 -{' '}
                      {selectedDriver.endDutyHour ?? selectedDriver.dutyEndHour ?? 18}:00
                    </strong>{' '}
                    (Rides must be within this window)
                  </span>
                </div>
              )}
            </div>

            {/* Collision & Timing Alert Card */}
            {!timingValidation.valid && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid #ef4444',
                  borderRadius: 'var(--radius-sm)',
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '10px',
                  fontSize: '0.8rem',
                  color: '#f87171',
                }}
              >
                <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong>Duty Window Conflict:</strong>
                  <div>{timingValidation.error}</div>
                </div>
              </div>
            )}

            {timingValidation.valid && selectedDriver && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  border: '1px solid rgba(16, 185, 129, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontSize: '0.78rem',
                  color: '#10b981',
                }}
              >
                <CheckCircle2 size={15} />
                <span>Ride ({requestedPickupTime} - {plannedDropTime}) falls completely inside {selectedDriver.name}'s duty shift.</span>
              </div>
            )}

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
            <button
              type="submit"
              className="btn-primary"
              disabled={!timingValidation.valid}
              style={{
                opacity: !timingValidation.valid ? 0.6 : 1,
                cursor: !timingValidation.valid ? 'not-allowed' : 'pointer',
              }}
            >
              <Plus size={16} />
              <span>Confirm & Dispatch Booking</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewBookingModal;
