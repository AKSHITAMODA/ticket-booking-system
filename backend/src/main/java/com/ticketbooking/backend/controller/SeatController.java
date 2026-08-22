package com.ticketbooking.backend.controller;

import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.Seat;
import com.ticketbooking.backend.entity.User;
import com.ticketbooking.backend.repository.EventRepository;
import com.ticketbooking.backend.service.SeatService;
import com.ticketbooking.backend.service.UserService;

@RestController
@RequestMapping("/api/events")
public class SeatController {

    private final SeatService seatService;
    private final UserService userService;
    private final EventRepository eventRepository;

    public SeatController(
            SeatService seatService,
            UserService userService,
            EventRepository eventRepository) {

        this.seatService = seatService;
        this.userService = userService;
        this.eventRepository = eventRepository;
    }

    // =========================================================
    // GET EVENT SEATS
    // =========================================================

    @GetMapping("/{eventId}/seats")
    public ResponseEntity<?> getSeats(
            @PathVariable Long eventId) {

        try {

            List<Seat> seats =
                    seatService.getEventSeats(eventId);

            return ResponseEntity.ok(
                    seats.stream()
                            .map(this::toResponse)
                            .toList()
            );

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    // =========================================================
    // GENERATE SEATS
    // =========================================================

    @PostMapping("/{eventId}/seats/generate")
    public ResponseEntity<?> generateSeats(
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

            User user =
                    userService.findByEmail(
                            authentication.getName()
                    );

            // -------------------------------------------------
            // Only ADMIN or ORGANISER can generate seats
            // -------------------------------------------------

            if (user.getRole() != User.Role.ADMIN &&
                    user.getRole() != User.Role.ORGANISER) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "error",
                                "Only organisers and admins can generate seats"
                        ));
            }

            // -------------------------------------------------
            // Find event
            // -------------------------------------------------

            Event event =
                    eventRepository.findById(eventId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Event not found"
                                    ));

            // -------------------------------------------------
            // Only event organiser or ADMIN
            // -------------------------------------------------

            if (user.getRole() != User.Role.ADMIN &&
                    !event.getOrganiser()
                            .getId()
                            .equals(user.getId())) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "error",
                                "You do not have permission to generate seats for this event"
                        ));
            }

            // -------------------------------------------------
            // Generate seats
            // -------------------------------------------------

            List<Seat> seats =
                    seatService.generateSeats(
                            eventId,
                            event.getTotalSeats()
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(
                            seats.stream()
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

    // =========================================================
    // RESPONSE
    // =========================================================

    private Map<String, Object> toResponse(
            Seat seat) {

        return Map.of(
                "id",
                seat.getId(),

                "seatNumber",
                seat.getSeatNumber(),

                "category",
                seat.getCategory().name(),

                "status",
                seat.getStatus().name()
        );
    }
}