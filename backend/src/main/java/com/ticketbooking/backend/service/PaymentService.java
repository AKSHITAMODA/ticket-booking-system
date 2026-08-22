package com.ticketbooking.backend.service;

import java.math.BigDecimal;
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
import com.ticketbooking.backend.repository.EventRepository;
import com.ticketbooking.backend.repository.PaymentOrderRepository;
import com.ticketbooking.backend.repository.SeatRepository;

@Service
public class PaymentService {

    private final RazorpayClient razorpayClient;
    private final RazorpayConfig razorpayConfig;
    private final PaymentOrderRepository paymentOrderRepository;
    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;
    private final UserService userService;
    private final BookingService bookingService;

    public PaymentService(
            RazorpayClient razorpayClient,
            RazorpayConfig razorpayConfig,
            PaymentOrderRepository paymentOrderRepository,
            EventRepository eventRepository,
            SeatRepository seatRepository,
            UserService userService,
            BookingService bookingService) {

        this.razorpayClient = razorpayClient;
        this.razorpayConfig = razorpayConfig;
        this.paymentOrderRepository =
                paymentOrderRepository;
        this.eventRepository = eventRepository;
        this.seatRepository = seatRepository;
        this.userService = userService;
        this.bookingService = bookingService;
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

        if (seatIds == null || seatIds.isEmpty()) {

            throw new RuntimeException(
                    "At least one seat must be selected"
            );
        }

        if (seatIds.size() !=
                seatIds.stream().distinct().count()) {

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
        // Validate availability
        // -----------------------------------------------------

        if (event.getAvailableSeats()
                < seatIds.size()) {

            throw new RuntimeException(
                    "Not enough seats available"
            );
        }

        // -----------------------------------------------------
        // Validate every selected seat
        // -----------------------------------------------------

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

            if (!seat.getEvent().getId()
                    .equals(event.getId())) {

                throw new RuntimeException(
                        "Selected seat does not belong to this event"
                );
            }

            if (seat.getStatus()
                    != Seat.Status.AVAILABLE) {

                throw new RuntimeException(
                        "Seat "
                                + seat.getSeatNumber()
                                + " is already booked"
                );
            }
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

            /*
             * Store:
             *
             * [1,2,3]
             */
            paymentOrder.setSeatIds(
                    seatIds.stream()
                            .map(String::valueOf)
                            .collect(
                                    Collectors.joining(
                                            ","
                                    )
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
            // Convert stored seat IDs back to List<Long>
            // -------------------------------------------------

            List<Long> seatIds =
                    java.util.Arrays
                            .stream(
                                    paymentOrder
                                            .getSeatIds()
                                            .split(",")
                            )
                            .map(String::trim)
                            .map(Long::valueOf)
                            .toList();

            // -------------------------------------------------
            // Create actual booking
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