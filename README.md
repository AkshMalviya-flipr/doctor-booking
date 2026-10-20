# Amrutam - Telemedicine & Healthcare Consultation Platform

Amrutam is a comprehensive telemedicine platform backend built with NestJS, Apollo GraphQL, TypeORM, and PostgreSQL. It powers a full healthcare consultation lifecycle including user authentication, doctor credentialing, slot scheduling, booking, payment processing, and digital prescription issuance.

---

## 🚀 Quick Navigation

- **[API Documentation & GraphQL Operations Guide](./api/README.md)**
- **[System Architecture & End-to-End Flow](./api/README.md#end-to-end-api-flow)**
- **[API Getting Started](./api/README.md#getting-started)**
- **[Environment Setup](./api/README.md#environment-configuration)**

---

## 🏥 Platform Capabilities

1. **Dual Role Onboarding**: Registration and role management for Patients and Medical Specialists (`DOCTOR`, `PATIENT`, `ADMIN`).
2. **Doctor Credentialing**: Doctor profile with qualifications, licensing, specialization, and consultation pricing.
3. **Availability Slot Management**: Individual and bulk time-slot creation with collision detection to prevent double-booking.
4. **Consultation Lifecycle**: Multi-stage consultation pipeline (`PENDING` ➔ `CONFIRMED` ➔ `COMPLETED` / `CANCELLED` / `RESCHEDULED`).
5. **Payment Processing**: Integrated payment lifecycle (initiation, execution, and refunding) tied to consultation bookings.
6. **Digital Prescriptions**: Structured prescriptions with diagnosis, notes, and medication items (dosage, frequency, duration, and instructions).
7. **Security**: Dual-mode JWT authentication (Bearer header & HTTP-only cookies), password hashing via bcrypt, and global guards.

---

## 🛠️ Tech Stack

- **Server**: NestJS v12
- **API**: GraphQL (Apollo Server v5, Code-First)
- **Database**: PostgreSQL with TypeORM
- **Auth**: JWT with HTTP-only cookies and Bearer tokens
- **Runtime / Package Manager**: Node.js / Bun

For full setup, schema definitions, and operation examples, please see **[api/README.md](./api/README.md)**.
