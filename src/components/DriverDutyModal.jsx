import React, { useEffect, useState, useMemo } from 'react';
import { X, Coffee, Play, Square, AlertTriangle, Clock, Calendar, CheckCircle2 } from 'lucide-react';

const timeToHour = (value) => {
  if (!value || value === '-') return null;
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) + Number(match[2]) / 60;
};

export const DriverDutyModal = ({
  driver,
  mode = 'BREAK',
  bookings = [],
  onClose,
  onAddBreak,
  onDutyAction,
}) => {
  if (!driver) return null;

  const currentStart = Number(driver.startDutyHour ?? driver.dutyStartHour ?? 8);
  const currentEnd = Number(driver.endDutyHour ?? driver.dutyEndHour ?? 18);

  const [activeTab, setActiveTab] = useState(mode);
  const [startHour, setStartHour] = useState(currentStart);
  const [endHour, setEndHour] = useState(currentEnd);
  const [breakLabel, setBreakLabel] = useState('Lunch Break');

  useEffect(() => {
    setActiveTab(mode);
    if (mode === 'START_DUTY') {
      setStartHour(currentStart);
      setEndHour(currentEnd);
    } else if (mode === 'END_DUTY') {
      setStartHour(currentStart);
      setEndHour(currentEnd);
    } else if (mode === 'BREAK') {
      setStartHour(13);
      setEndHour(14);
    }
  }, [driver?.id, mode, currentStart, currentEnd]);

  // Find all assigned trips for this driver
  const assignedTrips = useMemo(() => {
    return (bookings || [])
      .filter(
        (b) =>
          b.driverName === driver.name &&
          ['Accepted', 'Waiting', 'Requested', 'On Going'].includes(b.status)
      )
      .map((b) => ({
        id: b.id,
        passenger: b.employeeName,
        pickupStr: b.requestedPickupTime,
        dropStr: b.plannedDropTime,
        startHour: timeToHour(b.requestedPickupTime),
        endHour: timeToHour(b.plannedDropTime),
      }))
      .filter((t) => t.startHour !== null && t.endHour !== null);
  }, [bookings, driver.name]);

  const earliestTrip = useMemo(() => {
    if (assignedTrips.length === 0) return null;
    return assignedTrips.reduce((min, t) => (t.startHour < min.startHour ? t : min), assignedTrips[0]);
  }, [assignedTrips]);

  const latestTrip = useMemo(() => {
    if (assignedTrips.length === 0) return null;
    return assignedTrips.reduce((max, t) => (t.endHour > max.endHour ? t : max), assignedTrips[0]);
  }, [assignedTrips]);

  // Real-time validation and collision checks
  const validation = useMemo(() => {
    if (activeTab === 'START_DUTY') {
      if (startHour >= currentEnd) {
        return {
          valid: false,
          error: `Duty start time (${startHour}:00) cannot be equal to or after duty end (${currentEnd}:00). Duty must start before it ends!`,
        };
      }
      if (earliestTrip && startHour > earliestTrip.startHour) {
        return {
          valid: false,
          error: `Collision: Ride #${earliestTrip.id} is scheduled to start at ${earliestTrip.pickupStr}. Duty cannot start after an assigned ride starts!`,
        };
      }
    } else if (activeTab === 'END_DUTY') {
      if (endHour <= currentStart) {
        return {
          valid: false,
          error: `Duty end time (${endHour}:00) cannot be before or equal to duty start (${currentStart}:00). How can duty end before it starts!`,
        };
      }
      if (latestTrip && endHour < latestTrip.endHour) {
        return {
          valid: false,
          error: `Collision: Ride #${latestTrip.id} drops at ${latestTrip.dropStr}. Duty cannot end before an assigned ride completes!`,
        };
      }
    } else if (activeTab === 'SET_SHIFT') {
      if (endHour <= startHour) {
        return {
          valid: false,
          error: `Duty end (${endHour}:00) must be strictly after duty start (${startHour}:00). Duty cannot end before or at start time!`,
        };
      }
      if (earliestTrip && startHour > earliestTrip.startHour) {
        return {
          valid: false,
          error: `Collision: Scheduled ride #${earliestTrip.id} starts at ${earliestTrip.pickupStr}. Duty start (${startHour}:00) cannot be after assigned rides!`,
        };
      }
      if (latestTrip && endHour < latestTrip.endHour) {
        return {
          valid: false,
          error: `Collision: Scheduled ride #${latestTrip.id} ends at ${latestTrip.dropStr}. Duty end (${endHour}:00) cannot be before assigned rides finish!`,
        };
      }
    } else if (activeTab === 'BREAK') {
      if (endHour <= startHour) {
        return {
          valid: false,
          error: 'Break end hour must be strictly greater than break start hour.',
        };
      }
      if (startHour < currentStart || endHour > currentEnd) {
        return {
          valid: false,
          error: `Break (${startHour}:00 - ${endHour}:00) must fall entirely inside driver duty hours (${currentStart}:00 - ${currentEnd}:00).`,
        };
      }
      // Check break collision with assigned trips
      const overlappingTrip = assignedTrips.find(
        (t) => startHour < t.endHour && endHour > t.startHour
      );
      if (overlappingTrip) {
        return {
          valid: false,
          error: `Collision: Break (${startHour}:00 - ${endHour}:00) collides with scheduled ride #${overlappingTrip.id} (${overlappingTrip.pickupStr} - ${overlappingTrip.dropStr}).`,
        };
      }
    }

    return { valid: true, error: null };
  }, [activeTab, startHour, endHour, currentStart, currentEnd, earliestTrip, latestTrip, assignedTrips]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    if (activeTab === 'BREAK') {
      onAddBreak(driver.id, startHour, endHour, breakLabel);
    } else if (activeTab === 'START_DUTY') {
      onDutyAction(driver.id, 'START_DUTY', startHour, currentEnd);
    } else if (activeTab === 'END_DUTY') {
      onDutyAction(driver.id, 'END_DUTY', currentStart, endHour);
    } else if (activeTab === 'SET_SHIFT') {
      onDutyAction(driver.id, 'SET_SHIFT', startHour, endHour);
    }
    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="modal-dialog" style={{ maxWidth: '520px' }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {activeTab === 'BREAK' ? (
              <Coffee size={18} color="#f59e0b" />
            ) : activeTab === 'START_DUTY' ? (
              <Play size={18} color="#10b981" />
            ) : activeTab === 'END_DUTY' ? (
              <Square size={18} color="#ef4444" />
            ) : (
              <Clock size={18} color="#3b82f6" />
            )}
            <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>
              {activeTab === 'BREAK'
                ? `Schedule Break: ${driver.name}`
                : activeTab === 'START_DUTY'
                ? `Start Duty: ${driver.name}`
                : activeTab === 'END_DUTY'
                ? `End Duty: ${driver.name}`
                : `Adjust Shift Hours: ${driver.name}`}
            </h3>
          </div>
          <button type="button" className="btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab Selector */}
        <div
          style={{
            display: 'flex',
            gap: '6px',
            padding: '10px 20px 0',
            borderBottom: '1px solid var(--border-light)',
            background: 'var(--bg-card)',
          }}
        >
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'START_DUTY' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={() => setActiveTab('START_DUTY')}
          >
            <Play size={13} color="#10b981" />
            <span>Duty Start</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'END_DUTY' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={() => setActiveTab('END_DUTY')}
          >
            <Square size={13} color="#ef4444" />
            <span>Duty End</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'SET_SHIFT' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={() => setActiveTab('SET_SHIFT')}
          >
            <Clock size={13} color="#3b82f6" />
            <span>Full Shift</span>
          </button>
          <button
            type="button"
            className={`nav-tab-btn ${activeTab === 'BREAK' ? 'active' : ''}`}
            style={{ fontSize: '0.8rem', padding: '6px 12px' }}
            onClick={() => setActiveTab('BREAK')}
          >
            <Coffee size={13} color="#f59e0b" />
            <span>Add Break</span>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Driver Shift Summary Badge */}
            <div
              style={{
                background: 'var(--bg-card-subtle)',
                padding: '12px 14px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-light)',
                fontSize: '0.82rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
              }}
            >
              <div>
                <div>Vehicle: <strong>{driver.vehicleNumber}</strong></div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{driver.vehicleDetails}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div>
                  Current Shift:{' '}
                  <strong style={{ color: '#10b981' }}>
                    {currentStart}:00 - {currentEnd}:00
                  </strong>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                  Duration: {Math.max(0, currentEnd - currentStart)} hrs
                </div>
              </div>
            </div>

            {/* Assigned Trips Note if any */}
            {assignedTrips.length > 0 ? (
              <div
                style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  border: '1px solid rgba(59, 130, 246, 0.25)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '8px 12px',
                  fontSize: '0.78rem',
                  color: 'var(--text-primary)',
                }}
              >
                <div style={{ fontWeight: 600, color: '#3b82f6', marginBottom: '4px' }}>
                  Active Scheduled Rides ({assignedTrips.length}):
                </div>
                <div>
                  Earliest pickup at <strong>{earliestTrip.pickupStr}</strong> | Latest drop at{' '}
                  <strong>{latestTrip.dropStr}</strong>
                </div>
              </div>
            ) : (
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                No rides currently assigned to {driver.name}.
              </div>
            )}

            {/* Form Fields Based on Active Tab */}
            {activeTab === 'BREAK' && (
              <div className="form-group">
                <label>Break Description / Type</label>
                <select
                  className="form-control"
                  value={breakLabel}
                  onChange={(e) => setBreakLabel(e.target.value)}
                >
                  <option value="Lunch Break">Lunch Break</option>
                  <option value="Tea / Rest Break">Tea / Rest Break</option>
                  <option value="Vehicle Refuel Break">Vehicle Refuel Break</option>
                  <option value="Sanitization Break">Sanitization Break</option>
                </select>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: activeTab === 'START_DUTY' || activeTab === 'END_DUTY' ? '1fr' : '1fr 1fr', gap: '14px' }}>
              {(activeTab === 'START_DUTY' || activeTab === 'SET_SHIFT' || activeTab === 'BREAK') && (
                <div className="form-group">
                  <label>
                    {activeTab === 'BREAK'
                      ? 'Break Start Hour (24h)'
                      : activeTab === 'START_DUTY'
                      ? 'Duty Start Hour (24h)'
                      : 'Shift Start Hour (24h)'}
                  </label>
                  <input
                    type="number"
                    min={5}
                    max={22}
                    required
                    className="form-control"
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                  />
                  {activeTab === 'START_DUTY' && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Duty end is fixed at <strong>{currentEnd}:00</strong>. Start must be &lt; {currentEnd}:00.
                    </span>
                  )}
                </div>
              )}

              {(activeTab === 'END_DUTY' || activeTab === 'SET_SHIFT' || activeTab === 'BREAK') && (
                <div className="form-group">
                  <label>
                    {activeTab === 'BREAK'
                      ? 'Break End Hour (24h)'
                      : activeTab === 'END_DUTY'
                      ? 'Duty End Hour (24h)'
                      : 'Shift End Hour (24h)'}
                  </label>
                  <input
                    type="number"
                    min={6}
                    max={23}
                    required
                    className="form-control"
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                  />
                  {activeTab === 'END_DUTY' && (
                    <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                      Duty start is fixed at <strong>{currentStart}:00</strong>. End must be &gt; {currentStart}:00.
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Validation Warning Alert */}
            {!validation.valid && (
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
                  <strong>Invalid Duty Timing:</strong>
                  <div>{validation.error}</div>
                </div>
              </div>
            )}

            {/* Success Preview */}
            {validation.valid && (
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
                <span>
                  {activeTab === 'BREAK'
                    ? `Break will be placed between ${startHour}:00 and ${endHour}:00 (No trip collisions).`
                    : activeTab === 'START_DUTY'
                    ? `New duty window: ${startHour}:00 - ${currentEnd}:00 (${currentEnd - startHour} hrs).`
                    : activeTab === 'END_DUTY'
                    ? `New duty window: ${currentStart}:00 - ${endHour}:00 (${endHour - currentStart} hrs).`
                    : `New shift window: ${startHour}:00 - ${endHour}:00 (${endHour - startHour} hrs).`}
                </span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={!validation.valid}
              style={{
                background: !validation.valid
                  ? '#6b7280'
                  : activeTab === 'BREAK'
                  ? '#f59e0b'
                  : activeTab === 'END_DUTY'
                  ? '#ef4444'
                  : '#10b981',
                cursor: !validation.valid ? 'not-allowed' : 'pointer',
              }}
            >
              {activeTab === 'BREAK' ? (
                <Coffee size={16} />
              ) : activeTab === 'START_DUTY' ? (
                <Play size={16} />
              ) : activeTab === 'END_DUTY' ? (
                <Square size={16} />
              ) : (
                <Clock size={16} />
              )}
              <span>
                {activeTab === 'BREAK'
                  ? 'Add Break Interval'
                  : activeTab === 'START_DUTY'
                  ? 'Confirm Duty Start'
                  : activeTab === 'END_DUTY'
                  ? 'Confirm Duty End'
                  : 'Save Shift Hours'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DriverDutyModal;
