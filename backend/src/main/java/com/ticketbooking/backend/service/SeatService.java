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
     * Configurable hold duration.
     *
     * Default = 10 minutes.
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
    // GET SEAT MAP
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

        /*
         * Remove duplicate seat IDs.
         */
        List<Long> uniqueSeatIds =
                new ArrayList<>(
                        seatIds.stream()
                                .distinct()
                                .toList()
                );

        /*
         * Always acquire locks in a predictable order.
         *
         * This reduces the possibility of deadlocks
         * when two users select multiple seats.
         */
        uniqueSeatIds.sort(Long::compareTo);

        List<Seat> lockedSeats =
                new ArrayList<>();

        LocalDateTime now =
                LocalDateTime.now();

        /*
         * Lock every requested seat before
         * checking or changing its status.
         */
        for (Long seatId : uniqueSeatIds) {

            Seat seat =
                    seatRepository
                            .findByIdForUpdate(seatId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Seat not found: "
                                                    + seatId
                                    ));

            /*
             * Make sure the seat belongs to
             * the requested event.
             */
            if (!seat.getEvent()
                    .getId()
                    .equals(event.getId())) {

                throw new RuntimeException(
                        "Seat " + seatId +
                        " does not belong to this event"
                );
            }

            /*
             * If an old hold has expired,
             * release it immediately.
             */
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

            /*
             * Only AVAILABLE seats can be held.
             */
            if (seat.getStatus() !=
                    Seat.Status.AVAILABLE) {

                /*
                 * If the seat is held by the
                 * same user, allow them to keep
                 * using their existing hold.
                 */
                if (seat.getStatus() ==
                        Seat.Status.HELD &&
                        user.getId()
                                .equals(
                                        seat.getHeldByUserId()
                                )) {

                    lockedSeats.add(seat);

                    continue;
                }

                throw new RuntimeException(
                        "Seat " +
                        seat.getSeatNumber() +
                        " is not available"
                );
            }

            lockedSeats.add(seat);
        }

        LocalDateTime expiresAt =
                now.plusMinutes(holdMinutes);

        /*
         * Apply the hold to every seat.
         */
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
