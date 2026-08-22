# Ticket Booking System — Database Design

## 1. User

Stores all platform users.

Fields:
- id
- name
- email
- password_hash
- role
- created_at
- updated_at

Roles:
- CUSTOMER
- ORGANISER
- ADMIN

---

## 2. Venue

Represents a physical venue managed by an admin.

Fields:
- id
- name
- location
- created_at
- updated_at

Relationship:

Venue 1 ---- N Seat

---

## 3. Seat

Represents a physical seat inside a venue.

Fields:
- id
- venue_id
- row_label
- seat_number
- category
- created_at

Example categories:
- PREMIUM
- STANDARD

A physical seat belongs to exactly one venue.

---

## 4. Event

Represents a movie or concert/event created by an organiser.

Fields:
- id
- organiser_id
- title
- description
- event_type
- duration_minutes
- created_at
- updated_at

Event types:
- MOVIE
- CONCERT
- OTHER

---

## 5. Show

Represents a scheduled occurrence of an event at a venue.

Fields:
- id
- event_id
- venue_id
- start_time
- end_time
- status
- created_at

Relationship:

Event 1 ---- N Show

Venue 1 ---- N Show

---

## 6. ShowSeat

Represents the state of one physical seat for one particular show.

Fields:
- id
- show_id
- seat_id
- status
- hold_expires_at
- created_at
- updated_at

Statuses:
- AVAILABLE
- HELD
- BOOKED

Important:

A physical Seat is reusable across shows.

ShowSeat stores the seat's state for a particular show.

Example:

Seat A1:
- Show 1 → BOOKED
- Show 2 → AVAILABLE

This table is central to concurrency protection and real-time seat availability.

---

## 7. Booking

Represents a customer's confirmed booking.

Fields:
- id
- booking_reference
- customer_id
- show_id
- total_amount
- status
- created_at
- cancelled_at

Statuses:
- CONFIRMED
- CANCELLED

---

## 8. BookingSeat

Maps a booking to the seats purchased.

Fields:
- id
- booking_id
- show_seat_id
- price

Relationship:

Booking 1 ---- N BookingSeat

---

## 9. SeatHold

Represents a temporary reservation during checkout.

Fields:
- id
- show_seat_id
- customer_id
- expires_at
- created_at

A hold is temporary.

If checkout is abandoned and the hold expires:

HELD → AVAILABLE

The hold TTL must be configurable.

---

## 10. WaitlistEntry

Represents a customer waiting for a seat category.

Fields:
- id
- show_id
- customer_id
- category
- position
- status
- created_at

Statuses:
- WAITING
- OFFERED
- COMPLETED
- EXPIRED
- CANCELLED

The queue is ordered by position / creation time.

---

## 11. WaitlistOffer

Represents a temporary offer made to the next customer in the waitlist.

Fields:
- id
- waitlist_entry_id
- show_seat_id
- token
- expires_at
- status
- created_at

Statuses:
- ACTIVE
- ACCEPTED
- EXPIRED
- DECLINED

If the offer expires:

OFFERED → next waitlist customer

---

## 12. Ticket

Represents the digital ticket generated after a successful booking.

Fields:
- id
- booking_id
- ticket_reference
- qr_payload
- issued_at

The QR payload should contain a booking/ticket reference rather than sensitive customer information.

---

# Core Relationships

User
├── Customer → Booking
├── Customer → WaitlistEntry
└── Organiser → Event

Venue
└── Seat

Event
└── Show

Show
├── ShowSeat
├── Booking
└── WaitlistEntry

Booking
├── BookingSeat
└── Ticket

ShowSeat
└── SeatHold

WaitlistEntry
└── WaitlistOffer

---

# Important Constraints

## Seat uniqueness

A physical seat can exist only once in a venue.

A ShowSeat must be unique for:

(show_id, seat_id)

This prevents duplicate seat-state records for the same show.

## Booking reference

booking_reference must be unique.

## User email

User email must be unique.

## Waitlist ordering

Waitlist entries should be ordered by queue position / creation time.

## Seat state

A ShowSeat can only have one current state:

AVAILABLE
HELD
BOOKED

## Hold expiry

A held seat must have an expiry timestamp.

Expired holds must eventually return the seat to AVAILABLE.

## Concurrency

Seat holding and booking must be performed transactionally so simultaneous attempts cannot both successfully reserve the same ShowSeat.