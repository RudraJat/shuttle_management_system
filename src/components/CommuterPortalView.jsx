import React, { useEffect, useState } from 'react';
import { Bus, QrCode, History, CheckCircle, ArrowRight, Star, ShieldCheck, RefreshCw, Lock, Sparkles, Navigation, Clock, User, Ban } from 'lucide-react';
import JellyRadio from './JellyRadio';
import Peel from './Peel';
import { CAMPUS_STOPS } from '../utils/realTimeEngine';

export const CommuterPortalView = ({
  bookings = [],
  routes = [],
  shuttles = [],
  bookingDate,
  onBookRide,
  onCancelBooking,
}) => {
  const [activeSubTab, setActiveSubTab] = useState('book');
  const [userRole, setUserRole] = useState(() => localStorage.getItem('commuterRole') || 'Student');
  const [studentName, setStudentName] = useState(() => localStorage.getItem('commuterName') || '');
  const [studentId, setStudentId] = useState(() => localStorage.getItem('commuterId') || '');
  const [fromStop, setFromStop] = useState(CAMPUS_STOPS[1]); // Central Library
  const [toStop, setToStop] = useState(CAMPUS_STOPS[3]);   // Data Centre
  const [requestedTime, setRequestedTime] = useState('11:35');
  const [passengerNotes, setPassengerNotes] = useState('');
  const [selectedRouteId, setSelectedRouteId] = useState('rt-1');
  const [selectedTripId, setSelectedTripId] = useState(null);

  useEffect(() => {
    localStorage.setItem('commuterRole', userRole);
    localStorage.setItem('commuterName', studentName);
    localStorage.setItem('commuterId', studentId);
  }, [userRole, studentName, studentId]);

  // Filter my trips
  const normalizedStudentId = studentId.trim().replace(/^(stu|emp)-/i, '');
  const commuterId = normalizedStudentId.toLowerCase();
  const myTrips = bookings.filter((booking) => {
    const bookingId = (booking.employeeId || '').replace(/^(stu|emp)-/i, '').toLowerCase();
    return bookingId === commuterId && commuterId.length > 0;
  });
  const approvedPass = myTrips.find((booking) => booking.id === selectedTripId && booking.status === 'Accepted');

  // Active Ongoing or Waiting Trip
  const activeTrip = myTrips.find((t) => t.status === 'On Going' || t.status === 'Waiting' || t.status === 'Accepted');

  // Estimate next arriving shuttle for the chosen fromStop
  const matchingShuttle = shuttles.find((s) => {
    const route = routes.find((r) => r.id === s.routeId);
    return route && route.stops && route.stops.includes(fromStop);
  }) || shuttles[0];

  const handleBook = (e) => {
    e.preventDefault();
    const newBookingId = String(Math.floor(Math.random() * 900000 + 100000));
    const now = new Date();
    const nowHours = String(now.getHours()).padStart(2, '0');
    const nowMins = String(now.getMinutes()).padStart(2, '0');
    const dropMins = String((now.getMinutes() + 14) % 60).padStart(2, '0');
    const dropHours = String(now.getHours() + (now.getMinutes() + 14 >= 60 ? 1 : 0)).padStart(2, '0');

    const newBooking = {
      id: newBookingId,
      employeeName: studentName.trim() || 'Campus Commuter',
      employeeId: `${userRole === 'Student' ? 'STU' : 'EMP'}-${normalizedStudentId}`,
      role: userRole,
      fromLocation: fromStop,
      toLocation: toStop,
      requestedPickupTime: requestedTime || `${nowHours}:${nowMins}`,
      plannedDropTime: `${dropHours}:${dropMins}`,
      status: 'Waiting',
      vehicleNumber: '-',
      vehicleDetails: 'Awaiting admin assignment',
      driverName: 'Unassigned',
      driverPhone: '-',
      driverRating: 0,
      date: bookingDate || new Date().toISOString().slice(0, 10),
      pickupTime: '-',
      actualDropTime: '-',
      delayMinutes: 0,
      notes: passengerNotes || `Booked via ${userRole} Self-Service Portal`,
    };

    onBookRide(newBooking);
    setSelectedTripId(newBookingId);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Banner with Role Badging */}
      <div
        style={{
          background: 'linear-gradient(135deg, #064e3b 0%, #0f172a 100%)',
          color: '#fff',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(16, 185, 129, 0.2)', padding: '4px 10px', borderRadius: 'var(--radius-full)', fontSize: '0.75rem', fontWeight: 700, color: '#6ee7b7', marginBottom: '8px' }}>
            <ShieldCheck size={14} />
            Verified Campus Transit Commuter Service
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Student & Staff Commuter Portal</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.88rem', marginTop: '4px' }}>
            Instant campus transit booking, digital QR e-Pass, and trip tracking history.
          </p>
        </div>

        {/* Tab switch with JellyRadio */}
        <div style={{ background: 'rgba(255,255,255,0.08)', padding: '2px', borderRadius: 'var(--radius-full)' }}>
          <JellyRadio
            items={[
              { value: 'book', label: 'Book Shuttle', icon: <Bus size={15} /> },
              { value: 'history', label: `Trip History (${myTrips.length})`, icon: <History size={15} /> },
            ]}
            value={activeSubTab}
            onChange={(val) => setActiveSubTab(val)}
            size="md"
            gap={6}
            radius={20}
            chipColor="rgba(255, 255, 255, 0.12)"
            activeColor="#10b981"
            textColor="#e2e8f0"
            activeTextColor="#ffffff"
            swell={0.16}
            barge={5}
            jelly={1}
            bounce={0.25}
          />
        </div>
      </div>

      {/* Active Live Ride Alert / Radar if Commuter has an active trip */}
      {activeTrip && (
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(59, 130, 246, 0.1) 100%)',
            border: '2px solid rgba(16, 185, 129, 0.4)',
            borderRadius: 'var(--radius-md)',
            padding: '16px 22px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '50%',
                background: '#10b981',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Navigation size={22} className="animate-pulse" />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 800, color: 'var(--brand-primary)', textTransform: 'uppercase' }}>
                  ACTIVE RIDE #{activeTrip.id}
                </span>
                <span className={`status-badge ${activeTrip.status.toLowerCase().replace(/[\s-]/g, '')}`}>
                  {activeTrip.status}
                </span>
              </div>
              <div style={{ fontSize: '1.05rem', fontWeight: 700, marginTop: '2px' }}>
                {activeTrip.fromLocation} → {activeTrip.toLocation}
              </div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                Vehicle: <strong>{activeTrip.vehicleNumber}</strong> • Driver: <strong>{activeTrip.driverName}</strong> ({activeTrip.driverPhone})
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Arrival</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
                ~3 Mins
              </div>
            </div>

            {onCancelBooking && (activeTrip.status === 'Waiting' || activeTrip.status === 'Requested') && (
              <button
                type="button"
                className="btn-secondary"
                style={{ color: '#ef4444', padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => onCancelBooking(activeTrip.id)}
              >
                <Ban size={14} />
                <span>Cancel Ride</span>
              </button>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'book' ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(320px, 1fr) minmax(320px, 420px)', gap: '24px', alignItems: 'start' }}>
          {/* Booking Form Card */}
          <div className="card-section">
            <div className="card-header-bar">
              <h2 className="card-title">
                <Bus size={18} color="var(--brand-primary)" />
                Schedule a Campus Ride
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--brand-primary)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={12} />
                Next Shuttle arriving in ~2 mins
              </span>
            </div>

            <form onSubmit={handleBook} style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Persona Selector: Student or Staff */}
              <div className="form-group">
                <label>I am booking as:</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    className={`btn-secondary ${userRole === 'Student' ? 'active' : ''}`}
                    onClick={() => setUserRole('Student')}
                    style={{
                      justifyContent: 'center',
                      background: userRole === 'Student' ? 'rgba(16, 185, 129, 0.15)' : undefined,
                      borderColor: userRole === 'Student' ? 'var(--brand-primary)' : undefined,
                      color: userRole === 'Student' ? 'var(--brand-primary)' : undefined,
                      fontWeight: 700,
                    }}
                  >
                    <span>🎓 Student</span>
                  </button>
                  <button
                    type="button"
                    className={`btn-secondary ${userRole === 'Staff' ? 'active' : ''}`}
                    onClick={() => setUserRole('Staff')}
                    style={{
                      justifyContent: 'center',
                      background: userRole === 'Staff' ? 'rgba(59, 130, 246, 0.15)' : undefined,
                      borderColor: userRole === 'Staff' ? 'var(--brand-blue)' : undefined,
                      color: userRole === 'Staff' ? 'var(--brand-blue)' : undefined,
                      fontWeight: 700,
                    }}
                  >
                    <span>💼 Faculty / Staff</span>
                  </button>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={studentName}
                    placeholder="e.g. Thompson"
                    onChange={(e) => setStudentName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label>{userRole === 'Student' ? 'Roll No / Registration ID' : 'Faculty / Staff ID'}</label>
                  <input
                    type="text"
                    required
                    className="form-control"
                    value={studentId}
                    placeholder={userRole === 'Student' ? 'e.g. 12019482' : 'e.g. EMP-12019482'}
                    onChange={(e) => setStudentId(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group">
                  <label>From Pickup Point</label>
                  <select
                    className="form-control"
                    value={fromStop}
                    onChange={(e) => setFromStop(e.target.value)}
                  >
                    {CAMPUS_STOPS.map((st) => (
                      <option key={st} value={st}>{st}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label>To Destination Point</label>
                  <select
                    className="form-control"
                    value={toStop}
                    onChange={(e) => setToStop(e.target.value)}
                  >
                    {CAMPUS_STOPS.map((st) => (
                      <option key={st} value={st} disabled={st === fromStop}>{st}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Preferred Pickup Time</label>
                <input
                  type="time"
                  required
                  className="form-control"
                  value={requestedTime}
                  onChange={(e) => setRequestedTime(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Notes / Luggage Details (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Near Front Gate, carrying sports equipment or lab kit"
                  className="form-control"
                  value={passengerNotes}
                  onChange={(e) => setPassengerNotes(e.target.value)}
                />
              </div>

              {/* Transit preview summary */}
              <div
                style={{
                  background: 'var(--bg-card-subtle)',
                  border: '1px solid var(--border-light)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Estimated Trip Duration</div>
                  <div style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--brand-primary)' }}>11 Minutes</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Route: {matchingShuttle?.routeName || 'Campus Express'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Assigned Vehicle</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>
                    {matchingShuttle ? matchingShuttle.vehicleNumber : 'NB-002-RF'}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    Driver: {matchingShuttle ? matchingShuttle.driverName : 'Steve Smith'}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', padding: '12px', fontSize: '0.95rem' }}
              >
                <CheckCircle size={18} />
                <span>Confirm Booking & Generate e-Pass</span>
              </button>
            </form>
          </div>

          {/* Digital QR e-Pass appears only after admin acceptance. */}
          {approvedPass && <Peel
            side="left"
            mode="cursor"
            reveal={260}
            zone={200}
            curl={280}
            bow={70}
            shade={0.28}
            shine={1}
            shineDistance={1000}
            bulge={45}
            perspective={1800}
            smoothing={0.25}
            under={
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  background: 'linear-gradient(135deg, #091e3a 0%, #1e1b4b 60%, #064e3b 100%)',
                  color: '#ffffff',
                  padding: '24px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  borderRadius: 'var(--radius-lg)',
                  border: '2px solid rgba(16, 185, 129, 0.4)',
                  boxShadow: 'inset 0 0 50px rgba(16, 185, 129, 0.18)',
                  boxSizing: 'border-box',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#34d399', fontSize: '0.8rem', fontWeight: 800 }}>
                      <ShieldCheck size={18} />
                      <span>OFFICIAL NFC TRANSIT CLEARANCE</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', background: 'rgba(52, 211, 153, 0.25)', color: '#6ee7b7', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>
                      VERIFIED TOKEN
                    </span>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Cryptographic Anti-Counterfeit Hash
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: '#a7f3d0', marginTop: '4px', wordBreak: 'break-all' }}>
                      SHA256: 9e8a4c22b01f9948d3c1a702b6623e19
                    </div>
                  </div>

                  <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '0.78rem', color: '#cbd5e1' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>Security Clearance:</span>
                      <strong style={{ color: '#34d399' }}>Level 3 (Full Campus Transit Access)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>NFC RFID Tag:</span>
                      <span style={{ fontFamily: 'var(--font-mono)', color: '#60a5fa' }}>0x7F9B-2C4D-LPU-AUTH</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '6px' }}>
                      <span style={{ color: '#94a3b8' }}>Kiosk Protocol:</span>
                      <span>ISO-14443A High-Speed Gateway</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Authorized Commuter:</span>
                      <strong>{studentName} ({userRole === 'Student' ? 'STU' : 'EMP'}-{studentId})</strong>
                    </div>
                  </div>
                </div>

                <div style={{ borderTop: '1px dashed rgba(255, 255, 255, 0.25)', paddingTop: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} color="#34d399" />
                  <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                    Tamper-evident holographic security sticker. Move cursor away to re-seal sticker pass.
                  </span>
                </div>
              </div>
            }
          >
            <div className="card-section" style={{ margin: 0, height: '100%', boxSizing: 'border-box' }}>
              <div className="card-header-bar">
                <h2 className="card-title">
                  <QrCode size={18} color="var(--brand-blue)" />
                  Digital QR Transit Pass
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.7rem', color: 'var(--brand-primary)', display: 'inline-flex', alignItems: 'center', gap: '3px', fontWeight: 600 }}>
                    <Sparkles size={12} />
                    Peelable Sticker
                  </span>
                  <span className="status-badge waiting">Pre-Approved</span>
                </div>
              </div>

              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                {/* QR Code Graphic Box */}
                <div
                  style={{
                    width: '180px',
                    height: '180px',
                    background: '#ffffff',
                    border: '2px dashed var(--brand-primary)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '12px',
                    boxShadow: 'var(--shadow-sm)',
                    position: 'relative',
                  }}
                >
                  <QrCode size={120} color="#0f172a" />
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: '4px' }}>
                    PASS-{approvedPass.id}
                  </span>
                </div>

                <div style={{ marginTop: '16px' }}>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{approvedPass.employeeName}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    ID: {approvedPass.employeeId} ({userRole})
                  </div>
                </div>

                <div
                  style={{
                    width: '100%',
                    marginTop: '16px',
                    padding: '12px',
                    background: 'var(--bg-card-subtle)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid var(--border-light)',
                    textAlign: 'left',
                    fontSize: '0.8rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '6px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>From:</span>
                    <strong>{approvedPass.fromLocation}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>To:</span>
                    <strong>{approvedPass.toLocation}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Pickup:</span>
                    <strong>{approvedPass.requestedPickupTime}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Assigned Driver:</span>
                    <strong>{approvedPass.driverName || 'Unassigned'}</strong>
                  </div>
                </div>

                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '14px' }}>
                  Move cursor toward the left edge to peel back the sticker and inspect the underlying NFC tamper-evident security token.
                </p>
              </div>
            </div>
          </Peel>}
        </div>
      ) : (
        /* Trip History Tracking */
        <div className="card-section">
          <div className="card-header-bar">
            <h2 className="card-title">
              <History size={18} color="var(--brand-primary)" />
              My Campus Transit Trip History
            </h2>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Total Past Trips: <strong>{myTrips.length}</strong>
            </span>
          </div>

          <div className="table-wrapper">
            <table className="booking-table">
              <thead>
                <tr>
                  <th>Booking ID</th>
                  <th>Date</th>
                  <th>Route</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Pickup</th>
                  <th>Actual Drop</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {myTrips.length === 0 ? (
                  <tr>
                    <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                      No past trips found for {studentName} ({studentId}). Schedule a ride above to get started!
                    </td>
                  </tr>
                ) : (
                  myTrips.map((trip) => (
                    <tr
                      key={trip.id}
                      onClick={() => {
                        setSelectedTripId(trip.id);
                        setActiveSubTab('book');
                      }}
                      style={{ cursor: 'pointer' }}
                      title={trip.status === 'Accepted' ? 'Select to view your QR pass' : 'Select ride'}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-blue)' }}>
                        #{trip.id}
                      </td>
                      <td>{trip.date}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}>
                          <span>{trip.fromLocation}</span>
                          <ArrowRight size={12} color="var(--text-muted)" />
                          <span>{trip.toLocation}</span>
                        </div>
                      </td>
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem' }}>{trip.vehicleNumber}</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>{trip.driverName}</span>
                          <Star size={12} fill="#b45309" color="#b45309" />
                        </div>
                      </td>
                      <td>{trip.requestedPickupTime}</td>
                      <td>{trip.actualDropTime || trip.plannedDropTime}</td>
                      <td>
                        <span className={`status-badge ${(trip.status || '').toLowerCase().replace(/[\s-]/g, '')}`}>
                          {trip.status}
                        </span>
                      </td>
                      <td>
                        <button
                          type="button"
                          className="btn-view"
                          onClick={(event) => {
                            event.stopPropagation();
                            setFromStop(trip.fromLocation);
                            setToStop(trip.toLocation);
                            setActiveSubTab('book');
                          }}
                        >
                          <RefreshCw size={12} />
                          <span>Re-book</span>
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
