package com.ticketbooking.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.json.JSONObject;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.Utils;
import com.ticketbooking.backend.config.RazorpayConfig;
import com.ticketbooking.backend.entity.Booking;
import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.PaymentOrder;
import com.ticketbooking.backend.entity.Seat;
import com.ticketbooking.backend.entity.User;
import com.ticketbooking.backend.entity.WaitlistEntry;
import com.ticketbooking.backend.repository.EventRepository;
import com.ticketbooking.backend.repository.PaymentOrderRepository;
import com.ticketbooking.backend.repository.SeatRepository;
import com.ticketbooking.backend.repository.WaitlistRepository;

@Service
public class PaymentService {

    private final RazorpayClient razorpayClient;
    private final RazorpayConfig razorpayConfig;
    private final PaymentOrderRepository paymentOrderRepository;
    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;
    private final UserService userService;
    private final BookingService bookingService;
    private final WaitlistRepository waitlistRepository;

    public PaymentService(
            RazorpayClient razorpayClient,
            RazorpayConfig razorpayConfig,
            PaymentOrderRepository paymentOrderRepository,
            EventRepository eventRepository,
            SeatRepository seatRepository,
            UserService userService,
            BookingService bookingService,
            WaitlistRepository waitlistRepository) {

        this.razorpayClient = razorpayClient;
        this.razorpayConfig = razorpayConfig;
        this.paymentOrderRepository = paymentOrderRepository;
        this.eventRepository = eventRepository;
        this.seatRepository = seatRepository;
        this.userService = userService;
        this.bookingService = bookingService;
        this.waitlistRepository = waitlistRepository;
    }

    // =========================================================
    // CREATE RAZORPAY ORDER
    // =========================================================

    @Transactional
    public Map<String, Object> createPaymentOrder(
            Long eventId,
            List<Long> seatIds,
            String userEmail) {

        // -----------------------------------------------------
        // Validate seat selection
        // -----------------------------------------------------

        if (seatIds == null ||
                seatIds.isEmpty()) {

            throw new RuntimeException(
                    "At least one seat must be selected"
            );
        }

        if (seatIds.size() !=
                seatIds.stream()
                        .distinct()
                        .count()) {

            throw new RuntimeException(
                    "Duplicate seats are not allowed"
            );
        }

        User user =
                userService.findByEmail(userEmail);

        // -----------------------------------------------------
        // Lock event
        // -----------------------------------------------------

        Event event =
                eventRepository.findByIdForUpdate(eventId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event not found"
                                ));

        // -----------------------------------------------------
        // Validate every held seat
        // -----------------------------------------------------

        LocalDateTime now =
                LocalDateTime.now();

        for (Long seatId : seatIds) {

            Seat seat =
                    seatRepository.findByIdForUpdate(
                            seatId
                    )
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Seat not found: "
                                            + seatId
                            ));

            // -------------------------------------------------
            // Event validation
            // -------------------------------------------------

            if (!seat.getEvent()
                    .getId()
                    .equals(event.getId())) {

                throw new RuntimeException(
                        "Selected seat does not belong to this event"
                );
            }

            // -------------------------------------------------
            // Seat must be HELD
            // -------------------------------------------------

            if (seat.getStatus() !=
                    Seat.Status.HELD) {

                throw new RuntimeException(
                        "Seat " +
                        seat.getSeatNumber() +
                        " is not currently held"
                );
            }

            // -------------------------------------------------
            // Must be held by current user
            // -------------------------------------------------

            if (seat.getHeldByUserId() == null ||
                    !seat.getHeldByUserId()
                            .equals(user.getId())) {

                throw new RuntimeException(
                        "Seat " +
                        seat.getSeatNumber() +
                        " is held by another user"
                );
            }

            // -------------------------------------------------
            // Check expiry
            // -------------------------------------------------

            if (seat.getHoldExpiresAt() == null ||
                    !seat.getHoldExpiresAt()
                            .isAfter(now)) {

                /*
                 * Release expired seat immediately.
                 */
                seat.setStatus(
                        Seat.Status.AVAILABLE
                );

                seat.setHeldByUserId(null);

                seat.setHoldExpiresAt(null);

                seatRepository.save(seat);

                throw new RuntimeException(
                        "Seat " +
                        seat.getSeatNumber() +
                        " hold has expired"
                );
            }
        }

        // -----------------------------------------------------
        // Validate event availability
        // -----------------------------------------------------

        /*
         * A waitlist-offered seat is already HELD for this user.
         *
         * Therefore event.availableSeats may legitimately be 0.
         *
         * We only reject the order when the requested seats are
         * not part of an active waitlist offer.
         */

        long offeredSeatCount = 0;

        for (Long seatId : seatIds) {

            Seat seat =
                    seatRepository.findById(seatId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Seat not found: "
                                                    + seatId
                            ));

            boolean isWaitlistOffered =
                    waitlistRepository
                            .findByOfferedSeatAndStatus(
                                    seat,
                                    WaitlistEntry.Status.OFFERED
                            )
                            .map(entry ->
                                    entry.getUser()
                                            .getId()
                                            .equals(
                                                    user.getId()
                                            ) &&
                                    entry.getOfferExpiresAt() != null &&
                                    entry.getOfferExpiresAt()
                                            .isAfter(now)
                            )
                            .orElse(false);

            if (isWaitlistOffered) {
                offeredSeatCount++;
            }
        }

        int normalSeats =
                seatIds.size() -
                (int) offeredSeatCount;

        if (event.getAvailableSeats() <
                normalSeats) {

            throw new RuntimeException(
                    "Not enough seats available"
            );
        }

        // -----------------------------------------------------
        // Calculate amount
        // -----------------------------------------------------

        int numberOfSeats =
                seatIds.size();

        BigDecimal amount =
                event.getPrice()
                        .multiply(
                                BigDecimal.valueOf(
                                        numberOfSeats
                                )
                        );

        long amountInPaise =
                amount
                        .multiply(
                                BigDecimal.valueOf(100)
                        )
                        .longValueExact();

        try {

            // -------------------------------------------------
            // Razorpay receipt
            // -------------------------------------------------

            String receipt =
                    "ticket_" +
                    UUID.randomUUID()
                            .toString()
                            .replace("-", "")
                            .substring(0, 20);

            JSONObject orderRequest =
                    new JSONObject();

            orderRequest.put(
                    "amount",
                    amountInPaise
            );

            orderRequest.put(
                    "currency",
                    "INR"
            );

            orderRequest.put(
                    "receipt",
                    receipt
            );

            // -------------------------------------------------
            // Razorpay notes
            // -------------------------------------------------

            JSONObject notes =
                    new JSONObject();

            notes.put(
                    "event_id",
                    event.getId().toString()
            );

            notes.put(
                    "user_id",
                    user.getId().toString()
            );

            notes.put(
                    "seat_ids",
                    seatIds.toString()
            );

            orderRequest.put(
                    "notes",
                    notes
            );

            // -------------------------------------------------
            // Create Razorpay order
            // -------------------------------------------------

            Order razorpayOrder =
                    razorpayClient.orders
                            .create(orderRequest);

            String razorpayOrderId =
                    razorpayOrder.get("id");

            // -------------------------------------------------
            // Save payment order
            // -------------------------------------------------

            PaymentOrder paymentOrder =
                    new PaymentOrder();

            paymentOrder.setRazorpayOrderId(
                    razorpayOrderId
            );

            paymentOrder.setUser(user);

            paymentOrder.setEvent(event);

            paymentOrder.setNumberOfSeats(
                    numberOfSeats
            );

            paymentOrder.setSeatIds(
                    seatIds.stream()
                            .map(String::valueOf)
                            .collect(
                                    Collectors.joining(",")
                            )
            );

            paymentOrder.setAmount(amount);

            paymentOrder.setStatus(
                    PaymentOrder.Status.CREATED
            );

            paymentOrderRepository.save(
                    paymentOrder
            );

            // -------------------------------------------------
            // Response
            // -------------------------------------------------

            Map<String, Object> response =
                    new HashMap<>();

            response.put(
                    "key",
                    razorpayConfig.getKeyId()
            );

            response.put(
                    "orderId",
                    razorpayOrderId
            );

            response.put(
                    "amount",
                    amountInPaise
            );

            response.put(
                    "currency",
                    "INR"
            );

            response.put(
                    "eventId",
                    event.getId()
            );

            response.put(
                    "eventTitle",
                    event.getTitle()
            );

            response.put(
                    "numberOfSeats",
                    numberOfSeats
            );

            response.put(
                    "seatIds",
                    seatIds
            );

            return response;

        } catch (Exception e) {

            throw new RuntimeException(
                    "Unable to create payment order: "
                            + e.getMessage()
            );
        }
    }

    // =========================================================
    // VERIFY PAYMENT
    // =========================================================

    @Transactional
    public Booking verifyPayment(
            String razorpayOrderId,
            String razorpayPaymentId,
            String razorpaySignature,
            String userEmail) {

        User user =
                userService.findByEmail(userEmail);

        PaymentOrder paymentOrder =
                paymentOrderRepository
                        .findByRazorpayOrderIdAndUser(
                                razorpayOrderId,
                                user
                        )
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Payment order not found"
                                ));

        // -----------------------------------------------------
        // Idempotency
        // -----------------------------------------------------

        if (paymentOrder.getStatus()
                == PaymentOrder.Status.PAID) {

            if (paymentOrder.getBooking() != null) {

                return paymentOrder.getBooking();
            }

            throw new RuntimeException(
                    "Payment was already processed"
            );
        }

        try {

            // -------------------------------------------------
            // Verify Razorpay signature
            // -------------------------------------------------

            JSONObject attributes =
                    new JSONObject();

            attributes.put(
                    "razorpay_order_id",
                    razorpayOrderId
            );

            attributes.put(
                    "razorpay_payment_id",
                    razorpayPaymentId
            );

            attributes.put(
                    "razorpay_signature",
                    razorpaySignature
            );

            boolean valid =
                    Utils.verifyPaymentSignature(
                            attributes,
                            razorpayConfig.getKeySecret()
                    );

            if (!valid) {

                paymentOrder.setStatus(
                        PaymentOrder.Status.FAILED
                );

                paymentOrderRepository.save(
                        paymentOrder
                );

                throw new RuntimeException(
                        "Payment signature verification failed"
                );
            }

            // -------------------------------------------------
            // Convert stored seat IDs to List<Long>
            // -------------------------------------------------

            if (paymentOrder.getSeatIds() == null ||
                    paymentOrder.getSeatIds().isBlank()) {

                throw new RuntimeException(
                        "No seats associated with payment"
                );
            }

            List<Long> seatIds =
                    Arrays.stream(
                            paymentOrder
                                    .getSeatIds()
                                    .split(",")
                    )
                    .map(String::trim)
                    .map(Long::valueOf)
                    .toList();

            // -------------------------------------------------
            // Create booking
            // -------------------------------------------------

            Booking booking =
                    bookingService.createBooking(
                            paymentOrder
                                    .getEvent()
                                    .getId(),
                            seatIds,
                            userEmail
                    );

            // -------------------------------------------------
            // FULFILL WAITLIST OFFER
            // -------------------------------------------------

            for (Long seatId : seatIds) {

                Seat seat =
                        seatRepository.findById(seatId)
                                .orElse(null);

                if (seat == null) {
                    continue;
                }

                waitlistRepository
                        .findByOfferedSeatAndStatus(
                                seat,
                                WaitlistEntry.Status.OFFERED
                        )
                        .ifPresent(waitlistEntry -> {

                            /*
                             * Only fulfill the offer belonging
                             * to the user who just paid.
                             */
                            if (waitlistEntry
                                    .getUser()
                                    .getId()
                                    .equals(user.getId())) {

                                waitlistEntry.setStatus(
                                        WaitlistEntry.Status.FULFILLED
                                );

                                waitlistEntry
                                        .setOfferExpiresAt(null);

                                waitlistEntry
                                        .setOfferedSeat(null);

                                waitlistRepository.save(
                                        waitlistEntry
                                );
                            }
                        });
            }

            // -------------------------------------------------
            // Update payment order
            // -------------------------------------------------

            paymentOrder.setRazorpayPaymentId(
                    razorpayPaymentId
            );

            paymentOrder.setStatus(
                    PaymentOrder.Status.PAID
            );

            paymentOrder.setBooking(
                    booking
            );

            paymentOrderRepository.save(
                    paymentOrder
            );

            return booking;

        } catch (RuntimeException e) {

            throw e;

        } catch (Exception e) {

            throw new RuntimeException(
                    "Unable to verify payment: "
                            + e.getMessage()
            );
        }
    }
}