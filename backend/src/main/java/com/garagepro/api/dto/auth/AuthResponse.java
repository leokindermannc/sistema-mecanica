package com.garagepro.api.dto.auth;

public record AuthResponse(
    String token,
    String name,
    String email,
    String role,
    Long companyId,
    String companyName
){}
