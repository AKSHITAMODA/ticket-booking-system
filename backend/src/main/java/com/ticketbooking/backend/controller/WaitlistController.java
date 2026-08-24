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

import com.ticketbooking.backend.entity.WaitlistEntry;
import com.ticketbooking.backend.service.WaitlistService;

@RestController
@RequestMapping("/api/waitlist")
public class WaitlistController {

    private final WaitlistService waitlistService;

    public WaitlistController(
            WaitlistService waitlistService) {

        this.waitlistService = waitlistService;
    }

    // =========================================================
    // JOIN WAITLIST
    // =========================================================

    @PostMapping("/events/{eventId}")
    public ResponseEntity<?> joinWaitlist(
            @PathVariable Long eventId,
            @RequestBody JoinWaitlistRequest request,
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

            WaitlistEntry entry =
                    waitlistService.joinWaitlist(
                            eventId,
                            request.category(),
                            authentication.getName()
                    );

            return ResponseEntity
                    .status(HttpStatus.CREATED)
                    .body(toResponse(entry));

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
    // MY WAITLIST
    // =========================================================

    @GetMapping("/my")
    public ResponseEntity<?> getMyWaitlist(
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

            List<WaitlistEntry> entries =
                    waitlistService.getUserWaitlist(
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    entries.stream()
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
    // GET SINGLE WAITLIST ENTRY
    // =========================================================

    @GetMapping("/{entryId}")
    public ResponseEntity<?> getEntry(
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

            WaitlistEntry entry =
                    waitlistService.getEntry(
                            entryId,
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    toResponse(entry)
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

            return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body(Map.of(
                            "error",
                            message
                    ));
        }
    }

    // =========================================================
    // CANCEL WAITLIST ENTRY
    // =========================================================

    @DeleteMapping("/{entryId}")
    public ResponseEntity<?> cancelWaitlist(
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

            WaitlistEntry entry =
                    waitlistService.cancelWaitlistEntry(
                            entryId,
                            authentication.getName()
                    );

            return ResponseEntity.ok(
                    Map.of(
                            "message",
                            "Waitlist entry cancelled successfully",

                            "waitlist",
                            toResponse(entry)
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

            return ResponseEntity
                    .status(HttpStatus.BAD_REQUEST)
                    .body(Map.of(
                            "error",
                            message
                    ));
        }
    }

    // =========================================================
    // RESPONSE
    // =========================================================

    private Map<String, Object> toResponse(
            WaitlistEntry entry) {

        Map<String, Object> response =
                new java.util.HashMap<>();

        response.put(
                "id",
                entry.getId()
        );

        response.put(
                "eventId",
                entry.getEvent().getId()
        );

        response.put(
                "eventTitle",
                entry.getEvent().getTitle()
        );

        response.put(
                "userId",
                entry.getUser().getId()
        );

        response.put(
                "category",
                entry.getCategory().name()
        );

        response.put(
                "position",
                entry.getPosition()
        );

        response.put(
                "status",
                entry.getStatus().name()
        );

        response.put(
                "createdAt",
                entry.getCreatedAt()
        );

        response.put(
                "offerExpiresAt",
                entry.getOfferExpiresAt()
        );

        if (entry.getOfferedSeat() != null) {

            response.put(
                    "offeredSeat",
                    Map.of(
                            "id",
                            entry.getOfferedSeat().getId(),

                            "seatNumber",
                            entry.getOfferedSeat()
                                    .getSeatNumber(),

                            "category",
                            entry.getOfferedSeat()
                                    .getCategory()
                                    .name(),

                            "status",
                            entry.getOfferedSeat()
                                    .getStatus()
                                    .name()
                    )
            );

        } else {

            response.put(
                    "offeredSeat",
                    null
            );
        }

        return response;
    }

    // =========================================================
    // REQUEST
    // =========================================================

    public record JoinWaitlistRequest(
            WaitlistEntry.Category category
    ) {}
}