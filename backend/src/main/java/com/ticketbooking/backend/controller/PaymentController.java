package com.ticketbooking.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ticketbooking.backend.entity.Booking;
import com.ticketbooking.backend.service.PaymentService;
import com.ticketbooking.backend.service.WaitlistService;

@RestController
@RequestMapping("/api/payments")
public class PaymentController {

    private final PaymentService paymentService;
    private final WaitlistService waitlistService;

    public PaymentController(
            PaymentService paymentService,
            WaitlistService waitlistService) {

        this.paymentService = paymentService;
        this.waitlistService = waitlistService;
    }

    // =========================================================
    // ACCEPT WAITLIST OFFER
    // =========================================================

    @PostMapping("/waitlist/{entryId}/accept")
    public ResponseEntity<?> acceptWaitlistOffer(
            @PathVariable Long entryId,
            Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Authentication required"
                    ));
        }

        try {

            Map<String, Object> response =
                    waitlistService.acceptOffer(
                            entryId,
                            authentication.getName()
                    );

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    // =========================================================
    // CREATE PAYMENT ORDER
    // =========================================================

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(
            @RequestBody CreateOrderRequest request,
            Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Authentication required"
                    ));
        }

        try {

            Map<String, Object> response =
                    paymentService.createPaymentOrder(
                            request.eventId(),
                            request.seatIds(),
                            authentication.getName()
                    );

            return ResponseEntity.ok(response);

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    // =========================================================
    // VERIFY PAYMENT
    // =========================================================

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(
            @RequestBody VerifyPaymentRequest request,
            Authentication authentication) {

        if (authentication == null ||
                !authentication.isAuthenticated()) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Authentication required"
                    ));
        }

        try {

            Booking booking =
                    paymentService.verifyPayment(
                            request.razorpayOrderId(),
                            request.razorpayPaymentId(),
                            request.razorpaySignature(),
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Payment successful",

                            "booking",
                            Map.of(
                                    "id",
                                    booking.getId(),

                                    "eventId",
                                    booking.getEvent().getId(),

                                    "eventTitle",
                                    booking.getEvent().getTitle(),

                                    "numberOfSeats",
                                    booking.getNumberOfSeats(),

                                    "totalAmount",
                                    booking.getTotalAmount(),

                                    "status",
                                    booking.getStatus().name()
                            )
                    )
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    // =========================================================
    // REQUEST RECORDS
    // =========================================================

    public record CreateOrderRequest(
            Long eventId,
            List<Long> seatIds
    ) {}

    public record VerifyPaymentRequest(
            String razorpayOrderId,
            String razorpayPaymentId,
            String razorpaySignature
    ) {}
}