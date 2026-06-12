package com.garagepro.api.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    
    @NotBlank(message = "Nome da empresa é obrigatório")
    String companyName,

    @NotBlank(message = "CNPJ é obrigatório")
    String cnpj,

    @NotBlank(message = "Nome de usuário é obrigatório")
    String userName,

    @NotBlank(message = "Email é obrigatório")
    @Email(message = "Email inválido")
    String email,

    @NotBlank(message = "Senha é obrigatória")
    @Size(min = 6, message = "A senha deve conter no mínimo 6 caracteres")
    String password
){}
