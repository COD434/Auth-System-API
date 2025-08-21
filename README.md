![Documents Passing](https://img.shields.io/badge/documents-passing-brightgreen)  [![CI](https://github.com/COD434/Authenik8/actions/workflows/CI.yml/badge.svg?branch=main&event=push)](https://github.com/COD434/Authenik8/actions/workflows/CI.yml)  ![SQLi Passing](https://img.shields.io/badge/Security Tests-passing-brightgreen)
 ## Authenik8

A secure, production-ready authentication and rate-limiting API built with Node.js, Express, Prisma, PostgreSQL, and Redis designed to help developers build safe, scalable apps fast.



## Features

- JWT-based authentication
- Token bucket algorithm For rateLimiting
- IP whitelisting + dynamic IP expiration
- Rate limiting using Redis
- Email verification and OTP support
- Admin seeding + role-based access control
- Redis + API event monitoring (Grafana-ready)
- Designed for containerized deployment (Docker + Railway)
- Anonymous guest-mode Auth

---

 ## Why Use This API?

Modern apps need security, observability, and scalability baked in from day one  this API gives you:

- **Fast setup** for production-ready auth flows
- **Rate limiting out of the box** for abuse prevention
- **Redis integration** for real-time features and token management

---
## Security Testing Results

We performed SQL injection testing using **sqlmap** on `POST /login` with JSON parameters (`username`, `email`, `password`).

### Findings
- No injectable parameters were found (`username`, `email`, `password` all tested).
- Various SQL injection techniques were tested: boolean-based blind, error-based, stacked queries, time-based blind, UNION queries.
- Server returned **429 (Too Many Requests)** ~190 times and **400 (Bad Request)** 9 times during testing, suggesting possible rate limiting and input validation.
- Conclusion: **No SQL injection vulnerabilities detected** in tested parameters.

📄 [View Full Report](./sqlmap-results.pdf)

#### Security Test: `/verify-reset-otp`

Performed SQL injection testing with **sqlmap** on JSON parameters ( `email`, `otp`).

#### Findings:
-Both parameters were tested against multiple SQLi techniques (boolean-based, error-based, time-based, stacked queries, UNION).
-SQLmap reported no injectable parameters.
-High number of 400 Bad Request errors (144), meaning the app strictly validates request structure (likely your JSON schema validation kicking in).
-**Conclusion**: No injection vulnerability found on `/verify-reset-otp`.
📄 [View Full Report](./verify-reset-otp)

### Security Test: `/register`

Performed SQL injection testing with **sqlmap** on JSON parameters (`username`, `email`, `password`).

#### Findings
- No injectable parameters were detected.
- Tested techniques included: boolean-based blind, error-based, stacked queries, time-based blind, UNION queries.
- Server responded with **219x 400 (Bad Request)** during testing, which may indicate strict input validation.
- **Conclusion:** No SQL injection vulnerabilities found in `/register` route.

📄 [View Full Report](./sqlmap-register-results.pdf)

### Security Test: `/request-password-reset`

Performed SQL injection testing with **sqlmap** on JSON parameter (`email`).

#### Findings
- No injectable parameters detected.
- Techniques tested: boolean-based blind, error-based, stacked queries, time-based blind, UNION queries.
- Server returned **72x 400 (Bad Request)** responses, indicating strict validation or request format enforcement.
- **Conclusion:** No SQL injection vulnerabilities found in `/request-password-reset` route.

📄 [View Full Report](./sqlmap-request-password-reset-results.pdf)
 ---

## Example Use Case

You're building a SaaS app in **React**. Instead of building login, auth, and rate-limiting yourself, just call this API:

- `/register`: Sign up user and send verification OTP  
- `/login`: Authenticate + return JWT
- `/verify-reset-otp`: Verify OTP 
- `/request-password-reset`:Request a Password reset OTP 
- `/update-password`: Securely update your password 
- `/admin`: Protected routes for admin actions  
- All protected routes use `Authorization: Bearer <token>`

Installation

git clone https://github.com/COD434/Authenik8 <br>
cd Authenik8<br>
cp .env<br>
docker-compose up --build

🤝 Contributing

Pull requests and discussions welcome! Please open an issue first to discuss major changes.

Built with ❤️ by TheSBD<br>
Github:COD434 / seeisakarabo2@gmail.com
