package com.shuttle.server;

import com.shuttle.model.Booking;
import com.shuttle.repository.DataStore;
import com.shuttle.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.*;

public class BookingHandler implements HttpHandler {

    private final DataStore dataStore = DataStore.getInstance();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (CorsHelper.handlePreflight(exchange)) {
            return;
        }

        String method = exchange.getRequestMethod().toUpperCase();
        String path = exchange.getRequestURI().getPath(); // e.g. /api/bookings or /api/bookings/123123
        String[] parts = path.split("/");

        try {
            if (parts.length <= 3) {
                // /api/bookings
                if ("GET".equals(method)) {
                    handleGetList(exchange);
                } else if ("POST".equals(method)) {
                    handleCreate(exchange);
                } else {
                    CorsHelper.sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                }
            } else {
                // /api/bookings/{id} or /api/bookings/{id}/status
                String bookingId = parts[3];
                if (parts.length == 4) {
                    if ("GET".equals(method)) {
                        handleGetById(exchange, bookingId);
                    } else if ("PUT".equals(method)) {
                        handleUpdate(exchange, bookingId);
                    } else if ("DELETE".equals(method)) {
                        handleDelete(exchange, bookingId);
                    } else {
                        CorsHelper.sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                    }
                } else if (parts.length == 5 && "status".equalsIgnoreCase(parts[4])) {
                    if ("PATCH".equals(method) || "PUT".equals(method) || "POST".equals(method)) {
                        handleUpdateStatus(exchange, bookingId);
                    } else {
                        CorsHelper.sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                    }
                } else {
                    CorsHelper.sendJsonResponse(exchange, 404, "{\"error\":\"Endpoint not found\"}");
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            CorsHelper.sendJsonResponse(exchange, 500, "{\"error\":\"Internal error: " + JsonUtil.escape(e.getMessage()) + "\"}");
        }
    }

    private void handleGetList(HttpExchange exchange) throws IOException {
        String query = exchange.getRequestURI().getQuery();
        Map<String, String> queryParams = parseQueryParams(query);

        String search = queryParams.get("search");
        String status = queryParams.get("status");
        String date = queryParams.get("date");

        List<Booking> all = dataStore.getAllBookings();
        List<Booking> filtered = new ArrayList<>();

        for (Booking b : all) {
            boolean match = true;
            if (search != null && !search.trim().isEmpty()) {
                String s = search.toLowerCase();
                boolean m1 = b.getId() != null && b.getId().toLowerCase().contains(s);
                boolean m2 = b.getEmployeeName() != null && b.getEmployeeName().toLowerCase().contains(s);
                boolean m3 = b.getEmployeeId() != null && b.getEmployeeId().toLowerCase().contains(s);
                boolean m4 = b.getFromLocation() != null && b.getFromLocation().toLowerCase().contains(s);
                boolean m5 = b.getToLocation() != null && b.getToLocation().toLowerCase().contains(s);
                if (!m1 && !m2 && !m3 && !m4 && !m5) {
                    match = false;
                }
            }
            if (match && status != null && !status.trim().isEmpty() && !"All".equalsIgnoreCase(status)) {
                if (!status.equalsIgnoreCase(b.getStatus())) {
                    match = false;
                }
            }
            if (match && date != null && !date.trim().isEmpty()) {
                // If date matches prefix or exact
                if (b.getDate() != null && !b.getDate().toLowerCase().contains(date.toLowerCase())) {
                    match = false;
                }
            }

            if (match) {
                filtered.add(b);
            }
        }

        CorsHelper.sendJsonResponse(exchange, 200, JsonUtil.toJson(filtered));
    }

    private void handleGetById(HttpExchange exchange, String id) throws IOException {
        Booking b = dataStore.getBooking(id);
        if (b == null) {
            CorsHelper.sendJsonResponse(exchange, 404, "{\"error\":\"Booking not found\"}");
        } else {
            CorsHelper.sendJsonResponse(exchange, 200, JsonUtil.toJson(b));
        }
    }

    @SuppressWarnings("unchecked")
    private void handleCreate(HttpExchange exchange) throws IOException {
        String body = readBody(exchange);
        Object parsed = JsonUtil.parseJson(body);
        if (!(parsed instanceof Map)) {
            CorsHelper.sendJsonResponse(exchange, 400, "{\"error\":\"Invalid JSON body\"}");
            return;
        }

        Map<String, Object> map = (Map<String, Object>) parsed;
        String id = String.valueOf((int) (Math.random() * 900000) + 100000);
        String name = getString(map, "employeeName", "Commuter");
        String empId = getString(map, "employeeId", "EMP-" + id);
        String status = getString(map, "status", "Waiting");
        String fromLoc = getString(map, "fromLocation", "Main Gate");
        String toLoc = getString(map, "toLocation", "Central Library");
        String vehNum = getString(map, "vehicleNumber", "NB-002-RF");
        String vehDet = getString(map, "vehicleDetails", "UA3282 White Bus | 12 Seater");
        String reqPickup = getString(map, "requestedPickupTime", "12:00");
        String pickupTime = getString(map, "pickupTime", "-");
        String plannedDrop = getString(map, "plannedDropTime", "12:15");
        String actualDrop = getString(map, "actualDropTime", "-");
        String date = getString(map, "date", "Dec 16, 2024");
        String driver = getString(map, "driverName", "Steve Smith");
        String phone = getString(map, "driverPhone", "+1-322-493-3292");
        double rating = getDouble(map, "driverRating", 4.5);
        String notes = getString(map, "notes", "Created via Commuter Portal");
        int delay = getInt(map, "delayMinutes", 0);

        Booking b = new Booking(id, name, empId, status, fromLoc, toLoc, vehNum, vehDet,
                reqPickup, pickupTime, plannedDrop, actualDrop, date, driver, phone, rating, notes, delay);
        dataStore.saveBooking(b);

        CorsHelper.sendJsonResponse(exchange, 201, JsonUtil.toJson(b));
    }

    @SuppressWarnings("unchecked")
    private void handleUpdate(HttpExchange exchange, String id) throws IOException {
        Booking existing = dataStore.getBooking(id);
        if (existing == null) {
            CorsHelper.sendJsonResponse(exchange, 404, "{\"error\":\"Booking not found\"}");
            return;
        }

        String body = readBody(exchange);
        Object parsed = JsonUtil.parseJson(body);
        if (!(parsed instanceof Map)) {
            CorsHelper.sendJsonResponse(exchange, 400, "{\"error\":\"Invalid JSON body\"}");
            return;
        }

        Map<String, Object> map = (Map<String, Object>) parsed;
        if (map.containsKey("employeeName")) existing.setEmployeeName(String.valueOf(map.get("employeeName")));
        if (map.containsKey("status")) existing.setStatus(String.valueOf(map.get("status")));
        if (map.containsKey("fromLocation")) existing.setFromLocation(String.valueOf(map.get("fromLocation")));
        if (map.containsKey("toLocation")) existing.setToLocation(String.valueOf(map.get("toLocation")));
        if (map.containsKey("vehicleNumber")) existing.setVehicleNumber(String.valueOf(map.get("vehicleNumber")));
        if (map.containsKey("vehicleDetails")) existing.setVehicleDetails(String.valueOf(map.get("vehicleDetails")));
        if (map.containsKey("pickupTime")) existing.setPickupTime(String.valueOf(map.get("pickupTime")));
        if (map.containsKey("plannedDropTime")) existing.setPlannedDropTime(String.valueOf(map.get("plannedDropTime")));
        if (map.containsKey("actualDropTime")) existing.setActualDropTime(String.valueOf(map.get("actualDropTime")));
        if (map.containsKey("date")) existing.setDate(String.valueOf(map.get("date")));
        if (map.containsKey("driverName")) existing.setDriverName(String.valueOf(map.get("driverName")));
        if (map.containsKey("driverPhone")) existing.setDriverPhone(String.valueOf(map.get("driverPhone")));
        if (map.containsKey("notes")) existing.setNotes(String.valueOf(map.get("notes")));
        if (map.containsKey("delayMinutes")) existing.setDelayMinutes(getInt(map, "delayMinutes", 0));

        dataStore.saveBooking(existing);
        CorsHelper.sendJsonResponse(exchange, 200, JsonUtil.toJson(existing));
    }

    @SuppressWarnings("unchecked")
    private void handleUpdateStatus(HttpExchange exchange, String id) throws IOException {
        Booking existing = dataStore.getBooking(id);
        if (existing == null) {
            CorsHelper.sendJsonResponse(exchange, 404, "{\"error\":\"Booking not found\"}");
            return;
        }

        String body = readBody(exchange);
        Object parsed = JsonUtil.parseJson(body);
        String newStatus = "Accepted";
        String notes = null;

        if (parsed instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) parsed;
            if (map.containsKey("status")) newStatus = String.valueOf(map.get("status"));
            if (map.containsKey("notes")) notes = String.valueOf(map.get("notes"));
        } else if (parsed instanceof String) {
            newStatus = (String) parsed;
        }

        existing.setStatus(newStatus);
        if (notes != null && !notes.trim().isEmpty()) {
            existing.setNotes(notes);
        }

        // Auto update times if relevant
        if ("Accepted".equalsIgnoreCase(newStatus) && "-".equals(existing.getPickupTime())) {
            existing.setPickupTime(existing.getRequestedPickupTime());
        } else if ("Completed".equalsIgnoreCase(newStatus) || "Dropped".equalsIgnoreCase(newStatus)) {
            if ("-".equals(existing.getActualDropTime())) {
                existing.setActualDropTime(existing.getPlannedDropTime());
            }
        }

        dataStore.saveBooking(existing);
        CorsHelper.sendJsonResponse(exchange, 200, JsonUtil.toJson(existing));
    }

    private void handleDelete(HttpExchange exchange, String id) throws IOException {
        boolean removed = dataStore.deleteBooking(id);
        if (removed) {
            CorsHelper.sendJsonResponse(exchange, 200, "{\"success\":true,\"message\":\"Booking deleted\"}");
        } else {
            CorsHelper.sendJsonResponse(exchange, 404, "{\"error\":\"Booking not found\"}");
        }
    }

    private String readBody(HttpExchange exchange) throws IOException {
        BufferedReader reader = new BufferedReader(new InputStreamReader(exchange.getRequestBody(), StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        return sb.toString();
    }

    private Map<String, String> parseQueryParams(String query) {
        Map<String, String> map = new HashMap<>();
        if (query == null || query.isEmpty()) return map;
        String[] pairs = query.split("&");
        for (String pair : pairs) {
            String[] kv = pair.split("=");
            if (kv.length == 2) {
                map.put(kv[0], kv[1]);
            } else if (kv.length == 1) {
                map.put(kv[0], "");
            }
        }
        return map;
    }

    private String getString(Map<String, Object> map, String key, String def) {
        Object val = map.get(key);
        return val != null ? String.valueOf(val) : def;
    }

    private double getDouble(Map<String, Object> map, String key, double def) {
        Object val = map.get(key);
        if (val instanceof Number) return ((Number) val).doubleValue();
        if (val != null) {
            try { return Double.parseDouble(String.valueOf(val)); } catch (Exception ignored) {}
        }
        return def;
    }

    private int getInt(Map<String, Object> map, String key, int def) {
        Object val = map.get(key);
        if (val instanceof Number) return ((Number) val).intValue();
        if (val != null) {
            try { return Integer.parseInt(String.valueOf(val)); } catch (Exception ignored) {}
        }
        return def;
    }
}
