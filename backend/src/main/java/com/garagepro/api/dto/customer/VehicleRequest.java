package com.garagepro.api.dto.customer;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record VehicleRequest (
    @NotBlank(message = "Placa do veículo é obrigatória")
    String plate,

    @NotBlank(message = "Marca do veículo é obrigatória")
    String brand,

    @NotBlank(message = "Modelo do veículo é obrigatório")
    String model,

    @NotNull(message = "Ano do veículo é obrigatório")
    Integer year,

    String color,
    Integer mileage

){}
