# GaragePro API

Sistema ERP para oficinas mecânicas. Backend desenvolvido com Java 21 e Spring Boot 3, com suporte a multi-tenancy, autenticação JWT e gerenciamento completo de ordens de serviço.

## Tecnologias

- **Java 21** + **Spring Boot 3.3.5**
- **Spring Security** + **JWT** (jjwt 0.12.6)
- **MySQL** + **JPA/Hibernate**
- **Flyway** — migrations versionadas
- **Lombok** — redução de boilerplate
- **Maven**

## Funcionalidades

- [x] Autenticação com JWT (registro e login por empresa)
- [x] Multi-tenancy — cada oficina possui seus dados isolados
- [x] Gestão de fornecedores
- [x] Gestão de peças e estoque
- [x] Importação de peças via NF-e XML e planilha
- [x] Gestão de clientes e veículos
- [x] Catálogo de serviços
- [x] Ordem de Serviço (OS) — abertura, itens, peças e status
- [ ] Módulo financeiro — pagamentos e contas a receber
- [ ] Nota Fiscal de Saída (NF-e)
- [ ] Relatórios

## Pré-requisitos

- Java 21+
- MySQL 8+
- Maven 3.9+
