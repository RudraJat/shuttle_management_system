import React, { useState, useEffect, useRef } from 'react';
import { Navbar } from './components/Navbar.jsx';
import { DriverTimeline } from './components/DriverTimeline.jsx';
import { BookingManagementTable } from './components/BookingManagementTable.jsx';
import { BookingDetailsDrawer } from './components/BookingDetailsDrawer.jsx';
import { BookingEditModal } from './components/BookingEditModal.jsx';
import { DriverDutyModal } from './components/DriverDutyModal.jsx';
import { NewBookingModal } from './components/NewBookingModal.jsx';
import { RouteManagerView } from './components/RouteManagerModal.jsx';
import { CommuterPortalView } from './components/CommuterPortalView.jsx';
import { AnalyticsView } from './components/AnalyticsView.jsx';
import { ToastNotification } from './components/ToastNotification.jsx';
import { api } from './services/api.js';
import {
  getStoredData,
  setStoredData,
  INITIAL_DRIVERS,
  INITIAL_ROUTES,
  INITIAL_LIVE_SHUTTLES,
} from './utils/realTimeEngine.js';

export const App = () => {
  const [activeTab, setActiveTab] = useState('management');
  const [theme, setTheme] = useState('light');
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [currentRole, setCurrentRole] = useState('admin');

  // Core Data with LocalStorage Persistence & Real-time Fallback
  const [bookings, setBookings] = useState(() => {
    const bookingDataVersion = 'bookings-v3-preserve-real-rides';
    const storedBookings = getStoredData('bookings', []);
    if (localStorage.getItem('bookingDataVersion') !== bookingDataVersion) {
      const demoBookingIds = new Set([
        '123123', '324235', '545232', '434532', '545233', '434533', '545234',
        '434535', '545236', '434537', '601001', '601002', '601003', '601004',
        '601005', '601006', '601007', '601008', '601009', '601010', '601011',
      ]);
      const realBookings = storedBookings.filter((booking) => !demoBookingIds.has(String(booking.id)));
      localStorage.setItem('bookings', JSON.stringify(realBookings));
      localStorage.setItem('bookingDataVersion', bookingDataVersion);
      return realBookings;
    }
    return storedBookings;
  });
  const bookingsRef = useRef(bookings);
  const [drivers, setDrivers] = useState(() => {
    const driverDataVersion = 'drivers-v5-clean-duty-breaks';
    const storedDrivers = getStoredData('drivers', INITIAL_DRIVERS);
    if (localStorage.getItem('driverDataVersion') !== driverDataVersion) {
      const cleanedDrivers = storedDrivers.map((driver) => ({
        ...driver,
        vehicleNumber: driver.id === 'drv-1' ? 'NB-003-RF' : driver.vehicleNumber,
        blocks: (driver.blocks || []).filter(
          (block) => block.type === 'DUTY_START' || block.type === 'DUTY_END'
        ),
      }));
      setStoredData('drivers', cleanedDrivers);
      localStorage.setItem('driverDataVersion', driverDataVersion);
      return cleanedDrivers;
    }
    return storedDrivers;
  });
  const [routes, setRoutes] = useState(() => getStoredData('routes', INITIAL_ROUTES));
  const [shuttles, setShuttles] = useState(() => getStoredData('shuttles', INITIAL_LIVE_SHUTTLES));
  const [analytics, setAnalytics] = useState(null);

  // Modals & Drawers
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [dutyDriver, setDutyDriver] = useState(null);
  const [dutyMode, setDutyMode] = useState('BREAK');
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);

  // Toasts
  const [toasts, setToasts] = useState([]);

  const addToast = (type, message) => {
    const id = String(Date.now() + Math.random());
    setToasts((prev) => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Sync Theme
  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  // Sync state to LocalStorage
  useEffect(() => {
    bookingsRef.current = bookings;
    setStoredData('bookings', bookings);
  }, [bookings]);

  useEffect(() => {
    setStoredData('drivers', drivers);
  }, [drivers]);

  useEffect(() => {
    setStoredData('routes', routes);
  }, [routes]);

  useEffect(() => {
    setStoredData('shuttles', shuttles);
  }, [shuttles]);

  // Initial Load & Background Health Check against Java REST server
  const loadBackendData = async () => {
    try {
      const isUp = await api.checkHealth();
      setIsBackendConnected(isUp);

      if (isUp) {
        const [bList, dList, rList, aData] = await Promise.all([
          api.getBookings(),
          api.getDrivers(),
          api.getRoutes(),
          api.getAnalytics(),
        ]);
        // Only hydrate an empty browser store; never replace visible rides during backend polling.
        if (Array.isArray(bList) && bList.length > 0 && bookingsRef.current.length === 0) {
          setBookings(bList);
        }
        if (dList && dList.length > 0) setDrivers(dList);
        if (rList && rList.length > 0) setRoutes(rList);
        if (aData) setAnalytics(aData);
      }
    } catch {
      setIsBackendConnected(false);
    }
  };

  useEffect(() => {
    loadBackendData();
    const interval = setInterval(loadBackendData, 6000);
    return () => clearInterval(interval);
  }, []);

  // Update Booking Status
  const handleUpdateBookingStatus = async (id, status, notes) => {
    try {
      const existingBooking = bookings.find((booking) => booking.id === id);
      if (existingBooking?.status === 'Completed') {
        addToast('info', `Completed booking #${id} cannot be changed`);
        return;
      }
      if (isBackendConnected) {
        try {
          const updated = await api.updateBookingStatus(id, status, notes);
          setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
          if (selectedBooking && selectedBooking.id === id) setSelectedBooking(updated);
        } catch (err) {
          if (err.status !== 404) throw err;
          setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status, notes: notes || b.notes } : b)));
          if (selectedBooking && selectedBooking.id === id) {
            setSelectedBooking({ ...selectedBooking, status, notes: notes || selectedBooking.notes });
          }
        }
      } else {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, status, notes: notes || b.notes } : b))
        );
        if (selectedBooking && selectedBooking.id === id) {
          setSelectedBooking({ ...selectedBooking, status, notes: notes || selectedBooking.notes });
        }
      }
      addToast('success', `Booking #${id} updated to ${status}`);
    } catch (err) {
      addToast('error', `Failed to update status: ${err.message}`);
    }
  };

  // Save Booking Edit (Admin Full Edit)
  const handleSaveBookingEdit = async (updatedData) => {
    if (!editingBooking) return;
    const id = editingBooking.id;
    if (editingBooking.status === 'Completed') {
      addToast('info', `Completed booking #${editingBooking.id} cannot be edited`);
      setEditingBooking(null);
      return;
    }

    const timeToMinutes = (value) => {
      const match = String(value || '').match(/^(\d{1,2}):(\d{2})/);
      return match ? Number(match[1]) * 60 + Number(match[2]) : null;
    };
    const newStart = timeToMinutes(updatedData.requestedPickupTime);
    const newEnd = timeToMinutes(updatedData.plannedDropTime);
    const activeStatuses = ['Accepted', 'Waiting', 'Requested', 'On Going'];
    const hasConflict = updatedData.driverName && updatedData.driverName !== 'Unassigned' && newStart !== null && newEnd !== null && bookings.some((booking) => {
      if (booking.id === id || booking.driverName !== updatedData.driverName || booking.date !== editingBooking.date) return false;
      if (!activeStatuses.includes(booking.status)) return false;
      const existingStart = timeToMinutes(booking.requestedPickupTime);
      const existingEnd = timeToMinutes(booking.plannedDropTime);
      return existingStart !== null && existingEnd !== null && newStart < existingEnd && newEnd > existingStart;
    });
    if (hasConflict) {
      addToast('error', `${updatedData.driverName} already has an overlapping ride at that time`);
      return;
    }
    try {
      if (isBackendConnected) {
        try {
          const updated = await api.updateBooking(id, updatedData);
          setBookings((prev) => prev.map((b) => (b.id === id ? updated : b)));
          if (selectedBooking && selectedBooking.id === id) setSelectedBooking(updated);
        } catch (err) {
          if (err.status !== 404) throw err;
          setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, ...updatedData } : b)));
          if (selectedBooking && selectedBooking.id === id) {
            setSelectedBooking({ ...selectedBooking, ...updatedData });
          }
        }
      } else {
        setBookings((prev) =>
          prev.map((b) => (b.id === id ? { ...b, ...updatedData } : b))
        );
        if (selectedBooking && selectedBooking.id === id) {
          setSelectedBooking({ ...selectedBooking, ...updatedData });
        }
      }
      setEditingBooking(null);
      addToast('success', `Booking #${id} successfully modified by admin`);
    } catch (err) {
      addToast('error', `Failed to edit booking: ${err.message}`);
    }
  };

  // Delete / Cancel Booking
  const handleDeleteBooking = async (id) => {
    try {
      if (isBackendConnected) {
        try {
          await api.deleteBooking(id);
        } catch (err) {
          if (err.status !== 404) throw err;
        }
      }
      setBookings((prev) => prev.filter((b) => b.id !== id));
      if (selectedBooking && selectedBooking.id === id) setSelectedBooking(null);
      addToast('info', `Booking #${id} removed from dispatch schedule`);
    } catch (err) {
      addToast('error', `Failed to delete booking: ${err.message}`);
    }
  };

  // Create Booking (Student/Staff or Admin)
  const handleCreateBooking = async (newBooking) => {
    try {
      if (isBackendConnected) {
        const created = await api.createBooking(newBooking);
        setBookings((prev) => [created, ...prev]);
        addToast('success', `Ride booked! Pass issued with ID: #${created.id}`);
      } else {
        const id = newBooking.id || String(Math.floor(Math.random() * 900000 + 100000));
        const created = { ...newBooking, id };
        setBookings((prev) => [created, ...prev]);
        addToast('success', `Ride #${id} scheduled successfully!`);
      }
    } catch (err) {
      addToast('error', `Failed to create booking: ${err.message}`);
    }
  };

  // Driver Duty Actions with boundary & collision enforcement
  const handleDutyAction = async (driverId, action, scheduledHour, endHourParam) => {
    try {
      const targetDriver = drivers.find((d) => d.id === driverId);
      if (!targetDriver) return;

      const currentStart = Number(targetDriver.startDutyHour ?? targetDriver.dutyStartHour ?? 8.0);
      const currentEnd = Number(targetDriver.endDutyHour ?? targetDriver.dutyEndHour ?? 18.0);

      let newStart = currentStart;
      let newEnd = currentEnd;

      if (action === 'START_DUTY') {
        newStart = Number(scheduledHour);
      } else if (action === 'END_DUTY') {
        newEnd = Number(endHourParam !== undefined ? endHourParam : scheduledHour);
      } else if (action === 'SET_SHIFT') {
        newStart = Number(scheduledHour);
        newEnd = Number(endHourParam);
      }

      if (newEnd <= newStart) {
        addToast('error', `Duty end (${newEnd}:00) cannot be before or equal to duty start (${newStart}:00)!`);
        return;
      }

      if (isBackendConnected) {
        const updated = await api.updateDriverDuty(driverId, action, action === 'START_DUTY' ? newStart : newEnd);
        setDrivers((prev) => prev.map((d) => (d.id === driverId ? { ...d, ...updated, startDutyHour: newStart, endDutyHour: newEnd } : d)));
      } else {
        setDrivers((prev) =>
          prev.map((d) =>
            d.id === driverId
              ? {
                  ...d,
                  status: action === 'START_DUTY' ? 'Online' : action === 'END_DUTY' ? 'Offline' : d.status,
                  startDutyHour: newStart,
                  dutyStartHour: newStart,
                  endDutyHour: newEnd,
                  dutyEndHour: newEnd,
                  blocks: [
                    ...(d.blocks || []).filter((block) => block.type !== 'DUTY_START' && block.type !== 'DUTY_END'),
                    {
                      id: `duty-start-${d.id}-${Date.now()}`,
                      type: 'DUTY_START',
                      startHour: newStart,
                      endHour: Math.min(newStart + 0.5, newEnd),
                      label: 'Duty Start',
                      details: 'LIVE',
                      vehicleNumber: d.vehicleNumber,
                    },
                    {
                      id: `duty-end-${d.id}-${Date.now()}`,
                      type: 'DUTY_END',
                      startHour: Math.max(newEnd - 0.5, newStart),
                      endHour: newEnd,
                      label: 'Duty End',
                      details: 'LIVE',
                      vehicleNumber: d.vehicleNumber,
                    },
                  ],
                }
              : d
          )
        );
      }
      addToast(
        'success',
        `${targetDriver.name} shift updated to ${newStart}:00 - ${newEnd}:00 (${action === 'START_DUTY' ? 'Clocked In' : action === 'END_DUTY' ? 'Clocked Out' : 'Shift Set'})`
      );
    } catch (err) {
      addToast('error', `Duty change failed: ${err.message}`);
    }
  };

  const handleDriverStatusToggle = async (driverId, status) => {
    try {
      const targetDriver = drivers.find((driver) => driver.id === driverId);
      if (isBackendConnected) {
        const updated = await api.updateDriver(driverId, { status });
        setDrivers((prev) => prev.map((driver) => (driver.id === driverId ? updated : driver)));
      } else {
        setDrivers((prev) => prev.map((driver) => (driver.id === driverId ? { ...driver, status } : driver)));
      }
      addToast('success', `${targetDriver?.name || 'Driver'} is now ${status}`);
    } catch (err) {
      addToast('error', `Could not update driver status: ${err.message}`);
    }
  };

  // Add Driver Break
  const handleAddBreak = async (driverId, startHour, endHour, label) => {
    try {
      if (isBackendConnected) {
        const updated = await api.addDriverBreak(driverId, startHour, endHour, label);
        setDrivers((prev) => prev.map((d) => (d.id === driverId ? updated : d)));
      } else {
        setDrivers((prev) =>
          prev.map((d) =>
            d.id === driverId
              ? {
                  ...d,
                  blocks: [
                    ...(d.blocks || []).filter(
                      (block) => !(block.type === 'BREAK' && block.startHour === startHour && block.endHour === endHour)
                    ),
                    {
                      id: `blk-${Date.now()}`,
                      type: 'BREAK',
                      startHour,
                      endHour,
                      label: label || 'Break',
                      details: 'Added Break',
                      pickups: 0,
                      drops: 0,
                      vehicleNumber: d.vehicleNumber,
                    },
                  ],
                }
              : d
          )
        );
      }
      addToast('success', `Break scheduled for ${startHour}:00 - ${endHour}:00`);
    } catch (err) {
      addToast('error', `Failed to add break: ${err.message}`);
    }
  };

  // Create Route
  const handleCreateRoute = async (routeData) => {
    try {
      if (isBackendConnected) {
        const created = await api.createRoute(routeData);
        setRoutes((prev) => [...prev, created]);
        addToast('success', `Route ${created.name} (${created.code}) created!`);
      } else {
        const id = `rt-${Date.now()}`;
        const created = { ...routeData, id, color: '#06b6d4' };
        setRoutes((prev) => [...prev, created]);
        addToast('success', `New route created (Local mode)`);
      }
    } catch (err) {
      addToast('error', `Failed to create route: ${err.message}`);
    }
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isBackendConnected={isBackendConnected}
        theme={theme}
        toggleTheme={toggleTheme}
        onOpenNewBooking={() => setIsNewBookingOpen(true)}
        currentRole={currentRole}
        onChangeRole={(role) => setCurrentRole(role)}
      />

      {/* Main Container */}
      <main className="main-content">
        {activeTab === 'management' && (
          <>
            {/* Driver Availability Timeline (Screenshot page 12) */}
            <DriverTimeline
              drivers={drivers}
              bookings={bookings}
              selectedDate={selectedDate}
              onDutyAction={handleDutyAction}
              onOpenDutyModal={(driver, mode) => {
                setDutyDriver(driver);
                setDutyMode(mode);
              }}
              onStatusToggle={handleDriverStatusToggle}
              onOpenBreakModal={(driver) => setDutyDriver(driver)}
              onSelectBlock={(driver, block) => {
                addToast('info', `${driver.name}: ${block.label} (${block.startHour}:00 - ${block.endHour}:00)`);
              }}
            />

            {/* Booking Management Table (Screenshot page 12) with Edit & Inline Status */}
            <BookingManagementTable
              bookings={bookings}
              selectedDate={selectedDate}
              onDateChange={setSelectedDate}
              onViewBooking={(booking) => setSelectedBooking(booking)}
              onEditBooking={(booking) => setEditingBooking(booking)}
              onUpdateBookingStatus={handleUpdateBookingStatus}
              onDeleteBooking={handleDeleteBooking}
            />
          </>
        )}

        {activeTab === 'performance' && (
          <AnalyticsView
            bookings={bookings}
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        )}

        {activeTab === 'routes' && (
          <RouteManagerView
            routes={routes}
            drivers={drivers}
            onCreateRoute={handleCreateRoute}
          />
        )}

        {activeTab === 'commuter' && (
          <CommuterPortalView
            bookings={bookings}
            routes={routes}
            shuttles={shuttles}
            bookingDate={selectedDate}
            onBookRide={handleCreateBooking}
            onCancelBooking={(id) => handleUpdateBookingStatus(id, 'Cancelled', 'Cancelled by commuter')}
          />
        )}
      </main>

      {/* Slide-over Inspection Drawer (Screenshot page 13) */}
      <BookingDetailsDrawer
        booking={selectedBooking}
        onClose={() => setSelectedBooking(null)}
        onUpdateStatus={handleUpdateBookingStatus}
        onEdit={(booking) => {
          setSelectedBooking(null);
          setEditingBooking(booking);
        }}
      />

      {/* Admin Booking Edit Modal */}
      <BookingEditModal
        booking={editingBooking}
        drivers={drivers}
        onClose={() => setEditingBooking(null)}
        onSave={handleSaveBookingEdit}
      />

      {/* Driver Duty Modal */}
      <DriverDutyModal
        driver={dutyDriver}
        mode={dutyMode}
        bookings={bookings}
        onClose={() => setDutyDriver(null)}
        onAddBreak={handleAddBreak}
        onDutyAction={handleDutyAction}
      />

      {/* New Booking Modal */}
      <NewBookingModal
        isOpen={isNewBookingOpen}
        bookingDate={selectedDate}
        drivers={drivers}
        bookings={bookings}
        onClose={() => setIsNewBookingOpen(false)}
        onCreate={handleCreateBooking}
      />

      {/* Feedback Toast System */}
      <ToastNotification toasts={toasts} onDismiss={removeToast} />
    </div>
  );
};
