CREATE TABLE companies (
    id           BIGINT AUTO_INCREMENT PRIMARY KEY,
    name         VARCHAR(150) NOT NULL,
    cnpj         VARCHAR(18)  NOT NULL UNIQUE,
    phone        VARCHAR(20),
    email        VARCHAR(150),
    address      VARCHAR(255),
    city         VARCHAR(100),
    state        VARCHAR(2),
    active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);