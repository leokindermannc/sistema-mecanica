package com.garagepro.api.service;

import com.garagepro.api.config.JwtService;
import com.garagepro.api.dto.auth.AuthResponse;
import com.garagepro.api.dto.auth.LoginRequest;
import com.garagepro.api.dto.auth.RegisterRequest;
import com.garagepro.api.entity.Company;
import com.garagepro.api.entity.User;
import com.garagepro.api.entity.enums.UserRole;
import com.garagepro.api.exception.ResourceNotFoundException;
import com.garagepro.api.repository.CompanyRepository;
import com.garagepro.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (companyRepository.existsByCnpj(request.cnpj())) {
            throw new IllegalArgumentException("CNPJ já cadastrado");
        }
        if (userRepository.existsByEmail(request.email())) {
            throw new IllegalArgumentException("Email já cadastrado");
        }

        Company company = companyRepository.save(
            Company.builder()
                .name(request.companyName())
                .cnpj(request.cnpj())
                .build()
        );

        User user = userRepository.save(
            User.builder()
                .name(request.userName())
                .email(request.email())
                .password(passwordEncoder.encode(request.password()))
                .role(UserRole.ADMIN)
                .company(company)
                .build()
        );

        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponse(token, user.getName(), user.getEmail(),
                user.getRole().name(), company.getId(), company.getName());
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByEmail(request.email())
                .orElseThrow(() -> new ResourceNotFoundException("Usuário não encontrado"));

        if (!passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new IllegalArgumentException("Senha incorreta");
        }

        if (!user.getActive()) {
            throw new IllegalArgumentException("Usuário inativo");
        }

        String token = jwtService.generateToken(user.getEmail());

        return new AuthResponse(token, user.getName(), user.getEmail(),
                user.getRole().name(), user.getCompany().getId(), user.getCompany().getName());
    }
}

