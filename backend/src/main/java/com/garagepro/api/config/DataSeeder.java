package com.garagepro.api.config;

import com.garagepro.api.entity.Company;
import com.garagepro.api.entity.User;
import com.garagepro.api.entity.enums.UserRole;
import com.garagepro.api.repository.CompanyRepository;
import com.garagepro.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Component
@RequiredArgsConstructor
public class DataSeeder implements ApplicationRunner {

    private final UserRepository userRepository;
    private final CompanyRepository companyRepository;
    private final PasswordEncoder passwordEncoder;

    private static final String ADMIN_EMAIL = "kindermanncampos13@gmail.com";
    private static final String ADMIN_NAME  = "Leonardo Kindermann";
    private static final String ADMIN_PASS  = "123456789";
    private static final String COMPANY_NAME = "Minha Oficina";
    private static final String COMPANY_CNPJ = "00.000.000/0001-00";

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        String encodedPass = passwordEncoder.encode(ADMIN_PASS);

        userRepository.findByEmail(ADMIN_EMAIL).ifPresentOrElse(
            existing -> {
                // User already exists — force-update the password to the seed value
                existing.setPassword(encodedPass);
                userRepository.save(existing);
                log.info("=================================================");
                log.info("  Senha do admin atualizada!");
                log.info("  E-mail : {}", ADMIN_EMAIL);
                log.info("  Senha  : {}", ADMIN_PASS);
                log.info("=================================================");
            },
            () -> {
                Company company = companyRepository.existsByCnpj(COMPANY_CNPJ)
                    ? companyRepository.findByCnpj(COMPANY_CNPJ).orElseThrow()
                    : companyRepository.save(
                        Company.builder()
                            .name(COMPANY_NAME)
                            .cnpj(COMPANY_CNPJ)
                            .build()
                      );

                userRepository.save(
                    User.builder()
                        .name(ADMIN_NAME)
                        .email(ADMIN_EMAIL)
                        .password(encodedPass)
                        .role(UserRole.ADMIN)
                        .company(company)
                        .build()
                );

                log.info("=================================================");
                log.info("  Usuário admin criado com sucesso!");
                log.info("  E-mail : {}", ADMIN_EMAIL);
                log.info("  Senha  : {}", ADMIN_PASS);
                log.info("=================================================");
            }
        );
    }
}
