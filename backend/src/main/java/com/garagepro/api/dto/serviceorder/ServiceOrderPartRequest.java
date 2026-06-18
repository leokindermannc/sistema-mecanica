package com.garagepro.api.dto.serviceorder;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record ServiceOrderPartRequest(
    @NotNull(message = "Peça é obrigatória") Long partId,
    @NotNull @Min(value = 1, message = "Quantidade mínima é 1") Integer quantity
) {}
