package com.garagepro.api.dto.serviceorder;

import java.math.BigDecimal;

public record ServiceOrderItemResponse(
    Long id,
    Long serviceId,
    String serviceName,
    Integer quantity,
    BigDecimal unitPrice,
    BigDecimal subtotal
) {}
