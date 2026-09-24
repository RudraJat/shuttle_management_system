import React, { useEffect, useState } from 'react';
import { Search, MoreVertical, Play, Square, Coffee, Wifi, WifiOff, Clock } from 'lucide-react';

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const START_HOUR = 6;
const TOTAL_HOURS = 17; // 17 hour slots (06:00 to 22:00, spanning to 23:00)

export const DriverTimeline = ({
  drivers,
  bookings = [],
  selectedDate = '',
  onDutyAction,
  onOpenDutyModal,
  onStatusToggle,
  onOpenBreakModal,
  onSelectBlock,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeMenuDriverId, setActiveMenuDriverId] = useState(null);
  const [currentHour, setCurrentHour] = useState(() => {
    const now = new Date();
    return now.getHours() + now.getMinutes() / 60;
  });

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentHour(now.getHours() + now.getMinutes() / 60);
    };
    const timer = setInterval(updateClock, 30000);
    return () => clearInterval(timer);
  }, []);

  const filteredDrivers = drivers.filter((d) =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.vehicleNumber.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getOffsetPct = (hour) => {
    const clamped = Math.max(START_HOUR, Math.min(23, hour));
    return ((clamped - START_HOUR) / TOTAL_HOURS) * 100;
  };

  const getWidthPct = (start, end) => {
    const s = Math.max(START_HOUR, Math.min(23, start));
    const e = Math.max(START_HOUR, Math.min(23, end));
    return Math.max(3, ((e - s) / TOTAL_HOURS) * 100);
  };

  const timeToHour = (value) => {
    if (!value || value === '-') return null;
    const match = String(value).match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return Number(match[1]) + Number(match[2]) / 60;
  };

  const getTimelineBlocks = (driver) => {
    const startDuty = Number(driver.startDutyHour ?? driver.dutyStartHour ?? 8);
    const endDuty = Number(driver.endDutyHour ?? driver.dutyEndHour ?? 18);

    // Duty Start and Duty End (rendered as solid black blocks)
    const dutyBlocks = [
      {
        id: `duty-start-${driver.id}`,
        type: 'DUTY_START',
        startHour: startDuty,
        endHour: Math.min(startDuty + 0.8, endDuty),
        label: 'Duty Start',
        details: `${driver.name} Shift Start at ${startDuty}:00`,
      },
      {
        id: `duty-end-${driver.id}`,
        type: 'DUTY_END',
        startHour: Math.max(endDuty - 0.8, startDuty),
        endHour: endDuty,
        label: 'Duty End',
        details: `${driver.name} Shift End at ${endDuty}:00`,
      },
    ];

    // ONLY breaks explicitly added by the user
    const addedBreaks = (driver.blocks || []).filter((b) => b.type === 'BREAK');

    // Assigned passenger bookings: label is "Fill"
    const assignedBookingBlocks = bookings
      .filter(
        (booking) =>
          (booking.driverName === driver.name || booking.driverId === driver.id) &&
          (!selectedDate || booking.date === selectedDate) &&
          booking.status !== 'Cancelled' &&
          booking.status !== 'Declined'
      )
      .map((booking) => {
        const startHour = timeToHour(booking.requestedPickupTime);
        let endHour = timeToHour(booking.plannedDropTime);
        if (startHour === null || endHour === null) return null;
        if (endHour <= startHour) endHour = startHour + 0.5;
        return {
          id: `booking-${booking.id}`,
          type: 'TRIP',
          startHour,
          endHour,
          label: 'Fill',
          details: `Booking #${booking.id} | ${booking.employeeName} (${booking.fromLocation} → ${booking.toLocation}) [${booking.requestedPickupTime} - ${booking.plannedDropTime}]`,
        };
      })
      .filter(Boolean);

    return [...dutyBlocks, ...addedBreaks, ...assignedBookingBlocks];
  };

  const getDisplayStatus = (driver) => {
    const startDuty = Number(driver.startDutyHour ?? driver.dutyStartHour ?? 8);
    const endDuty = Number(driver.endDutyHour ?? driver.dutyEndHour ?? 18);

    if (currentHour < startDuty || currentHour >= endDuty) {
      return 'Off Duty';
    }

    const activeBreak = (driver.blocks || []).find(
      (block) =>
        block.type === 'BREAK' &&
        currentHour >= block.startHour &&
        currentHour < block.endHour
    );
    if (activeBreak) return 'On Break';
    return driver.status === 'On Break' ? 'Online' : driver.status;
  };

  return (
    <section className="card-section" style={{ position: 'relative' }}>
      {/* Header bar */}
      <div className="card-header-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>
            Driver Availability & Timetable
          </h2>
          <span className="badge-count">{filteredDrivers.length} Drivers</span>
        </div>

        {/* Search */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="search-input-wrapper" style={{ width: '240px' }}>
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search driver, vehicle..."
              className="search-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Timeline Grid Container */}
      <div className="timeline-viewport timeline-container">
        {/* Horizontal Hours Header Row (06:00 to 22:00) */}
        <div className="timeline-header-hours">
          <div className="timeline-driver-col-hdr">Driver / Vehicle</div>
          <div className="timeline-hours-track" style={{ position: 'relative' }}>
            {HOURS.map((h) => (
              <div key={h} className="timeline-hour-slot-hdr">
                <span>{h < 10 ? `0${h}:00` : `${h}:00`}</span>
              </div>
            ))}

            {/* Current Time Badge above the hour track */}
            {currentHour >= START_HOUR && currentHour <= 23 && (
              <div
                style={{
                  position: 'absolute',
                  left: `${getOffsetPct(currentHour)}%`,
                  top: '4px',
                  transform: 'translateX(-50%)',
                  background: '#ef4444',
                  color: '#ffffff',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  padding: '2px 6px',
                  borderRadius: '4px',
                  zIndex: 20,
                  whiteSpace: 'nowrap',
                  boxShadow: '0 2px 4px rgba(239, 68, 68, 0.4)',
                }}
              >
                {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>
        </div>

        {/* Drivers Rows */}
        {filteredDrivers.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)' }}>
            No drivers found matching "{searchQuery}"
          </div>
        ) : (
          filteredDrivers.map((driver) => {
            const isMenuOpen = activeMenuDriverId === driver.id;
            const displayStatus = getDisplayStatus(driver);
            const startDuty = Number(driver.startDutyHour ?? driver.dutyStartHour ?? 8);
            const endDuty = Number(driver.endDutyHour ?? driver.dutyEndHour ?? 18);

            return (
              <div key={driver.id} className="timeline-driver-row">
                {/* Driver Profile Column */}
                <div className="timeline-driver-profile">
                  <div className="driver-info-block">
                    <div className="driver-name">{driver.name}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span className={`driver-status-chip ${displayStatus.toLowerCase().replace(' ', '')}`}>
                        {displayStatus}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {driver.vehicleNumber}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#10b981', fontWeight: 600, marginTop: '2px' }}>
                      Shift: {startDuty}:00 - {endDuty}:00
                    </div>
                  </div>

                  {/* 3-Dot Action Menu */}
                  <div style={{ position: 'relative' }}>
                    <button
                      type="button"
                      className="btn-icon"
                      style={{ width: '28px', height: '28px' }}
                      title="Driver Hourly Scheduling Controls"
                      onClick={() => setActiveMenuDriverId(isMenuOpen ? null : driver.id)}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {isMenuOpen && (
                      <div
                        style={{
                          position: 'absolute',
                          left: '32px',
                          top: '0',
                          background: 'var(--bg-card)',
                          border: '1px solid var(--border-card)',
                          borderRadius: 'var(--radius-md)',
                          boxShadow: 'var(--shadow-lg)',
                          padding: '6px',
                          width: '170px',
                          zIndex: 30,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '2px',
                        }}
                      >
                        <button
                          type="button"
                          className="nav-tab-btn"
                          style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.8rem' }}
                          onClick={() => {
                            onStatusToggle(driver.id, driver.status === 'Online' ? 'Offline' : 'Online');
                            setActiveMenuDriverId(null);
                          }}
                        >
                          {driver.status === 'Online' ? <WifiOff size={14} color="#ef4444" /> : <Wifi size={14} color="#10b981" />}
                          <span>{driver.status === 'Online' ? 'Set Offline' : 'Set Online'}</span>
                        </button>

                        <button
                          type="button"
                          className="nav-tab-btn"
                          style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.8rem' }}
                          onClick={() => {
                            onOpenDutyModal(driver, 'START_DUTY');
                            setActiveMenuDriverId(null);
                          }}
                        >
                          <Play size={14} color="#10b981" />
                          <span>Set Duty Start</span>
                        </button>

                        <button
                          type="button"
                          className="nav-tab-btn"
                          style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.8rem' }}
                          onClick={() => {
                            onOpenDutyModal(driver, 'END_DUTY');
                            setActiveMenuDriverId(null);
                          }}
                        >
                          <Square size={14} color="#ef4444" />
                          <span>Set Duty End</span>
                        </button>

                        <button
                          type="button"
                          className="nav-tab-btn"
                          style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.8rem' }}
                          onClick={() => {
                            onOpenDutyModal(driver, 'SET_SHIFT');
                            setActiveMenuDriverId(null);
                          }}
                        >
                          <Clock size={14} color="#3b82f6" />
                          <span>Adjust Full Shift</span>
                        </button>

                        <button
                          type="button"
                          className="nav-tab-btn"
                          style={{ width: '100%', justifyContent: 'flex-start', padding: '6px 10px', fontSize: '0.8rem' }}
                          onClick={() => {
                            onOpenBreakModal(driver);
                            setActiveMenuDriverId(null);
                          }}
                        >
                          <Coffee size={14} color="#f59e0b" />
                          <span>Add Break</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Timeline Grid Track */}
                <div className="timeline-grid-track" style={{ position: 'relative' }}>
                  {/* Current Time Vertical Line indicator */}
                  {currentHour >= START_HOUR && currentHour <= 22 && (
                    <div
                      style={{
                        position: 'absolute',
                        left: `${getOffsetPct(currentHour)}%`,
                        top: 0,
                        bottom: 0,
                        width: '2px',
                        background: '#ef4444',
                        zIndex: 12,
                        pointerEvents: 'none',
                        opacity: 0.85,
                      }}
                    />
                  )}

                  {/* Timeline Blocks (Duty Start, Duty End, Breaks when added, Fill for bookings) */}
                  {getTimelineBlocks(driver).map((block) => {
                    const leftPct = getOffsetPct(block.startHour);
                    const baseWidthPct = getWidthPct(block.startHour, block.endHour);
                    const widthPct = ['DUTY_START', 'DUTY_END'].includes(block.type)
                      ? Math.max(baseWidthPct, 6)
                      : baseWidthPct;

                    let typeClass = 'type-trip';
                    if (block.type === 'BREAK') typeClass = 'type-break';
                    else if (block.type === 'DUTY_START') typeClass = 'type-dutystart';
                    else if (block.type === 'DUTY_END') typeClass = 'type-dutyend';

                    return (
                      <div
                        key={block.id}
                        className={`timeline-block ${typeClass}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        title={block.details || `${block.label} (${block.startHour}:00 - ${block.endHour}:00)`}
                        onClick={() => onSelectBlock && onSelectBlock(driver, block)}
                      >
                        {block.type === 'BREAK' && <Coffee size={11} style={{ marginRight: '4px' }} />}
                        <span>{block.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend Footer */}
      <div className="timeline-legend" style={{ display: 'flex', gap: '20px', padding: '12px 16px', borderTop: '1px solid var(--border-light)', background: 'var(--bg-card)', fontSize: '0.78rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '14px', height: '14px', background: '#000000', borderRadius: '3px', display: 'inline-block', border: '1px solid #333' }} />
          <span style={{ fontWeight: 600 }}>Duty Start / Duty End</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '14px', height: '14px', background: 'var(--timeline-trip-bg)', border: '1px solid var(--timeline-trip-border)', borderRadius: '3px', display: 'inline-block' }} />
          <span style={{ fontWeight: 600 }}>Fill (Booking at that time)</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '14px', height: '14px', background: 'var(--timeline-break-bg)', border: '1px solid var(--timeline-break-border)', borderRadius: '3px', display: 'inline-block' }} />
          <span style={{ fontWeight: 600 }}>Break</span>
        </div>
      </div>
    </section>
  );
};

export default DriverTimeline;
