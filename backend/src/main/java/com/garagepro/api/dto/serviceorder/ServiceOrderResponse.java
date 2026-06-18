package com.garagepro.api.dto.serviceorder;

import com.garagepro.api.entity.enums.ServiceOrderStatus;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public record ServiceOrderResponse(
    Long id,
    String number,
    ServiceOrderStatus status,
    Long customerId,
    String customerName,
    Long vehicleId,
    String vehiclePlate,
    String vehicleModel,
    String notes,
    BigDecimal totalServices,
    BigDecimal totalParts,
    BigDecimal total,
    LocalDateTime openedAt,
    LocalDateTime closedAt,
    List<ServiceOrderItemResponse> items,
    List<ServiceOrderPartResponse> parts
) {}