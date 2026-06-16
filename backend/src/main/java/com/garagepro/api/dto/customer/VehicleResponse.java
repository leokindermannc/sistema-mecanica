package com.garagepro.api.dto.customer;

public record VehicleResponse(
    Long id,
    String plate,
    String brand,
    String model,
    Integer year,
    String color,
    Integer mileage,
    Boolean active,
    Long customerId,
    String customerName
) {}
