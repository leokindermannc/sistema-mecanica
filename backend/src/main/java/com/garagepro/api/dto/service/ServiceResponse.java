package com.garagepro.api.dto.service;

import java.math.BigDecimal;

public record ServiceResponse(
    Long id,
    String name,
    String description,
    BigDecimal price,
    Integer estimatedMinutes,
    Boolean active
){}

