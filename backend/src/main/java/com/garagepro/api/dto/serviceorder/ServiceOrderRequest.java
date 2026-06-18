package com.garagepro.api.dto.serviceorder;

import jakarta.validation.constraints.NotNull;
import java.util.List;

public record ServiceOrderRequest(
    @NotNull(message = "Cliente é obrigatório") Long customerId,
    @NotNull(message = "Veículo é obrigatório") Long vehicleId,
    String notes,
    List<ServiceOrderItemRequest> items,
    List<ServiceOrderPartRequest> parts
) {}
