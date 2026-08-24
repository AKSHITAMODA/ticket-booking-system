package com.ticketbooking.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.Seat;
import com.ticketbooking.backend.entity.User;
import com.ticketbooking.backend.repository.EventRepository;
import com.ticketbooking.backend.repository.SeatRepository;

@Service
public class SeatService {

    private final SeatRepository seatRepository;
    private final EventRepository eventRepository;
    private final UserService userService;

    /*
     * Configurable seat-hold duration.
     *
     * application.properties:
     *
     * app.seat.hold-minutes=10
     *
     * If the property is missing, 10 minutes is used.
     */
    @Value("${app.seat.hold-minutes:10}")
    private long holdMinutes;

    public SeatService(
            SeatRepository seatRepository,
            EventRepository eventRepository,
            UserService userService) {

        this.seatRepository = seatRepository;
        this.eventRepository = eventRepository;
        this.userService = userService;
    }

    // =========================================================
    // GET EVENT SEATS
    // =========================================================

    @Transactional(readOnly = true)
    public List<Seat> getEventSeats(Long eventId) {

        Event event =
                eventRepository.findById(eventId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event not found"
                                ));

        return seatRepository
                .findByEventOrderBySeatNumberAsc(event);
    }

    // =========================================================
    // CREATE SEATS
    // =========================================================

    @Transactional
    public List<Seat> generateSeats(
            Long eventId,
            Integer totalSeats) {

        Event event =
                eventRepository.findByIdForUpdate(eventId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event not found"
                                ));

        if (totalSeats == null || totalSeats <= 0) {

            throw new RuntimeException(
                    "Total seats must be greater than 0"
            );
        }

        List<Seat> existingSeats =
                seatRepository
                        .findByEventOrderBySeatNumberAsc(event);

        if (!existingSeats.isEmpty()) {

            throw new RuntimeException(
                    "Seats have already been generated for this event"
            );
        }

        /*
         * First 20% = PREMIUM
         * Remaining 80% = STANDARD
         */
        int premiumSeats =
                Math.max(
                        1,
                        (int) Math.ceil(totalSeats * 0.20)
                );

        for (int i = 1; i <= totalSeats; i++) {

            Seat seat = new Seat();

            seat.setEvent(event);

            seat.setSeatNumber(
                    generateSeatNumber(i)
            );

            seat.setCategory(
                    i <= premiumSeats
                            ? Seat.Category.PREMIUM
                            : Seat.Category.STANDARD
            );

            seat.setStatus(
                    Seat.Status.AVAILABLE
            );

            /*
             * New seats are never held.
             */
            seat.setHeldByUserId(null);
            seat.setHoldExpiresAt(null);

            seatRepository.save(seat);
        }

        return seatRepository
                .findByEventOrderBySeatNumberAsc(event);
    }

    // =========================================================
    // HOLD SEATS
    // =========================================================

    @Transactional
    public List<Seat> holdSeats(
            Long eventId,
            List<Long> seatIds,
            String userEmail) {

        // -----------------------------------------------------
        // Validate request
        // -----------------------------------------------------

        if (seatIds == null || seatIds.isEmpty()) {

            throw new RuntimeException(
                    "At least one seat must be selected"
            );
        }

        User user =
                userService.findByEmail(userEmail);

        Event event =
                eventRepository.findById(eventId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event not found"
                                ));

        // -----------------------------------------------------
        // Remove duplicate seat IDs
        // -----------------------------------------------------

        List<Long> uniqueSeatIds =
                new ArrayList<>(
                        seatIds.stream()
                                .distinct()
                                .toList()
                );

        /*
         * Always acquire locks in the same order.
         *
         * Example:
         *
         * User A -> [1,2]
         * User B -> [2,1]
         *
         * Sorting both requests to [1,2]
         * reduces deadlock risk.
         */
        uniqueSeatIds.sort(Long::compareTo);

        List<Seat> lockedSeats =
                new ArrayList<>();

        LocalDateTime now =
                LocalDateTime.now();

        // -----------------------------------------------------
        // Lock and validate every requested seat
        // -----------------------------------------------------

        for (Long seatId : uniqueSeatIds) {

            Seat seat =
                    seatRepository
                            .findByIdForUpdate(seatId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Seat not found: "
                                                    + seatId
                                    ));

            // -------------------------------------------------
            // Make sure seat belongs to this event
            // -------------------------------------------------

            if (!seat.getEvent()
                    .getId()
                    .equals(event.getId())) {

                throw new RuntimeException(
                        "Seat " +
                        seatId +
                        " does not belong to this event"
                );
            }

            // -------------------------------------------------
            // Release expired hold immediately
            // -------------------------------------------------

            if (seat.getStatus() == Seat.Status.HELD &&
                    seat.getHoldExpiresAt() != null &&
                    !seat.getHoldExpiresAt().isAfter(now)) {

                seat.setStatus(
                        Seat.Status.AVAILABLE
                );

                seat.setHeldByUserId(null);

                seat.setHoldExpiresAt(null);

                seatRepository.save(seat);
            }

            // -------------------------------------------------
            // Seat must be AVAILABLE
            // -------------------------------------------------

            if (seat.getStatus() !=
                    Seat.Status.AVAILABLE) {

                /*
                 * Do NOT allow the same user to repeatedly
                 * re-hold the seat and reset its timer.
                 */
                if (seat.getStatus() ==
                        Seat.Status.HELD &&
                        user.getId()
                                .equals(
                                        seat.getHeldByUserId()
                                )) {

                    throw new RuntimeException(
                            "Seat " +
                            seat.getSeatNumber() +
                            " is already held by you"
                    );
                }

                /*
                 * BOOKED or HELD by another user.
                 */
                throw new RuntimeException(
                        "Seat " +
                        seat.getSeatNumber() +
                        " is not available"
                );
            }

            lockedSeats.add(seat);
        }

        // -----------------------------------------------------
        // Calculate hold expiry
        // -----------------------------------------------------

        LocalDateTime expiresAt =
                now.plusMinutes(holdMinutes);

        // -----------------------------------------------------
        // Apply hold
        // -----------------------------------------------------

        for (Seat seat : lockedSeats) {

            seat.setStatus(
                    Seat.Status.HELD
            );

            seat.setHeldByUserId(
                    user.getId()
            );

            seat.setHoldExpiresAt(
                    expiresAt
            );

            seatRepository.save(seat);
        }

        return lockedSeats;
    }

    // =========================================================
    // RELEASE EXPIRED HOLDS
    // =========================================================

    /*
     * Runs every 30 seconds.
     *
     * This is the background safety mechanism.
     *
     * Expired seats are also checked when somebody attempts
     * to hold them, so we don't depend exclusively on this job.
     */
    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void releaseExpiredHolds() {

        LocalDateTime now =
                LocalDateTime.now();

        List<Seat> expiredSeats =
                seatRepository
                        .findExpiredHeldSeats(now);

        for (Seat seat : expiredSeats) {

            seat.setStatus(
                    Seat.Status.AVAILABLE
            );

            seat.setHeldByUserId(null);

            seat.setHoldExpiresAt(null);

            seatRepository.save(seat);
        }
    }

    // =========================================================
    // SEAT NUMBER
    // =========================================================

    private String generateSeatNumber(
            int number) {

        int rowSize = 10;

        int row =
                (number - 1) / rowSize;

        int position =
                ((number - 1) % rowSize) + 1;

        char rowLetter =
                (char) ('A' + row);

        return rowLetter +
                String.valueOf(position);
    }
}