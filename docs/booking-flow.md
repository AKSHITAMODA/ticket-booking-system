# Booking and Waitlist Flow

## 1. Customer Booking Flow

The customer first logs into the application using JWT authentication and browses the available events.

After selecting an event, the frontend requests the event's seats from:

`GET /api/events/{eventId}/seats`

The backend returns every seat together with its category and status.

The frontend renders the seats as a visual grid.

A customer can select only seats whose status is `AVAILABLE`.

---

## 2. Seat Hold

When the customer proceeds with the booking, the selected seat IDs are sent to:

`POST /api/events/{eventId}/seats/hold`

The backend validates that the requested seats are still available.

If successful, the seats become:

`AVAILABLE → HELD`

The backend stores the user holding the seats and a hold expiry timestamp.

The hold duration is configurable through:

`app.seat.hold-minutes`

The frontend displays the hold countdown to the customer.

While the seats are held, another customer cannot select them.

---

## 3. Checkout and Payment

After successfully holding seats, the application creates a Razorpay payment order:

`POST /api/payments/create-order`

The customer completes payment using Razorpay.

The frontend then sends the Razorpay order ID, payment ID and signature to:

`POST /api/payments/verify`

The backend verifies the Razorpay signature.

A booking is created only after successful payment verification.

The booking contains the customer, event, number of seats, total amount and booking status.

The associated seats change:

`HELD → BOOKED`

The hold information is cleared.

The payment order is marked as paid.

---

## 4. Confirmed Booking

After successful verification, the customer is redirected to My Bookings.

The booking history displays:

- booking reference
- event
- number of seats
- total amount
- booking status
- booking date
- QR ticket

The QR code contains the booking reference.

A booking confirmation email is also generated with the ticket/QR information.

---

## 5. Abandoned Checkout

If a customer holds seats but does not complete checkout, the hold eventually expires.

When the hold expires, the seats are released:

`HELD → AVAILABLE`

The user holding information and expiry timestamp are cleared.

The seats can then be selected by another customer.

This prevents abandoned checkout sessions from permanently consuming inventory.

---

## 6. Cancellation

A customer can cancel a confirmed booking from My Bookings.

The cancellation request is sent to the backend.

The booking becomes:

`CONFIRMED → CANCELLED`

The seats associated with that booking are released.

Released seats can then be reassigned through the waitlist mechanism when applicable.

---

## 7. Waitlist

When no seats are available in a required category, the customer can join the waitlist.

The waitlist entry stores the event, customer, category and queue position.

Customers are processed in position order.

For example:
```text
Customer A → Position 1
Customer B → Position 2
Customer C → Position 3


If a Premium seat becomes available, Customer A is considered first.
```

## 8. Waitlist Seat Offer

After a cancellation releases a seat, the system identifies the next waiting customer for the relevant category.

The seat is offered to that customer.

The waitlist entry changes from:

```text
WAITING → OFFERED
```
The offer receives an expiry timestamp.

The customer must complete the booking before the offer expires.

If successful:
```text
OFFERED → BOOKED

and the seat becomes:

AVAILABLE → BOOKED
```

## 9. Expired Waitlist Offer

If the customer does not complete the offered booking within the configured offer period, the offer expires.

The offered seat is released.

The system can then continue the queue and offer the seat to the next eligible waiting customer.

Example:
```text
Position 1 → Offer expires
       ↓
Position 2 → New offer
       ↓
Position 3 → Next if Position 2 expires
```

This prevents cancelled inventory from being wasted.

## 10. Concurrency

Concurrency is handled on the backend.

Frontend seat availability is not treated as sufficient protection because another customer may attempt to select the same seat at the same time.

The backend validates and locks critical seat/event operations before changing seat state.

Therefore two simultaneous requests cannot both successfully acquire the same seat.

The database remains the authoritative source of seat status.

## 11. Final Booking State Flow

The normal successful flow is:
```text

AVAILABLE
    ↓
HELD
    ↓
Payment
    ↓
Payment Verification
    ↓
BOOKED
    ↓
CONFIRMED BOOKING
    ↓
QR + Email
```
Abandoned checkout:

```text
AVAILABLE
    ↓
HELD
    ↓
TTL expires
    ↓
AVAILABLE
```

Cancellation:

```text
BOOKED
    ↓
Booking Cancelled
    ↓
AVAILABLE
    ↓
Waitlist Offer
```
