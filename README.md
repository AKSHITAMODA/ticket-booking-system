# 🎟️ Ticket Booking System

A full-stack ticket booking platform built with **React, Spring Boot, PostgreSQL, JWT Authentication, and Razorpay**.

Users can browse events, book tickets, make online payments, and manage their bookings. Organisers and admins can create and manage events.

## 🌐 Live Demo

### Frontend
https://ticket-booking-system-two-iota.vercel.app/

### Backend API
https://ticket-booking-systemm.onrender.com/

---

## ✨ Features

- 🔐 JWT-based authentication
- 👤 Role-based authorization
- 🎫 Event creation and management
- 🪑 Real-time seat availability
- 🎟️ Ticket booking and cancellation
- 💳 Razorpay payment integration
- 🔒 Secure Razorpay payment verification
- 🗄️ PostgreSQL database
- ⚡ RESTful Spring Boot APIs
- 🌐 React frontend
- 📱 Responsive UI
- ☁️ Vercel + Render deployment

---

## 👥 User Roles

### Customer

- Register and login
- Browse events
- View event details
- Book tickets
- Make Razorpay payments
- View booking history
- Cancel bookings

### Organiser

- Create events
- Update events
- Delete events
- View bookings for their events

### Admin

- Manage events
- View bookings
- Access organiser-level functionality

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS

### Backend

- Java 21
- Spring Boot 4
- Spring Security
- Spring Data JPA
- JWT
- Maven

### Database

- PostgreSQL

### Payment Gateway

- Razorpay

### Deployment

- Vercel — Frontend
- Render — Backend

---

## 🏗️ Architecture

                    ┌──────────────────────┐
                    │      React + Vite    │
                    │       Frontend       │
                    │        Vercel        │
                    └──────────┬───────────┘
                               │
                               │ REST APIs
                               ▼
                    ┌──────────────────────┐
                    │    Spring Boot API   │
                    │        Render        │
                    └──────────┬───────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
                    ▼                     ▼
             ┌─────────────┐       ┌─────────────┐
             │ PostgreSQL  │       │  Razorpay   │
             │  Database   │       │  Payments   │
             └─────────────┘       └─────────────┘


## 📁 Project Structure
```text
ticket-booking-system/
│
├── backend/
│   ├── src/
│   │   └── main/
│   │       ├── java/
│   │       │   └── com/ticketbooking/backend/
│   │       │       ├── config/
│   │       │       ├── controller/
│   │       │       ├── entity/
│   │       │       ├── repository/
│   │       │       └── service/
│   │       │
│   │       └── resources/
│   │           └── application.properties
│   │
│   └── pom.xml
│
└── frontend/
    ├── src/
    │   ├── components/
    │   ├── pages/
    │   ├── services/
    │   └── ...
    │
    ├── package.json
    ├── vite.config.js
    └── index.html
```

## 🔐 Authentication

The application uses JWT authentication with Spring Security.

After login, the JWT token is stored on the frontend and automatically attached to API requests using an Axios interceptor.
```text
User
  │
  │ Login
  ▼
Spring Boot
  │
  │ JWT Token
  ▼
React Frontend
  │
  │ Authorization: Bearer <token>
  ▼
JWT Authentication Filter
  │
  ▼
Protected API
```


## 🎫 Booking Flow
```text
User selects event
        │
        ▼
Select number of seats
        │
        ▼
Create Razorpay Order
        │
        ▼
Razorpay Checkout
        │
        ▼
Payment completed
        │
        ▼
Verify Razorpay Signature
        │
        ▼
Create Booking
        │
        ▼
Update Available Seats
```

## 💳 Razorpay Integration

The backend creates Razorpay orders using the selected event and number of seats.

The payment is verified on the backend using the Razorpay signature before creating the booking.

Payment Endpoints
POST /api/payments/create-order
POST /api/payments/verify


## 🪑 Seat Management

The system automatically manages event seat availability.

When a booking is confirmed:

availableSeats = availableSeats - numberOfSeats

When a booking is cancelled:

availableSeats = availableSeats + numberOfSeats

The backend uses pessimistic database locking while modifying event availability to prevent concurrent bookings from overselling seats.
## 🔌 API Endpoints

### Authentication

```text
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
```

### Events

```text
GET    /api/events
GET    /api/events/{id}
POST   /api/events
PUT    /api/events/{id}
DELETE /api/events/{id}
```

### Bookings

```text
POST   /api/bookings
GET    /api/bookings/my
GET    /api/bookings/{id}
DELETE /api/bookings/{id}
GET    /api/bookings/event/{eventId}
```

### Payments

```text
POST   /api/payments/create-order
POST   /api/payments/verify
```

### Health

```text
GET    /api/health
```


## ⚙️ Environment Variables

### Backend

```env
DATABASE_URL=jdbc:postgresql://<host>:<port>/<database>
DATABASE_USERNAME=<username>
DATABASE_PASSWORD=<password>

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
```

### Spring Boot Configuration

```properties
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/ticket_booking}
spring.datasource.username=${DATABASE_USERNAME:postgres}
spring.datasource.password=${DATABASE_PASSWORD:postgres}

razorpay.key.id=${RAZORPAY_KEY_ID}
razorpay.key.secret=${RAZORPAY_KEY_SECRET}
```

### Frontend

For production:

```env
VITE_API_URL=https://ticket-booking-systemm.onrender.com
```

For local development:

```env
VITE_API_URL=http://localhost:8080
```

> ⚠️ **Never commit database passwords, Razorpay secrets, or other private credentials to GitHub.**

## 💻 Running Locally

### 1. Clone Repository

```bash
git clone https://github.com/AKSHITAMODA/ticket-booking-system.git
cd ticket-booking-system
```

### 2. Start PostgreSQL

Create the database:

```sql
CREATE DATABASE ticket_booking;
```

### 3. Run Backend

```bash
cd backend
```

#### Windows

```powershell
.\mvnw.cmd spring-boot:run
```

#### Linux/macOS

```bash
./mvnw spring-boot:run
```

Backend:

```text
http://localhost:8080
```

### 4. Run Frontend

Open another terminal:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:5173
```

---

## ☁️ Deployment

### Frontend — Vercel

Production frontend:

https://ticket-booking-system-two-iota.vercel.app/

Vercel environment variable:

```env
VITE_API_URL=https://ticket-booking-systemm.onrender.com
```

### Backend — Render

Production backend:

https://ticket-booking-systemm.onrender.com/

Render environment variables:

```text
DATABASE_URL
DATABASE_USERNAME
DATABASE_PASSWORD
RAZORPAY_KEY_ID
RAZORPAY_KEY_SECRET
```

The backend uses Render's dynamically assigned port:

```properties
server.port=${PORT:8080}
```

---

## 🔒 Security

The application implements:

- JWT authentication
- Stateless Spring Security
- Role-based access control
- Password hashing
- Protected booking APIs
- Protected payment APIs
- CORS configuration
- Razorpay signature verification
- Environment-based secret management
- Pessimistic database locking

---

## 📌 Future Improvements

- QR-code based tickets
- PDF ticket generation
- Email booking confirmation
- Event search and filtering
- Event categories
- Pagination
- Booking analytics
- Automated refunds
- Redis caching
- Docker support
- CI/CD pipeline

---

## 👩‍💻 Author

### Akshita Moda

B.Tech Computer Science  
VIT Vellore
