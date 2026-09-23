import React, { useEffect, useState } from 'react';
import { Search, MoreVertical, Play, Square, Coffee, Wifi, WifiOff } from 'lucide-react';

const HOURS = [6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
const START_HOUR = 6;
const TOTAL_HOURS = 16; // 22 - 6

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
    const clamped = Math.max(START_HOUR, Math.min(22, hour));
    return ((clamped - START_HOUR) / TOTAL_HOURS) * 100;
  };

  const getWidthPct = (start, end) => {
    const s = Math.max(START_HOUR, Math.min(22, start));
    const e = Math.max(START_HOUR, Math.min(22, end));
    return Math.max(2.5, ((e - s) / TOTAL_HOURS) * 100);
  };

  const timeToHour = (value) => {
    if (!value || value === '-') return null;
    const match = String(value).match(/^(\d{1,2}):(\d{2})/);
    if (!match) return null;
    return Number(match[1]) + Number(match[2]) / 60;
  };

  const getTimelineBlocks = (driver) => {
    const scheduleBlocks = (driver.blocks || []).filter((block) =>
      block.details === 'LIVE' && ['BREAK', 'DUTY_START', 'DUTY_END'].includes(block.type)
    );
    const assignedBookingBlocks = bookings
      .filter((booking) =>
        booking.driverName === driver.name &&
        (!selectedDate || booking.date === selectedDate) &&
        ['Accepted', 'Waiting', 'Requested', 'On Going'].includes(booking.status)
      )
      .map((booking) => {
        const startHour = timeToHour(booking.requestedPickupTime);
        let endHour = timeToHour(booking.plannedDropTime);
        if (startHour === null || endHour === null) return null;
        if (endHour <= startHour) endHour = startHour + 0.25;
        return {
          id: `booking-${booking.id}`,
          type: 'TRIP',
          startHour,
          endHour,
          label: "Fill",
          details: `Booking #${booking.id} | ${booking.employeeName}`,
        };
      })
      .filter(Boolean);

    return [...scheduleBlocks, ...assignedBookingBlocks];
  };

  const getDisplayStatus = (driver) => {
    const activeBreak = (driver.blocks || []).find((block) =>
      block.details === 'LIVE' &&
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <h2 className="card-title">Driver Management</h2>
          <div className="search-input-box" style={{ minWidth: '220px' }}>
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search driver or vehicle..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

      </div>

      {/* Timeline Viewport */}
      <div className="timeline-viewport">
        {/* Hours Header Row */}
        <div className="timeline-header-hours">
          <div className="timeline-driver-col-hdr">Driver / Vehicle</div>
          <div className="timeline-hours-track">
            {HOURS.map((h) => (
              <div key={h} className="timeline-hour-slot-hdr">
                {`${h}:00`}
              </div>
            ))}
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
                          width: '160px',
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
                          <span>Start Duty</span>
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
                          <span>End Duty</span>
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
                <div className="timeline-grid-track">
                  {getTimelineBlocks(driver).map((block) => {
                    const leftPct = getOffsetPct(block.startHour);
                    const baseWidthPct = getWidthPct(block.startHour, block.endHour);
                    const widthPct = ['DUTY_START', 'DUTY_END'].includes(block.type)
                      ? Math.max(baseWidthPct, 5)
                      : baseWidthPct;

                    let typeClass = 'type-trip';
                    if (block.type === 'BREAK') typeClass = 'type-break';
                    else if (block.type === 'DUTY_START') typeClass = 'type-dutystart';
                    else if (block.type === 'DUTY_END') typeClass = 'type-dutyend';
                    else if (block.type === 'EMPTY_LEG') typeClass = 'type-empty';
                    else if (block.type === 'VEHICLE_CHANGE') typeClass = 'type-vehchange';

                    return (
                      <div
                        key={block.id}
                        className={`timeline-block ${typeClass}`}
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                        }}
                        title={`${block.label} (${block.startHour}:00 - ${block.endHour}:00) - ${block.details || ''}`}
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

      {/* Legend for the schedule blocks shown above */}
      <div className="timeline-legend">
        <div className="legend-item">
          <div className="legend-swatch" style={{ background: 'var(--brand-navy)' }} />
          <span>Duty Start/Duty End</span>
        </div>
       
        <div className="legend-item">
          <div className="legend-swatch" style={{ background: 'var(--timeline-trip-bg)', border: '1px solid var(--timeline-trip-border)' }} />
          <span>Pickup / Drop</span>
        </div>
        <div className="legend-item">
          <div className="legend-swatch" style={{ background: 'var(--timeline-break-bg)', border: '1px solid var(--timeline-break-border)' }} />
          <span>Break</span>
        </div>
      </div>
    </section>
  );
};
