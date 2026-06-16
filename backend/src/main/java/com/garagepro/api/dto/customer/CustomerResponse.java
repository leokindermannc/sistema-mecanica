package com.garagepro.api.dto.customer;

public record CustomerResponse (
    Long id,
    String name,
    String document,
    String phone,
    String email,
    String address,
    String city,
    String state,
    Boolean active
){}
