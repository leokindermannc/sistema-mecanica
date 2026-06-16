package com.garagepro.api.dto.customer;

import jakarta.validation.constraints.NotBlank;

public record CustomerRequest(
    
    @NotBlank(message = "Nome do cliente é obrigatório")
    String name,

    @NotBlank(message = "Documento do cliente é obrigatório")
    String document,

    String phone,
    String email,
    String address,
    String city,
    String state
){}    
