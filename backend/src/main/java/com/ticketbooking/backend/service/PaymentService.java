package com.ticketbooking.backend.service;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

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
import com.ticketbooking.backend.entity.User;
import com.ticketbooking.backend.repository.EventRepository;
import com.ticketbooking.backend.repository.PaymentOrderRepository;

@Service
public class PaymentService {

    private final RazorpayClient razorpayClient;
    private final RazorpayConfig razorpayConfig;
    private final PaymentOrderRepository paymentOrderRepository;
    private final EventRepository eventRepository;
    private final UserService userService;
    private final BookingService bookingService;

    public PaymentService(
            RazorpayClient razorpayClient,
            RazorpayConfig razorpayConfig,
            PaymentOrderRepository paymentOrderRepository,
            EventRepository eventRepository,
            UserService userService,
            BookingService bookingService) {

        this.razorpayClient = razorpayClient;
        this.razorpayConfig = razorpayConfig;
        this.paymentOrderRepository = paymentOrderRepository;
        this.eventRepository = eventRepository;
        this.userService = userService;
        this.bookingService = bookingService;
    }

    // =========================================================
    // CREATE RAZORPAY ORDER
    // =========================================================

    @Transactional
    public Map<String, Object> createPaymentOrder(
            Long eventId,
            Integer numberOfSeats,
            String userEmail) {

        if (numberOfSeats == null || numberOfSeats <= 0) {
            throw new RuntimeException(
                    "Number of seats must be greater than 0");
        }

        User user =
                userService.findByEmail(userEmail);

        Event event =
                eventRepository.findByIdForUpdate(eventId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event not found"));

        if (event.getAvailableSeats() < numberOfSeats) {
            throw new RuntimeException(
                    "Not enough seats available");
        }

        BigDecimal amount =
                event.getPrice()
                        .multiply(
                                BigDecimal.valueOf(numberOfSeats)
                        );

        long amountInPaise =
                amount
                        .multiply(BigDecimal.valueOf(100))
                        .longValueExact();

        try {

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
                    "seats",
                    numberOfSeats
            );

            orderRequest.put(
                    "notes",
                    notes
            );

            Order razorpayOrder =
                    razorpayClient.orders
                            .create(orderRequest);

            String razorpayOrderId =
                    razorpayOrder.get("id");

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

            paymentOrder.setAmount(amount);

            paymentOrder.setStatus(
                    PaymentOrder.Status.CREATED
            );

            paymentOrderRepository.save(
                    paymentOrder
            );

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
                                        "Payment order not found"));

        // Idempotency:
        // If frontend sends verification twice,
        // don't create another booking.
        if (paymentOrder.getStatus()
                == PaymentOrder.Status.PAID) {

            if (paymentOrder.getBooking() != null) {
                return paymentOrder.getBooking();
            }

            throw new RuntimeException(
                    "Payment was already processed");
        }

        try {

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

            /*
             * Signature is valid.
             *
             * Now create the actual booking.
             * BookingService will lock the event row
             * and check availability again.
             */
            Booking booking =
                    bookingService.createBooking(
                            paymentOrder.getEvent().getId(),
                            paymentOrder.getNumberOfSeats(),
                            userEmail
                    );

            paymentOrder.setRazorpayPaymentId(
                    razorpayPaymentId
            );

            paymentOrder.setStatus(
                    PaymentOrder.Status.PAID
            );

            paymentOrder.setBooking(booking);

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