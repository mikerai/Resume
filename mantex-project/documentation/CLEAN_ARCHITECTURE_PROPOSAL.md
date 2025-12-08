# Mantex V2: Clean Architecture & AWS Serverless Strategy

## 1. Executive Summary
This document outlines the architectural vision for Mantex V2. The goal is to decouple the application from Supabase, migrating to a scalable, cloud-native **AWS Serverless** infrastructure while adopting **Clean Architecture** principles. This ensures modularity, testability, and parallel development capabilities.

## 2. High-Level Architecture (The "Stack")

### Infrastructure (AWS Native)
- **Database**: Amazon RDS for PostgreSQL (Native) or Aurora Serverless v2.
- **Compute**: AWS Lambda (Node.js) for business logic.
- **API Management**: Amazon API Gateway (REST/HTTP APIs) to orchestrate Lambdas.
- **Auth**: AWS Cognito (or keeping Supabase Auth temporarily as an OIDC provider, but plan is full decoupling).
- **Storage**: Amazon S3 for documents/images.

### Frontend (Dumb UI)
- **Framework**: Vue 3 + Vite.
- **Role**: Strictly "Presentation Layer". No business logic in components.
- **State Management**: Pinia (acting as the "Adapter" to the domain).
- **Communication**: Agnostic HTTP Client (Axios/Fetch) interacting via **DTOs**.

---

## 3. Backend Architecture: Hexagonal (Ports & Adapters)

Each AWS Lambda (or a Monolith-in-Lambda structured by domains) will follow this internal structure:

```
src/
  ├── domain/           # CORE: Entities & Business Rules (Pure JS/TS, No dependencies)
  │    ├── models/      # e.g., Ticket.js, Supplier.js
  │    └── errors/      # Domain specific errors
  ├── use_cases/        # APPLICATION: Application Logic / Orchestration
  │    └── CreateTicket.js
  ├── adapters/         # INFRASTRUCTURE: External concerns
  │    ├── repositories/# SQL Implementations (PostgresAdapter)
  │    └── gateways/    # 3rd Party APIs (Nubarium, Stripe, Notifications)
  └── interfaces/       # PRESENTATION (Lambda Handlers)
       └── http/        # API Gateway Event Handlers
```

### Key Principles
1.  **Dependency Rule**: Outer layers depend on inner layers. The Domain knows nothing about the Database or the Web.
2.  **Wrappers**: All external libraries (AWS SDK, PG driver) must be wrapped in Adapters/Interfaces.

---

## 4. Frontend Architecture: The "Dumb" View

The Vue frontend will be treated as a "plugin" to the application core.

```
src/
  ├── core/                 # DOMAIN LOGIC (Could be shared/npm package)
  │    ├── entities/        # Types/Classes
  │    ├── repositories/    # Interfaces (Abstract)
  │    └── use_cases/       # Logic interacting with Repositories
  ├── infrastructure/       # IMPLEMENTATION
  │    └── api/             # Axios implementation of Repositories
  ├── presentation/         # VUE
  │    ├── components/      # Dumb Components (Props in, Events out)
  │    ├── views/           # Smart Components (Connects Stores to Dumb Comps)
  │    └── stores/          # Pinia (State + Actions calling Use Cases)
```

### Best Practices for V2

-   **Contract-First Development**: Define API Specs (OpenAPI/Swagger) *before* writing code. Frontend and Backend teams code against the spec (Mock servers).
-   **Repository Pattern**: Components **never** call API endpoints directly. They call `TicketRepository.getAll()`.
-   **DTOs (Data Transfer Objects)**: Backend returns strict JSON shapes. Frontend adapts them into Domain Objects immediately upon receipt.
-   **Feature Modules**: Code organized by Domain (e.g., `/modules/tickets`, `/modules/users`) rather than technical type (not `/components`, `/views` global folders).

## 5. Migration Strategy (Strangler Fig Pattern)

We do not rewrite everything at once.

1.  **Identify a Module**: e.g., "Ratings & Reviews".
2.  **Build V2 Backend**: Create Lambda + API Gateway for `/reviews`.
3.  **Refactor Frontend**: Point the Review component to the new API using the new Repository pattern.
4.  **Repeat**: Move logic piece by piece until Supabase is just a database (or fully migrated to RDS).

## 6. Development Workflow

-   **Local**: LocalStack or SAM/SST for AWS emulation.
-   **CI/CD**: GitHub Actions deploying to ephemeral environments per PR.
-   **Testing**:
    -   *Unit*: Domain Logic (Jest).
    -   *Integration*: Repositories (Testcontainers/Docker).
    -   *E2E*: Critical flows (Cypress/Playwright).
