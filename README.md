
🔐 SecureAuth API
A secure, production-ready authentication and rate-limiting API built with Node.js, Express, Prisma, PostgreSQL, and Redis — designed to help developers build safe, scalable apps fast.

🤝 Contributing Pull requests and discussions welcome! Please open an issue first to discuss major changes.

🚀 Features
✅ JWT-based authentication
🔐 IP whitelisting + dynamic IP expiration
🧠 Rate limiting using Redis
📬 Email verification and OTP support
🧪 Admin seeding + role-based access control
📊 Redis + API event monitoring (Grafana-ready)
⚙️ Designed for containerized deployment eg. Docker + railway
💡 Why Use This API?
Modern apps need security, observability, and scalability baked in from day one — this API gives you:

Fast setup for production-ready auth flows
Rate limiting out of the box for abuse prevention
Redis integration for real-time features and token management
🧠 Example Use Case
You're building a SaaS app in React. Instead of building login, auth, and rate-limiting yourself, just call this API:

/register: Sign up user and send verification OTP
/login: Authenticate + return JWT
/verify-email: Submit OTP to activate account
/refresh-token: Rotate tokens securely
/admin: Protected routes for admin actions
All protected routes use Authorization: Bearer <token>
Self host
git clone https://github.com/COD434/Auth-System-API

cd Auth-System-API

cp .env

docker-compose up --build

✉️ Contact

Built with ❤️ by THESBD

