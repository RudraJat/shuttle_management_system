package com.shuttle.repository;

import com.shuttle.model.*;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

public class DataStore {
    private static final DataStore INSTANCE = new DataStore();

    private final Map<String, Booking> bookings = new ConcurrentHashMap<>();
    private final Map<String, Driver> drivers = new ConcurrentHashMap<>();
    private final Map<String, CampusRoute> routes = new ConcurrentHashMap<>();

    private DataStore() {
        seedInitialData();
    }

    public static DataStore getInstance() {
        return INSTANCE;
    }

    public List<Booking> getAllBookings() {
        List<Booking> list = new ArrayList<>(bookings.values());
        // Sort descending by id or requested time
        Collections.sort(list, new Comparator<Booking>() {
            @Override
            public int compare(Booking o1, Booking o2) {
                return o2.getId().compareTo(o1.getId());
            }
        });
        return list;
    }

    public Booking getBooking(String id) {
        return bookings.get(id);
    }

    public void saveBooking(Booking booking) {
        bookings.put(booking.getId(), booking);
    }

    public boolean deleteBooking(String id) {
        return bookings.remove(id) != null;
    }

    public List<Driver> getAllDrivers() {
        return new ArrayList<>(drivers.values());
    }

    public Driver getDriver(String id) {
        return drivers.get(id);
    }

    public void saveDriver(Driver driver) {
        drivers.put(driver.getId(), driver);
    }

    public List<CampusRoute> getAllRoutes() {
        return new ArrayList<>(routes.values());
    }

    public CampusRoute getRoute(String id) {
        return routes.get(id);
    }

    public void saveRoute(CampusRoute route) {
        routes.put(route.getId(), route);
    }

    private void seedInitialData() {
        // --- 1. Drivers & Timeline Schedules matching Screenshot page 12 ---
        Driver d1 = new Driver("drv-1", "Samuel Jones", "+1-415-555-0101", "Online", 4.8, "NB-003-RF", "UA3282 White Bus | 12 Seater", 6.0, 20.0);
        d1.addBlock(new DutyBlock("blk-1-1", "DUTY_START", 6.0, 6.5, "Duty Start", 0, 0, "NB-003-RF", "LIVE"));
        d1.addBlock(new DutyBlock("blk-1-2", "DUTY_END", 19.5, 20.0, "Duty End", 0, 0, "NB-003-RF", "LIVE"));
        drivers.put(d1.getId(), d1);

        Driver d2 = new Driver("drv-2", "Bob Jones", "+1-415-555-0102", "Offline", 4.6, "DL-04-AB-1290", "Shuttle Van B4 | 8 Seater", 7.0, 19.0);
        d2.addBlock(new DutyBlock("blk-2-1", "DUTY_START", 7.0, 7.5, "Duty Start", 0, 0, "DL-04-AB-1290", "LIVE"));
        d2.addBlock(new DutyBlock("blk-2-2", "DUTY_END", 18.5, 19.0, "Duty End", 0, 0, "DL-04-AB-1290", "LIVE"));
        drivers.put(d2.getId(), d2);

        Driver d3 = new Driver("drv-3", "Jonathan Spikes", "+1-415-555-0103", "Offline", 4.7, "KA-05-MN-9921", "Campus Cruiser 7 | 15 Seater", 8.0, 21.0);
        d3.addBlock(new DutyBlock("blk-3-1", "DUTY_START", 8.0, 8.5, "Duty Start", 0, 0, "KA-05-MN-9921", "LIVE"));
        d3.addBlock(new DutyBlock("blk-3-2", "DUTY_END", 20.5, 21.0, "Duty End", 0, 0, "KA-05-MN-9921", "LIVE"));
        drivers.put(d3.getId(), d3);

        Driver d4 = new Driver("drv-4", "Steve Smith", "+1-322-493-3292", "Online", 4.5, "NB-002-RF", "UA3282 White Bus | 12 Seater", 7.0, 19.0);
        d4.addBlock(new DutyBlock("blk-4-1", "DUTY_START", 7.0, 7.5, "Duty Start", 0, 0, "NB-002-RF", "LIVE"));
        d4.addBlock(new DutyBlock("blk-4-2", "DUTY_END", 18.5, 19.0, "Duty End", 0, 0, "NB-002-RF", "LIVE"));
        drivers.put(d4.getId(), d4);

        Driver d5 = new Driver("drv-5", "Anita Sharma", "+1-415-555-0105", "Online", 4.9, "MH-12-PQ-4412", "Green Electric MiniBus | 16 Seater", 6.0, 16.0);
        d5.addBlock(new DutyBlock("blk-5-1", "DUTY_START", 6.0, 6.5, "Duty Start", 0, 0, "MH-12-PQ-4412", "LIVE"));
        d5.addBlock(new DutyBlock("blk-5-2", "DUTY_END", 15.5, 16.0, "Duty End", 0, 0, "MH-12-PQ-4412", "LIVE"));
        drivers.put(d5.getId(), d5);

        Driver d6 = new Driver("drv-6", "Priya Patel", "+1-415-555-0106", "Online", 4.8, "UP-32-BZ-8821", "City Runner 3 | 10 Seater", 9.0, 22.0);
        d6.addBlock(new DutyBlock("blk-6-1", "DUTY_START", 9.0, 9.5, "Duty Start", 0, 0, "UP-32-BZ-8821", "LIVE"));
        d6.addBlock(new DutyBlock("blk-6-2", "DUTY_END", 21.5, 22.0, "Duty End", 0, 0, "UP-32-BZ-8821", "LIVE"));
        drivers.put(d6.getId(), d6);

        // --- 2. Seed Bookings from Screenshots pages 12 and 13 ---
        saveBooking(new Booking("123123", "Thompson", "EMP-123123", "Accepted",
                "Library", "Data Centre", "NB-002-RF", "UA3282 White Bus | 12 Seater",
                "11:21", "11:25", "11:32", "11:32", "Dec 16, 2024",
                "Steve Smith", "+1-322-493-3292", 4.5,
                "Please report at Front Desk", 5));

        saveBooking(new Booking("324235", "Daniel Radcliff", "EMP-324235", "Waiting",
                "Library", "Parking", "NB-002-RF", "UA3282 White Bus | 12 Seater",
                "11:34", "-", "11:43", "11:43", "Dec 16, 2024",
                "Steve Smith", "+1-322-493-3292", 4.5,
                "Requires front seat access", 0));

        saveBooking(new Booking("545232", "W.J. Smith", "EMP-545232", "No Show",
                "Data Centre", "Parking", "NB-002-RF", "UA3282 White Bus | 12 Seater",
                "11:50", "-", "12:10", "-", "Dec 16, 2024",
                "Samuel Jones", "+1-415-555-0101", 4.8,
                "Passenger did not arrive at pickup pillar #3", 0));

        saveBooking(new Booking("434532", "Tina Shah", "EMP-434532", "Declined",
                "Library", "Data Centre", "-", "Shuttle Capacity Full",
                "11:55", "-", "12:15", "-", "Dec 16, 2024",
                "Unassigned", "-", 0.0,
                "Declined due to peak passenger capacity exceeded", 0));

        saveBooking(new Booking("545233", "W.J. Smith", "EMP-545232", "Completed",
                "Data Centre", "Parking", "NB-002-RF", "UA3282 White Bus | 12 Seater",
                "11:58", "12:25", "12:35", "12:40", "Dec 16, 2024",
                "Steve Smith", "+1-322-493-3292", 4.5,
                "Regular commute", 5));

        saveBooking(new Booking("434533", "Tina Shah", "EMP-434532", "Requested",
                "Library", "Data Centre", "-", "Awaiting Vehicle Assignment",
                "11:55", "-", "12:15", "-", "Dec 16, 2024",
                "Unassigned", "-", 0.0,
                "Priority booking for faculty seminar", 0));

        saveBooking(new Booking("545234", "W.J. Smith", "EMP-545232", "On Going",
                "Data Centre", "Parking", "NB-002-RF", "UA3282 White Bus | 12 Seater",
                "11:58", "12:25", "12:35", "-", "Dec 16, 2024",
                "Steve Smith", "+1-322-493-3292", 4.5,
                "Live in transit", 0));

        saveBooking(new Booking("434535", "Tina Shah", "EMP-434532", "Cancelled",
                "Library", "Data Centre", "-", "-",
                "11:55", "-", "12:15", "-", "Dec 16, 2024",
                "Unassigned", "-", 0.0,
                "Meeting rescheduled by faculty", 0));

        saveBooking(new Booking("545236", "W.J. Smith", "EMP-545232", "Dropped",
                "Data Centre", "Parking", "NB-002-RF", "UA3282 White Bus | 12 Seater",
                "11:58", "12:25", "12:35", "12:40", "Dec 16, 2024",
                "Steve Smith", "+1-322-493-3292", 4.5,
                "Dropped at Parking Bay 4", 5));

        saveBooking(new Booking("434537", "Tina Shah", "EMP-434532", "Declined",
                "Library", "Data Centre", "-", "-",
                "11:55", "-", "12:15", "-", "Dec 16, 2024",
                "Unassigned", "-", 0.0,
                "Driver off duty", 0));

        // Additional campus entries as seen in screenshot page 5
        saveBooking(new Booking("601001", "Dhulabhai Bamania", "EMP-601001", "Completed",
                "Contract Staff Gate", "Substation 2", "NB-002-RF", "UA3282 White Bus | 12 Seater",
                "04:21", "04:25", "12:21", "12:21", "Dec 16, 2024",
                "Samuel Jones", "+1-415-555-0101", 4.8,
                "Overstay badge cleared", 0));

        saveBooking(new Booking("601002", "Ajay Singh", "EMP-601002", "Completed",
                "Contract Staff Gate", "Parking Lot A", "DL-04-AB-1290", "Shuttle Van B4 | 8 Seater",
                "08:04", "08:10", "04:04", "04:04", "Dec 16, 2024",
                "Bob Jones", "+1-415-555-0102", 4.6,
                "Self Check-out verified", 0));

        saveBooking(new Booking("601003", "Arun Kumar", "EMP-601003", "Completed",
                "Hostel Block C", "Library", "KA-05-MN-9921", "Campus Cruiser 7 | 15 Seater",
                "11:46", "11:50", "07:46", "07:46", "Dec 16, 2024",
                "Jonathan Spikes", "+1-415-555-0103", 4.7,
                "Shift handover completed", 0));

        saveBooking(new Booking("601004", "Navin Patidar", "EMP-601004", "Accepted",
                "Vendor Gate 4", "Main Canteen", "NB-002-RF", "UA3282 White Bus | 12 Seater",
                "06:43", "06:45", "03:43", "03:45", "Dec 16, 2024",
                "Steve Smith", "+1-322-493-3292", 4.5,
                "Vendor supply check-in", 2));

        saveBooking(new Booking("601005", "Sukhdev Ahari", "EMP-601005", "Waiting",
                "Library", "Hostel Block A", "MH-12-PQ-4412", "Green Electric MiniBus | 16 Seater",
                "07:10", "-", "04:10", "-", "Dec 16, 2024",
                "Anita Sharma", "+1-415-555-0105", 4.9,
                "Waiting at pickup shelter #2", 0));

        saveBooking(new Booking("601006", "Vinod Dindor", "EMP-601006", "On Going",
                "Engineering Block", "Data Centre", "UP-32-BZ-8821", "City Runner 3 | 10 Seater",
                "07:14", "07:18", "04:14", "-", "Dec 16, 2024",
                "Priya Patel", "+1-415-555-0106", 4.8,
                "Lab equipment courier onboard", 0));

        saveBooking(new Booking("601007", "Geetanjhil", "EMP-601007", "Waiting",
                "Main Gate", "Sports Complex", "NB-002-RF", "UA3282 White Bus | 12 Seater",
                "07:38", "-", "04:38", "-", "Dec 16, 2024",
                "Steve Smith", "+1-322-493-3292", 4.5,
                "Student athletics squad", 0));

        saveBooking(new Booking("601008", "Jayesh Singh", "EMP-601008", "Accepted",
                "Library", "Administration", "KA-05-MN-9921", "Campus Cruiser 7 | 15 Seater",
                "07:40", "07:44", "03:40", "03:42", "Dec 16, 2024",
                "Jonathan Spikes", "+1-415-555-0103", 4.7,
                "Faculty transit", 0));

        saveBooking(new Booking("601009", "Vazral Maru", "EMP-601009", "Completed",
                "Food Court", "Girls Hostel", "MH-12-PQ-4412", "Green Electric MiniBus | 16 Seater",
                "07:57", "08:00", "04:57", "04:58", "Dec 16, 2024",
                "Anita Sharma", "+1-415-555-0105", 4.9,
                "Evening campus drop", 0));

        saveBooking(new Booking("601010", "Nilesh Pandey", "EMP-601010", "No Show",
                "Data Centre", "Parking Lot B", "DL-04-AB-1290", "Shuttle Van B4 | 8 Seater",
                "08:57", "-", "05:57", "-", "Dec 16, 2024",
                "Bob Jones", "+1-415-555-0102", 4.6,
                "Passenger absent upon arrival", 0));

        saveBooking(new Booking("601011", "Sanjay Gandhi", "EMP-601011", "Accepted",
                "Main Gate", "Data Centre", "NB-002-RF", "UA3282 White Bus | 12 Seater",
                "09:02", "09:05", "06:02", "06:05", "Dec 16, 2024",
                "Samuel Jones", "+1-415-555-0101", 4.8,
                "Official guest transit", 0));

        // Booking Management starts empty and receives only commuter-created bookings.
        bookings.clear();

        // --- 3. Seed Campus Routes ---
        routes.put("rt-1", new CampusRoute("rt-1", "Central Campus Express", "CCE-01",
                Arrays.asList("Main Gate", "Central Library", "Engineering Block", "Data Centre", "Student Center"),
                18, 4.2, "NB-002-RF", "drv-1", "Every 10 mins", true));

        routes.put("rt-2", new CampusRoute("rt-2", "Hostel Ring Shuttle", "HRS-02",
                Arrays.asList("Girls Hostel", "Boys Hostel Block C", "Dining Hall", "Sports Arena", "Main Gate"),
                15, 3.5, "MH-12-PQ-4412", "drv-5", "Every 15 mins", true));

        routes.put("rt-3", new CampusRoute("rt-3", "Research & Tech Park Loop", "RTP-03",
                Arrays.asList("Parking Lot B", "Data Centre", "BioTech Labs", "Innovation Center", "Central Library"),
                22, 5.1, "KA-05-MN-9921", "drv-3", "Every 20 mins", true));

        routes.put("rt-4", new CampusRoute("rt-4", "Night Owl Campus Line", "NOC-04",
                Arrays.asList("Central Library", "Computer Center", "Cafeteria 24/7", "All Hostels", "Main Gate"),
                25, 6.0, "UP-32-BZ-8821", "drv-6", "Every 30 mins", true));
    }
}
