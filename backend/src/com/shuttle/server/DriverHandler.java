package com.shuttle.server;

import com.shuttle.model.Driver;
import com.shuttle.model.DutyBlock;
import com.shuttle.repository.DataStore;
import com.shuttle.util.JsonUtil;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.UUID;

public class DriverHandler implements HttpHandler {

    private final DataStore dataStore = DataStore.getInstance();

    @Override
    public void handle(HttpExchange exchange) throws IOException {
        if (CorsHelper.handlePreflight(exchange)) {
            return;
        }

        String method = exchange.getRequestMethod().toUpperCase();
        String path = exchange.getRequestURI().getPath(); // /api/drivers or /api/drivers/{id}/...
        String[] parts = path.split("/");

        try {
            if (parts.length <= 3) {
                if ("GET".equals(method)) {
                    List<Driver> drivers = dataStore.getAllDrivers();
                    CorsHelper.sendJsonResponse(exchange, 200, JsonUtil.toJson(drivers));
                } else {
                    CorsHelper.sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                }
            } else {
                String driverId = parts[3];
                Driver driver = dataStore.getDriver(driverId);
                if (driver == null) {
                    CorsHelper.sendJsonResponse(exchange, 404, "{\"error\":\"Driver not found\"}");
                    return;
                }

                if (parts.length == 4) {
                    if ("GET".equals(method)) {
                        CorsHelper.sendJsonResponse(exchange, 200, JsonUtil.toJson(driver));
                    } else if ("PUT".equals(method)) {
                        handleUpdateDriver(exchange, driver);
                    } else {
                        CorsHelper.sendJsonResponse(exchange, 405, "{\"error\":\"Method not allowed\"}");
                    }
                } else if (parts.length == 5) {
                    String sub = parts[4];
                    if ("duty".equalsIgnoreCase(sub)) {
                        handleDutyChange(exchange, driver);
                    } else if ("breaks".equalsIgnoreCase(sub) || "blocks".equalsIgnoreCase(sub)) {
                        handleAddBlock(exchange, driver);
                    } else {
                        CorsHelper.sendJsonResponse(exchange, 404, "{\"error\":\"Sub-resource not found\"}");
                    }
                }
            }
        } catch (Exception e) {
            e.printStackTrace();
            CorsHelper.sendJsonResponse(exchange, 500, "{\"error\":\"Internal error: " + JsonUtil.escape(e.getMessage()) + "\"}");
        }
    }

    @SuppressWarnings("unchecked")
    private void handleUpdateDriver(HttpExchange exchange, Driver driver) throws IOException {
        String body = readBody(exchange);
        Object parsed = JsonUtil.parseJson(body);
        if (parsed instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) parsed;
            if (map.containsKey("status")) driver.setStatus(String.valueOf(map.get("status")));
            if (map.containsKey("vehicleNumber")) driver.setVehicleNumber(String.valueOf(map.get("vehicleNumber")));
            if (map.containsKey("vehicleDetails")) driver.setVehicleDetails(String.valueOf(map.get("vehicleDetails")));
            if (map.containsKey("dutyStartHour")) driver.setDutyStartHour(getDouble(map, "dutyStartHour", driver.getDutyStartHour()));
            if (map.containsKey("dutyEndHour")) driver.setDutyEndHour(getDouble(map, "dutyEndHour", driver.getDutyEndHour()));
            dataStore.saveDriver(driver);
            CorsHelper.sendJsonResponse(exchange, 200, JsonUtil.toJson(driver));
        } else {
            CorsHelper.sendJsonResponse(exchange, 400, "{\"error\":\"Invalid JSON\"}");
        }
    }

    @SuppressWarnings("unchecked")
    private void handleDutyChange(HttpExchange exchange, Driver driver) throws IOException {
        String body = readBody(exchange);
        Object parsed = JsonUtil.parseJson(body);
        if (parsed instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) parsed;
            String action = String.valueOf(map.get("action")); // START_DUTY, END_DUTY, SET_HOURS
            double hour = getDouble(map, "hour", 8.0);

            if ("START_DUTY".equalsIgnoreCase(action)) {
                driver.setStatus("Online");
                driver.setDutyStartHour(hour);
                driver.getBlocks().removeIf(block -> "LIVE".equals(block.getDetails()) && "DUTY_START".equals(block.getType()));
                driver.addBlock(new DutyBlock("blk-" + UUID.randomUUID().toString().substring(0, 6),
                    "DUTY_START", hour, hour + 0.5, "Start Duty", 0, 0, driver.getVehicleNumber(), "LIVE"));
            } else if ("END_DUTY".equalsIgnoreCase(action)) {
                driver.setStatus("Offline");
                driver.setDutyEndHour(hour);
                driver.getBlocks().removeIf(block -> "LIVE".equals(block.getDetails()) && "DUTY_END".equals(block.getType()));
                driver.addBlock(new DutyBlock("blk-" + UUID.randomUUID().toString().substring(0, 6),
                    "DUTY_END", hour - 0.5, hour, "End Duty", 0, 0, driver.getVehicleNumber(), "LIVE"));
            } else {
                if (map.containsKey("startHour")) driver.setDutyStartHour(getDouble(map, "startHour", driver.getDutyStartHour()));
                if (map.containsKey("endHour")) driver.setDutyEndHour(getDouble(map, "endHour", driver.getDutyEndHour()));
                if (map.containsKey("status")) driver.setStatus(String.valueOf(map.get("status")));
            }

            dataStore.saveDriver(driver);
            CorsHelper.sendJsonResponse(exchange, 200, JsonUtil.toJson(driver));
        } else {
            CorsHelper.sendJsonResponse(exchange, 400, "{\"error\":\"Invalid JSON\"}");
        }
    }

    @SuppressWarnings("unchecked")
    private void handleAddBlock(HttpExchange exchange, Driver driver) throws IOException {
        String body = readBody(exchange);
        Object parsed = JsonUtil.parseJson(body);
        if (parsed instanceof Map) {
            Map<String, Object> map = (Map<String, Object>) parsed;
            String id = "blk-" + UUID.randomUUID().toString().substring(0, 6);
            String type = String.valueOf(map.getOrDefault("type", "BREAK"));
            double startHour = getDouble(map, "startHour", 13.0);
            double endHour = getDouble(map, "endHour", 14.0);
            String label = String.valueOf(map.getOrDefault("label", "Break"));
            int pickups = getInt(map, "pickups", 0);
            int drops = getInt(map, "drops", 0);
            String veh = String.valueOf(map.getOrDefault("vehicleNumber", driver.getVehicleNumber()));
            String details = String.valueOf(map.getOrDefault("details", "Scheduled"));

            if ("BREAK".equalsIgnoreCase(type)) {
                driver.getBlocks().removeIf(block -> "LIVE".equals(block.getDetails()) && "BREAK".equals(block.getType()));
                details = "LIVE";
            }

            DutyBlock blk = new DutyBlock(id, type, startHour, endHour, label, pickups, drops, veh, details);
            driver.addBlock(blk);
            dataStore.saveDriver(driver);
            CorsHelper.sendJsonResponse(exchange, 201, JsonUtil.toJson(driver));
        } else {
            CorsHelper.sendJsonResponse(exchange, 400, "{\"error\":\"Invalid JSON\"}");
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
