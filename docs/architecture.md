# System Design – Ticket Booking System

## 1. Architecture Overview

The Ticket Booking System follows a three-tier architecture:

- **Frontend:** React with Vite, responsible for event browsing, authentication, visual seat selection, payment UI, waitlist interaction, booking history and QR ticket display.
- **Backend:** Spring Boot REST API providing authentication, event management, seat management, booking, payment, waitlist and email functionality.
- **Database:** PostgreSQL storing users, events, seats, bookings, booking seats, payment orders and waitlist entries.

Authentication is implemented using JWT. Role-based access control distinguishes CUSTOMER, ORGANISER and ADMIN operations.

The deployed frontend communicates with the deployed Spring Boot backend through REST APIs.

---

## 2. Seat Hold and TTL

When a customer selects seats, the backend places those seats into the `HELD` state rather than immediately booking them.

Each held seat stores:

- the user holding the seat
- the hold expiry timestamp
- the seat status

The hold duration is configurable through:

`app.seat.hold-minutes`

The default configured value is 10 minutes.

While a seat is `HELD`, other customers cannot select it.

When the hold expires, the seat is released and its state returns to `AVAILABLE`. The hold information is cleared at the same time.

This prevents abandoned checkout sessions from permanently blocking seats.

---

## 3. Concurrency Protection

Seat booking is protected at the backend/database level rather than relying only on frontend validation.

The backend verifies the current seat state before creating a hold or booking. Database locking is used for critical seat/event operations so simultaneous requests cannot successfully acquire the same seat.

The important rule is:

`AVAILABLE → HELD → BOOKED`

A seat cannot be booked by two customers simultaneously.

The database therefore acts as the source of truth for seat ownership and status.

---

## 4. Payment and Booking Flow

After seats are successfully held, the backend creates a Razorpay payment order.

The customer completes payment through Razorpay.

The backend verifies the Razorpay payment signature before confirming the booking.

Only after successful verification:

1. The held seats are converted to `BOOKED`.
2. A booking record is created.
3. Booking-seat records are created.
4. The payment order is marked as paid.
5. The customer can view the confirmed booking.

The booking confirmation contains the booking reference and QR ticket information.

---

## 5. Waitlist Auto-Assignment

When an event/category has no available seats, customers can join the waitlist for that category.

Each waitlist entry has:

- event
- customer
- category
- position
- status
- optional offered seat
- offer expiry timestamp

The queue is ordered by position.

When a confirmed booking is cancelled and a seat becomes available, the system identifies the next eligible `WAITING` customer and assigns the released seat as an offer.

The entry changes to `OFFERED` and receives a time-limited expiry.

If the customer completes the booking within the offer period, the offered seat is booked.

If the customer does not complete the booking before the offer expires, the offer is released and the seat can be offered to the next waiting customer.

This prevents cancelled seats from being wasted while preserving queue order.

---

## 6. Seat Map

Each event has its own seat records. Every seat stores its category and current status:

- `AVAILABLE`
- `HELD`
- `BOOKED`

The frontend renders these states visually so customers can immediately distinguish selectable, temporarily held and unavailable seats.

The backend seat records are treated as the authoritative source for seat availability.

---

## 7. QR Code and Email

After successful booking, a QR code is generated using the booking reference.

The booking confirmation email contains the customer's ticket information and QR code.

The QR code allows the booking reference to be represented in a machine-readable format for ticket verification.

---

## 8. Cancellation

A customer can cancel a confirmed booking.

Cancellation changes the booking status to `CANCELLED` and releases the associated seats.

The released seat can then participate in the waitlist assignment process.

---

## 9. Main API Flow

Typical customer booking flow:

`GET /api/events`

→ browse events

`GET /api/events/{eventId}/seats`

→ load seat map

`POST /api/events/{eventId}/seats/hold`

→ hold selected seats

`POST /api/payments/create-order`

→ create Razorpay order

`POST /api/payments/verify`

→ verify payment and confirm booking

`GET /api/bookings/my`

→ view booking history

`DELETE /api/bookings/{bookingId}`

→ cancel booking

Waitlist flow:

`POST /api/waitlist/events/{eventId}`

→ join waitlist

`GET /api/waitlist/my`

→ view waitlist entries

`DELETE /api/waitlist/{entryId}`

→ cancel waitlist entry
