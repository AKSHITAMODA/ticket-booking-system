# 🎟️ Ticket Booking System

A full-stack ticket booking platform built with **React, Spring Boot, PostgreSQL, JWT Authentication, Razorpay, QR Code generation, email notifications, seat holds, and waitlist management**.

Users can browse events, view real-time seat availability, temporarily hold seats, make online payments, receive QR-based tickets, view booking history, cancel bookings, and join waitlists when seats are unavailable.

Organisers and admins can create and manage events and view bookings.

---

## 🌐 Live Demo

### Frontend

https://ticket-booking-system-two-iota.vercel.app/

### Backend API

https://ticket-booking-systemm.onrender.com/

---

## ✨ Features

### 🔐 Authentication & Authorization

- JWT-based authentication
- User registration and login
- Protected APIs
- Role-based authorization
- CUSTOMER, ORGANISER and ADMIN roles
- Password hashing

### 🎫 Event Management

- Browse available events
- View event details
- Create events
- Update events
- Delete events
- Organiser-specific event management
- Admin event management

### 🪑 Seat Management

- Visual seat map
- Individual seat selection
- Seat categories
- AVAILABLE / HELD / BOOKED seat states
- Temporary seat holds
- Configurable hold duration
- Automatic hold expiry
- Backend concurrency protection
- Pessimistic database locking
- Prevention of double booking

### 💳 Payments

- Razorpay payment integration
- Server-side Razorpay order creation
- Razorpay payment signature verification
- Booking confirmation only after successful payment verification
- Payment order tracking

### 🎟️ Booking Management

- Confirmed bookings
- Booking history
- View individual bookings
- Booking cancellation
- Automatic seat release after cancellation
- Booking status tracking

### ⏳ Waitlist

- Join waitlist when seats are unavailable
- Category-based waitlists
- Queue position tracking
- Automatic seat offers after cancellations
- Time-limited waitlist offers
- Expired offer handling
- Automatic progression to the next waiting customer

### 📱 Digital Tickets

- QR-code based booking tickets
- QR code displayed with confirmed bookings
- Booking confirmation email
- QR ticket included with booking confirmation

### ☁️ Deployment

- Vercel — Frontend
- Render — Backend
- PostgreSQL database
- Environment-based configuration

---

## 👥 User Roles

### Customer

Customers can:

- Register and login
- Browse events
- View event details
- View the seat map
- Select available seats
- Hold seats temporarily
- Make Razorpay payments
- View confirmed bookings
- View booking history
- View QR tickets
- Receive booking confirmation emails
- Cancel bookings
- Join event/category waitlists
- View waitlist positions
- Cancel waitlist entries

### Organiser

Organisers can:

- Create events
- Update events
- Delete their events
- Generate/manage event seats
- View bookings for their events

### Admin

Admins can:

- Manage events
- Manage seats
- View bookings
- Generate seats
- Access organiser-level functionality
- Manage the overall booking system

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
- Spring Boot
- Spring Security
- Spring Data JPA
- JWT
- Maven

### Database

- PostgreSQL

### Payment Gateway

- Razorpay

### Email

- Spring Mail / SMTP

### Ticketing

- QR Code generation

### Deployment

- Vercel
- Render

---

# 🏗️ Architecture

```text
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
                    └───────┬───────┬──────┘
                            │       │
                ┌───────────┘       └──────────────┐
                ▼                                  ▼
        ┌─────────────┐                    ┌─────────────┐
        │ PostgreSQL  │                    │  Razorpay   │
        │  Database   │                    │  Payments   │
        └─────────────┘                    └─────────────┘
                │
                │
                ▼
        ┌─────────────────┐
        │ Email + QR Code │
        │ Ticket Service  │
        └─────────────────┘
```

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
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── ...
│   │
│   ├── package.json
│   ├── package-lock.json
│   ├── vite.config.js
│   └── index.html
│
├── docs/
│   ├── architecture.md
│   ├── booking-flow.md
│   └── database.md
│
├── .env.example
└── README.md
```

## 🔐 Authentication
The application uses JWT authentication with Spring Security.

After successful login, a JWT token is stored on the frontend and automatically attached to protected API requests using an Axios interceptor.
```text
User
  │
  │ Register / Login
  ▼
Spring Boot Authentication API
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
Spring Security
  │
  ▼
Protected API
```
Role-based authorization is used to restrict organiser and admin operations.

## 🪑 Seat Management

Each event contains individual seat records.

Every seat has a category and one of the following states:
```text
AVAILABLE
HELD
BOOKED
```
The frontend displays these states through the visual seat map.

Only AVAILABLE seats can be selected by customers.

The backend remains the authoritative source for seat state.

## ⏳ Seat Hold and TTL

Before payment, selected seats are temporarily held.

The hold request is sent to:
```text
POST /api/events/{eventId}/seats/hold
```

The backend changes the selected seats:
```text
AVAILABLE → HELD
```

Each held seat stores:

-User holding the seat
-Hold expiry timestamp
-Seat status

The hold duration is configurable through:
```text
app.seat.hold-minutes=10
```

If the customer completes payment within the hold period:

```text
HELD → BOOKED
```

If the customer abandons checkout and the hold expires:

```text
HELD → AVAILABLE
```

This prevents abandoned checkout sessions from permanently blocking seats.

## 🔒 Concurrency Protection

Seat availability is not protected only at the frontend level.

The backend validates seat state before modifying seats and uses database locking for critical event/seat operations.

This prevents two simultaneous customers from successfully acquiring the same seat.

The important seat lifecycle is:
```text
AVAILABLE
    ↓
HELD
    ↓
BOOKED
```

##🎫 Booking Flow

The complete booking flow is:
```text
User selects event
        │
        ▼
View seat map
        │
        ▼
Select AVAILABLE seats
        │
        ▼
Hold selected seats
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
Convert HELD seats → BOOKED
        │
        ▼
Create CONFIRMED Booking
        │
        ├───────────────┐
        ▼               ▼
Generate QR       Send Email
        │               │
        └───────┬───────┘
                ▼
          My Bookings
```
A booking is confirmed only after successful backend payment verification.
The database is the authoritative source of truth for seat state.

##💳 Razorpay Integration

The backend creates a Razorpay order using the selected event and seats.

Create Payment Order
```text
POST /api/payments/create-order
```
Verify Payment
```text
POST /api/payments/verify
```
The backend verifies the Razorpay payment signature before confirming the booking.

The payment verification flow ensures that a frontend payment-success message alone cannot create a confirmed booking.

## 🎟️ Booking Management

Customers can view their confirmed and cancelled bookings through:
```text
GET /api/bookings/my
```

A booking contains information such as:
-Booking ID
-Event
-Customer
-Number of seats
-Total amount
-Booking status
-Booking date
-Booked seats

Booking statuses include:
```text
CONFIRMED
CANCELLED
```

## ❌ Booking Cancellation

Customers can cancel eligible confirmed bookings.
```text
DELETE /api/bookings/{bookingId}
```
The cancellation flow releases the associated seats.
```text
BOOKED
   ↓
Booking Cancelled
   ↓
AVAILABLE
```
If eligible customers are waiting for the released seat/category, the waitlist process can offer the seat to the next customer.

## ⏳ Waitlist

When seats are unavailable for a required category, customers can join the waitlist.

Each waitlist entry contains:

-Event
-Customer
-Category
-Queue position
-Status
-Offered seat, when applicable
-Offer expiry timestamp

Example:
```text
Customer A → Position 1
Customer B → Position 2
Customer C → Position 3
```
Customers are processed in queue order.

## 🎟️ Waitlist Seat Offer

When a booking is cancelled and a suitable seat becomes available, the system identifies the next waiting customer.

The waitlist entry changes:
```text
WAITING → OFFERED
```
The customer receives a time-limited opportunity to book the offered seat.

If the customer successfully completes the booking:
```text
OFFERED → BOOKED
```
and:
```text
AVAILABLE → BOOKED
```
If the offer expires, the system can continue with the next eligible customer.
```text
Position 1 → Offer expires
       ↓
Position 2 → New offer
       ↓
Position 3 → Next offer
```
This prevents released inventory from being wasted.

## 📱 QR Tickets and Email

After successful booking confirmation, a QR code is generated for the booking.

The QR ticket is displayed with the booking information in My Bookings.

A booking confirmation email is also sent to the customer containing the ticket information and QR code.

The booking therefore provides both a web-based digital ticket and email-based confirmation.

## 📧 Email Confirmation

The backend uses SMTP email configuration to send booking confirmation emails.

Email sending is performed after successful booking/payment processing so that an email failure does not invalidate an already-confirmed booking.

Required email configuration is provided through environment variables.

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
### Seats

```text
GET    /api/events/{eventId}/seats
POST   /api/events/{eventId}/seats/hold
POST   /api/events/{eventId}/seats/generate
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

### Waitlist

```text
POST   /api/waitlist/events/{eventId}
GET    /api/waitlist/my
GET    /api/waitlist/{entryId}
DELETE /api/waitlist/{entryId}
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

MAIL_HOST=<smtp-host>
MAIL_PORT=587
MAIL_USERNAME=<email>
MAIL_PASSWORD=<email-password>
```

### Spring Boot Configuration

```properties
spring.datasource.url=${DATABASE_URL:jdbc:postgresql://localhost:5432/ticket_booking}
spring.datasource.username=${DATABASE_USERNAME:postgres}
spring.datasource.password=${DATABASE_PASSWORD:postgres}

razorpay.key.id=${RAZORPAY_KEY_ID}
razorpay.key.secret=${RAZORPAY_KEY_SECRET}

spring.mail.host=${MAIL_HOST}
spring.mail.port=${MAIL_PORT:587}
spring.mail.username=${MAIL_USERNAME}
spring.mail.password=${MAIL_PASSWORD}
```

### Frontend

For production:

```env
VITE_API_URL=https://ticket-booking-systemm.onrender.com```

For local development:

```env
VITE_API_URL=http://localhost:8080```

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
