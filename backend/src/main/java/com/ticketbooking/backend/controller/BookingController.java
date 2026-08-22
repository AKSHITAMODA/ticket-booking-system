package com.ticketbooking.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ticketbooking.backend.entity.Booking;
import com.ticketbooking.backend.service.BookingService;

@RestController
@RequestMapping("/api/bookings")
public class BookingController {

    private final BookingService bookingService;

    public BookingController(
            BookingService bookingService) {

        this.bookingService = bookingService;
    }

    // ================= CREATE BOOKING =================

    @PostMapping
    public ResponseEntity<?> createBooking(
            @RequestBody BookingRequest request,
            Authentication authentication) {

        if (authentication == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Authentication required"
                    ));
        }

        try {

            Booking booking =
                    bookingService.createBooking(
                            request.eventId(),
                            request.numberOfSeats(),
                            authentication.getName()
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(toResponse(booking));

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    // ================= MY BOOKINGS =================

    @GetMapping("/my")
    public ResponseEntity<?> getMyBookings(
            Authentication authentication) {

        if (authentication == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Authentication required"
                    ));
        }

        try {

            List<Booking> bookings =
                    bookingService.getUserBookings(
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    bookings.stream()
                            .map(this::toResponse)
                            .toList()
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

    // ================= GET SINGLE BOOKING =================

    @GetMapping("/{id}")
    public ResponseEntity<?> getBooking(
            @PathVariable Long id,
            Authentication authentication) {

        if (authentication == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Authentication required"
                    ));
        }

        try {

            Booking booking =
                    bookingService.getBookingById(
                            id,
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    toResponse(booking)
            );

        } catch (RuntimeException e) {

            if (e.getMessage().contains("permission")) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "error",
                                e.getMessage()
                        ));
            }

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    // ================= CANCEL =================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> cancelBooking(
            @PathVariable Long id,
            Authentication authentication) {

        if (authentication == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Authentication required"
                    ));
        }

        try {

            Booking booking =
                    bookingService.cancelBooking(
                            id,
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Booking cancelled successfully",
                            "booking",
                            toResponse(booking)
                    )
            );

        } catch (RuntimeException e) {

            if (e.getMessage().contains("permission")) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "error",
                                e.getMessage()
                        ));
            }

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    // ================= EVENT BOOKINGS =================

    @GetMapping("/event/{eventId}")
    public ResponseEntity<?> getEventBookings(
            @PathVariable Long eventId,
            Authentication authentication) {

        if (authentication == null) {

            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "error",
                            "Authentication required"
                    ));
        }

        try {

            List<Booking> bookings =
                    bookingService.getEventBookings(
                            eventId,
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    bookings.stream()
                            .map(this::toResponse)
                            .toList()
            );

        } catch (RuntimeException e) {

            if (e.getMessage().contains("permission")) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "error",
                                e.getMessage()
                        ));
            }

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    // ================= RESPONSE =================

    private Map<String, Object> toResponse(
            Booking booking) {

        return Map.of(
                "id", booking.getId(),

                "event", Map.of(
                        "id", booking.getEvent().getId(),
                        "title", booking.getEvent().getTitle(),
                        "venue", booking.getEvent().getVenue(),
                        "eventDate", booking.getEvent().getEventDate()
                ),

                "user", Map.of(
                        "id", booking.getUser().getId(),
                        "name", booking.getUser().getName(),
                        "email", booking.getUser().getEmail()
                ),

                "numberOfSeats",
                booking.getNumberOfSeats(),

                "totalAmount",
                booking.getTotalAmount(),

                "status",
                booking.getStatus().name(),

                "createdAt",
                booking.getCreatedAt()
        );
    }

    // ================= REQUEST =================

    public record BookingRequest(
            Long eventId,
            Integer numberOfSeats
    ) {}
}