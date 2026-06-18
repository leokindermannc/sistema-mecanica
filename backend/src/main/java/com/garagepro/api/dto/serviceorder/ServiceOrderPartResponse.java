package com.garagepro.api.dto.serviceorder;

import java.math.BigDecimal;

public record ServiceOrderPartResponse(
    Long id,
    Long partId,
    String partDescription,
    Integer quantity,
    BigDecimal unitPrice,
    BigDecimal subtotal
) {}
