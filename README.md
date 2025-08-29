![Documents Passing](https://img.shields.io/badge/documents-passing-brightgreen)  [![CI](https://github.com/COD434/Authenik8/actions/workflows/CI.yml/badge.svg?branch=main&event=push)](https://github.com/COD434/Authenik8/actions/workflows/CI.yml)  ![SQLi Passing](https://img.shields.io/badge/SecurityTests-passing-brightgreen)
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
```
git clone https://github.com/COD434/Authenik8 <br>
cd Authenik8<br>
cp .env<br>
docker-compose up --build
```
🤝 Contributing

Pull requests and discussions welcome! Please open an issue first to discuss major changes.

Built with ❤️ by TheSBD<br>
Github:COD434 / seeisakarabo2@gmail.com
