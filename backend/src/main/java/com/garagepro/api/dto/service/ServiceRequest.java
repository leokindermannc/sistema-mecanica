package com.garagepro.api.dto.service;

import jakarta.validation.constraints.*;

import java.math.BigDecimal;

public record ServiceRequest ( 

    @NotBlank(message = "Nome é obrigatório")
    String name,

    String description,

    @NotNull(message = "Preço é obrigatório")
    @DecimalMin(value = "0.01", message = "Preço deve ser maior que zero")
    BigDecimal price,

    Integer estimatedMinutes
    
){}
