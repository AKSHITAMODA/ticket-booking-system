package com.ticketbooking.backend.controller;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.User;
import com.ticketbooking.backend.service.EventService;
import com.ticketbooking.backend.service.UserService;

@RestController
@RequestMapping("/api/events")
public class EventController {

    private final EventService eventService;
    private final UserService userService;

    public EventController(
            EventService eventService,
            UserService userService) {

        this.eventService = eventService;
        this.userService = userService;
    }

    // ================= GET ALL =================

    @GetMapping
    public ResponseEntity<?> getAllEvents() {

        List<Event> events =
                eventService.getAllEvents();

        return ResponseEntity.ok(
                events.stream()
                        .map(this::toResponse)
                        .toList()
        );
    }

    // ================= GET BY ID =================

    @GetMapping("/{id}")
    public ResponseEntity<?> getEvent(
            @PathVariable Long id) {

        try {

            Event event =
                    eventService.getEventById(id);

            return ResponseEntity.ok(
                    toResponse(event)
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

    // ================= CREATE =================

    @PostMapping
    public ResponseEntity<?> createEvent(
            @RequestBody EventRequest request,
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

            if (user.getRole() != User.Role.ORGANISER &&
                    user.getRole() != User.Role.ADMIN) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "error",
                                "Only organisers and admins can create events"
                        ));
            }

            Event event =
                    eventService.createEvent(
                            request.title(),
                            request.description(),
                            request.venue(),
                            request.eventDate(),
                            request.totalSeats(),
                            request.price(),
                            authentication.getName()
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(toResponse(event));

        } catch (RuntimeException e) {

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error",
                            e.getMessage()
                    ));
        }
    }

    // ================= UPDATE =================

    @PutMapping("/{id}")
    public ResponseEntity<?> updateEvent(
            @PathVariable Long id,
            @RequestBody EventRequest request,
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

            Event event =
                    eventService.updateEvent(
                            id,
                            request.title(),
                            request.description(),
                            request.venue(),
                            request.eventDate(),
                            request.totalSeats(),
                            request.price(),
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    toResponse(event)
            );

        } catch (RuntimeException e) {

            String message = e.getMessage();

            if ("Event not found".equals(message)) {

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "error",
                                message
                        ));
            }

            if (message != null &&
                    message.contains("permission")) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "error",
                                message
                        ));
            }

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error",
                            message
                    ));
        }
    }

    // ================= DELETE =================

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteEvent(
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

            eventService.deleteEvent(
                    id,
                    authentication.getName()
            );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Event deleted successfully"
                    )
            );

        } catch (RuntimeException e) {

            String message = e.getMessage();

            if (message != null &&
                    message.contains("permission")) {

                return ResponseEntity
                        .status(HttpStatus.FORBIDDEN)
                        .body(Map.of(
                                "error",
                                message
                        ));
            }

            if ("Event not found".equals(message)) {

                return ResponseEntity
                        .status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "error",
                                message
                        ));
            }

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error",
                            message
                    ));
        }
    }

    // ================= RESPONSE =================

    private Map<String, Object> toResponse(Event event) {

        return Map.of(
                "id", event.getId(),
                "title", event.getTitle(),
                "description", event.getDescription(),
                "venue", event.getVenue(),
                "eventDate", event.getEventDate(),
                "totalSeats", event.getTotalSeats(),
                "availableSeats", event.getAvailableSeats(),
                "price", event.getPrice(),
                "organiser", Map.of(
                        "id", event.getOrganiser().getId(),
                        "name", event.getOrganiser().getName(),
                        "email", event.getOrganiser().getEmail()
                )
        );
    }

    // ================= REQUEST =================

    public record EventRequest(
            String title,
            String description,
            String venue,
            LocalDateTime eventDate,
            Integer totalSeats,
            BigDecimal price
    ) {}
}