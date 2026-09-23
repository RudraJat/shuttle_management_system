import React, { useState } from 'react';
import { Search, Calendar, ChevronLeft, ChevronRight, Eye, Edit3, Trash2, Filter, ArrowUpDown, CheckSquare, Square, Check, X, ShieldAlert } from 'lucide-react';
import JellyRadio from './JellyRadio';

const STATUS_FILTERS = [
  'All',
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

export const BookingManagementTable = ({
  bookings = [],
  selectedDate = '',
  onDateChange,
  onViewBooking,
  onEditBooking,
  onUpdateBookingStatus,
  onDeleteBooking,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState('id');
  const [sortAsc, setSortAsc] = useState(false);
  const pageSize = 10;

  // Filter logic
  let filtered = bookings.filter((b) => {
    const matchesSearch =
      (b.id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.employeeName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.employeeId || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.fromLocation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.toLocation || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.vehicleNumber || '').toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'All' || (b.status || '').toLowerCase() === statusFilter.toLowerCase();
    const matchesDate = !selectedDate || b.date === selectedDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Sort logic
  filtered.sort((a, b) => {
    let vA = a[sortField] || '';
    let vB = b[sortField] || '';
    if (typeof vA === 'string') vA = vA.toLowerCase();
    if (typeof vB === 'string') vB = vB.toLowerCase();
    if (vA < vB) return sortAsc ? -1 : 1;
    if (vA > vB) return sortAsc ? 1 : -1;
    return 0;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIndex = (currentPage - 1) * pageSize;
  const paginated = filtered.slice(startIndex, startIndex + pageSize);

  const toggleSort = (field) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const getStatusBadgeClass = (status) => {
    const s = (status || '').toLowerCase().replace(/[\s-]/g, '');
    return `status-badge ${s}`;
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(paginated.map((b) => b.id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectRow = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk actions
  const handleBulkStatusChange = (newStatus) => {
    if (!onUpdateBookingStatus) return;
    selectedIds.forEach((id) => {
      onUpdateBookingStatus(id, newStatus, `Bulk updated by Admin to ${newStatus}`);
    });
    setSelectedIds([]);
  };

  return (
    <section className="card-section">
      {/* Header with Search and Date Filter */}
      <div className="card-header-bar" style={{ flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h2 className="card-title" style={{ margin: 0 }}>Booking Management (Admin Dispatch)</h2>
          <span style={{ fontSize: '0.78rem', background: 'var(--bg-card-subtle)', padding: '3px 8px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-light)', fontWeight: 600 }}>
            {filtered.length} Total Bookings
          </span>
        </div>

        <div className="filter-toolbar">
          <div className="search-input-box">
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              placeholder="Search Passenger, ID, Route, Vehicle..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>

          <div className="date-badge-box">
            <Calendar size={15} color="var(--brand-primary)" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => {
                onDateChange?.(e.target.value);
                setCurrentPage(1);
              }}
              aria-label="Booking date"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs with JellyRadio */}
      <div
        style={{
          display: 'flex',
          gap: '12px',
          padding: '8px 20px',
          background: 'var(--bg-card-subtle)',
          borderBottom: '1px solid var(--border-light)',
          overflowX: 'auto',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <Filter size={13} />
            STATUS:
          </span>
          <JellyRadio
            items={STATUS_FILTERS}
            value={statusFilter}
            onChange={(val) => {
              setStatusFilter(val);
              setCurrentPage(1);
            }}
            size="sm"
            gap={6}
            radius={14}
            chipColor="var(--bg-card)"
            activeColor="var(--brand-blue)"
            textColor="var(--text-secondary)"
            activeTextColor="#ffffff"
            swell={0.16}
            barge={4}
            jelly={1}
            bounce={0.24}
          />
        </div>

        {/* Bulk Action Bar when rows are selected */}
        {selectedIds.length > 0 && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(59, 130, 246, 0.1)', padding: '4px 10px', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(59, 130, 246, 0.3)' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--brand-blue)' }}>
              {selectedIds.length} Selected
            </span>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#16a34a' }}
              onClick={() => handleBulkStatusChange('Accepted')}
            >
              <Check size={12} />
              <span>Accept</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#059669' }}
              onClick={() => handleBulkStatusChange('Completed')}
            >
              <span>Complete</span>
            </button>
            <button
              type="button"
              className="btn-secondary"
              style={{ padding: '3px 8px', fontSize: '0.72rem', color: '#dc2626' }}
              onClick={() => handleBulkStatusChange('Cancelled')}
            >
              <X size={12} />
              <span>Cancel</span>
            </button>
          </div>
        )}
      </div>

      {/* Table Wrapper */}
      <div className="table-wrapper">
        <table className="booking-table">
          <thead>
            <tr>
              <th style={{ width: '36px', textAlign: 'center' }}>
                <input
                  type="checkbox"
                  checked={paginated.length > 0 && paginated.every((b) => selectedIds.includes(b.id))}
                  onChange={handleSelectAll}
                />
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('id')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Booking ID</span>
                
                </div>
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('employeeName')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Passenger (User)</span>
                </div>
              </th>
              <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('status')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span>Status</span>
                </div>
              </th>
              <th>From</th>
              <th>To</th>
              <th>Vehicle</th>
              <th>Requested Pickup</th>
              <th>Pickup Time</th>
              <th>Planned Drop</th>
              <th>Actual Drop</th>
              <th style={{ textAlign: 'center', minWidth: '150px' }}>Admin Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={12} style={{ textAlign: 'center', padding: '36px', color: 'var(--text-muted)' }}>
                  No bookings found matching "{searchQuery}" under status "{statusFilter}".
                </td>
              </tr>
            ) : (
              paginated.map((booking) => {
                const isSelected = selectedIds.includes(booking.id);
                const isOngoing = booking.status === 'On Going';
                const isCompleted = booking.status === 'Completed';

                return (
                  <tr key={booking.id} style={{ background: isSelected ? 'var(--bg-hover)' : undefined }}>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectRow(booking.id)}
                      />
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--brand-blue)' }}>
                        #{booking.id}
                      </span>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span>{booking.employeeName}</span>
                        {booking.role && (
                          <span
                            style={{
                              fontSize: '0.65rem',
                              padding: '1px 5px',
                              borderRadius: '4px',
                              background: booking.role === 'Staff' ? 'rgba(59, 130, 246, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                              color: booking.role === 'Staff' ? '#3b82f6' : '#10b981',
                              fontWeight: 700,
                            }}
                          >
                            {booking.role}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {booking.employeeId}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        {/* Inline status dropdown so admins can modify with 1 click */}
                        <select
                          className={getStatusBadgeClass(booking.status)}
                          value={booking.status}
                          disabled={isCompleted}
                          onChange={(e) => {
                            if (onUpdateBookingStatus) {
                              onUpdateBookingStatus(booking.id, e.target.value, `Status updated to ${e.target.value} by Admin`);
                            }
                          }}
                          style={{
                            cursor: 'pointer',
                            outline: 'none',
                            border: 'none',
                            padding: '3px 8px',
                            fontWeight: 700,
                          }}
                          title="Click to quickly modify booking status"
                        >
                          {ALL_STATUSES.map((st) => (
                            <option key={st} value={st} style={{ background: 'var(--bg-card)', color: 'var(--text-primary)' }}>
                              {st}
                            </option>
                          ))}
                        </select>
                        {isOngoing && <span className="live-dot-green" title="Live active transit" />}
                      </div>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{booking.fromLocation}</span>
                    </td>
                    <td>
                      <span style={{ fontWeight: 500 }}>{booking.toLocation}</span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', background: 'var(--bg-hover)', padding: '2px 6px', borderRadius: '4px' }}>
                        {booking.vehicleNumber}
                      </span>
                    </td>
                    <td>{booking.requestedPickupTime}</td>
                    <td>
                      {booking.pickupTime === '-' ? (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <span style={{ fontWeight: 600 }}>{booking.pickupTime}</span>
                      )}
                    </td>
                    <td>{booking.plannedDropTime}</td>
                    <td>
                      {booking.actualDropTime === '-' ? (
                        <span style={{ color: 'var(--text-muted)' }}>—</span>
                      ) : (
                        <span style={{ fontWeight: 600, color: 'var(--brand-primary)' }}>{booking.actualDropTime}</span>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        {/* View Button (Drawer) */}
                        {!isCompleted && <button
                          type="button"
                          className="btn-view"
                          onClick={() => onViewBooking(booking)}
                          title={`Inspect journey & route details #${booking.id}`}
                        >
                          <Eye size={13} />
                          <span>View</span>
                        </button>}

                        {/* Edit Button (Admin Modify Modal) */}
                        {!isCompleted && <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.76rem', color: 'var(--brand-blue)' }}
                          onClick={() => onEditBooking(booking)}
                          title={`Edit route, vehicle, driver & time for #${booking.id}`}
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>}

                        {/* Delete / Cancel Button */}
                        {onDeleteBooking && (
                          <button
                            type="button"
                            className="btn-icon"
                            style={{ width: '28px', height: '28px', color: '#ef4444' }}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to remove booking #${booking.id}?`)) {
                                onDeleteBooking(booking.id);
                              }
                            }}
                            title={`Cancel & Remove booking #${booking.id}`}
                          >
                            <Trash2 size={13} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      <div className="pagination-bar">
        <div>
          Showing {filtered.length === 0 ? 0 : startIndex + 1}-{Math.min(startIndex + pageSize, filtered.length)} of {filtered.length} items
        </div>

        <div className="pagination-controls">
          <button
            type="button"
            className="page-btn"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            style={{ opacity: currentPage === 1 ? 0.4 : 1 }}
          >
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((pg) => {
            if (totalPages > 6 && Math.abs(pg - currentPage) > 2 && pg !== 1 && pg !== totalPages) {
              if (pg === 2 || pg === totalPages - 1) return <span key={pg} style={{ padding: '0 4px', color: 'var(--text-muted)' }}>...</span>;
              return null;
            }

            return (
              <button
                key={pg}
                type="button"
                className={`page-btn ${currentPage === pg ? 'active' : ''}`}
                onClick={() => setCurrentPage(pg)}
              >
                {pg}
              </button>
            );
          })}

          <button
            type="button"
            className="page-btn"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            style={{ opacity: currentPage === totalPages ? 0.4 : 1 }}
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </section>
  );
};
