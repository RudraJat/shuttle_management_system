import React from 'react';
import { Calendar, TrendingUp } from 'lucide-react';

const toHour = (value) => {
  const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
  return match ? Number(match[1]) + Number(match[2]) / 60 : null;
};

export const AnalyticsView = ({ bookings = [], selectedDate = '', onDateChange }) => {
  const hourlyDemand = Array.from({ length: 17 }, (_, index) => {
    const hour = index + 6;
    const demand = bookings.filter((booking) => {
      if (booking.date !== selectedDate) return false;
      const pickupHour = toHour(booking.requestedPickupTime);
      return pickupHour !== null && Math.floor(pickupHour) === hour;
    }).length;

    return { hour, demand };
  });

  const maxDemand = Math.max(1, ...hourlyDemand.map((item) => item.demand));
  const totalDemand = hourlyDemand.reduce((total, item) => total + item.demand, 0);

  return (
    <section className="card-section" style={{ margin: 0 }}>
      <div className="card-header-bar" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 className="card-title">
            <TrendingUp size={18} color="var(--brand-primary)" />
            Hourly Demand Monitoring
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            All bookings by requested pickup hour, including completed rides.
          </p>
        </div>
        <div className="date-badge-box">
          <Calendar size={15} color="var(--brand-primary)" />
          <input
            type="date"
            value={selectedDate}
            onChange={(event) => onDateChange?.(event.target.value)}
            aria-label="Demand date"
          />
        </div>
      </div>

      <div style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '18px' }}>
          <strong style={{ fontSize: '1.1rem' }}>{totalDemand} bookings</strong>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{selectedDate}</span>
        </div>

        <div style={{ minHeight: '280px', display: 'flex', alignItems: 'flex-end', gap: '10px', borderBottom: '1px solid var(--border-light)', padding: '0 8px 28px' }}>
          {hourlyDemand.map((item) => (
            <div key={item.hour} style={{ flex: 1, height: '240px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: item.demand ? 'var(--brand-blue)' : 'var(--text-muted)' }}>
                {item.demand}
              </span>
              <div
                title={`${item.demand} booking${item.demand === 1 ? '' : 's'} at ${String(item.hour).padStart(2, '0')}:00`}
                style={{ width: '100%', maxWidth: '34px', height: `${Math.max(item.demand ? 8 : 2, (item.demand / maxDemand) * 190)}px`, background: item.demand ? 'var(--brand-blue)' : 'var(--border-light)', borderRadius: '4px 4px 0 0', transition: 'height 0.25s ease' }}
              />
              <span style={{ fontSize: '0.7rem', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                {String(item.hour).padStart(2, '0')}:00
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
