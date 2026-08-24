package com.ticketbooking.backend.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.Seat;
import com.ticketbooking.backend.entity.User;
import com.ticketbooking.backend.entity.WaitlistEntry;
import com.ticketbooking.backend.repository.EventRepository;
import com.ticketbooking.backend.repository.SeatRepository;
import com.ticketbooking.backend.repository.WaitlistRepository;

@Service
public class WaitlistService {

    private final WaitlistRepository waitlistRepository;
    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;
    private final UserService userService;

    /*
     * How long a waitlist customer has to accept
     * an offered seat.
     *
     * Default = 5 minutes.
     */
    @Value("${app.waitlist.offer-minutes:5}")
    private long offerMinutes;

    public WaitlistService(
            WaitlistRepository waitlistRepository,
            EventRepository eventRepository,
            SeatRepository seatRepository,
            UserService userService) {

        this.waitlistRepository = waitlistRepository;
        this.eventRepository = eventRepository;
        this.seatRepository = seatRepository;
        this.userService = userService;
    }

    // =========================================================
    // JOIN WAITLIST
    // =========================================================

    @Transactional
    public WaitlistEntry joinWaitlist(
            Long eventId,
            WaitlistEntry.Category category,
            String userEmail) {

        if (category == null) {

            throw new RuntimeException(
                    "Seat category is required"
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
         * IMPORTANT:
         *
         * Because the database has a UNIQUE constraint on
         *
         * (event_id, user_id, category)
         *
         * we MUST reuse an old entry instead of inserting
         * another row when the customer previously left the
         * waitlist.
         */
        var existing =
                waitlistRepository
                        .findByEventAndUserAndCategory(
                                event,
                                user,
                                category
                        );

        if (existing.isPresent()) {

            WaitlistEntry entry =
                    existing.get();

            /*
             * Already actively waiting.
             */
            if (entry.getStatus() ==
                    WaitlistEntry.Status.WAITING) {

                throw new RuntimeException(
                        "You are already on the waitlist for this category"
                );
            }

            /*
             * Already have an offered seat.
             */
            if (entry.getStatus() ==
                    WaitlistEntry.Status.OFFERED) {

                throw new RuntimeException(
                        "You already have an active seat offer"
                );
            }

            /*
             * FULFILLED entries cannot be rejoined using
             * the same record because the ticket was already
             * successfully booked.
             */
            if (entry.getStatus() ==
                    WaitlistEntry.Status.FULFILLED) {

                throw new RuntimeException(
                        "This waitlist entry has already been fulfilled"
                );
            }

            /*
             * CANCELLED / EXPIRED entries can be reused.
             *
             * This avoids violating the unique database
             * constraint.
             */
            int nextPosition =
                    getNextActivePosition(
                            event,
                            category
                    );

            entry.setPosition(nextPosition);

            entry.setStatus(
                    WaitlistEntry.Status.WAITING
            );

            entry.setOfferedSeat(null);

            entry.setOfferExpiresAt(null);

            return waitlistRepository.save(entry);
        }

        /*
         * No previous entry exists.
         *
         * Create the first record.
         */
        int nextPosition =
                getNextActivePosition(
                        event,
                        category
                );

        WaitlistEntry entry =
                new WaitlistEntry();

        entry.setEvent(event);
        entry.setUser(user);
        entry.setCategory(category);
        entry.setPosition(nextPosition);

        entry.setStatus(
                WaitlistEntry.Status.WAITING
        );

        entry.setOfferedSeat(null);
        entry.setOfferExpiresAt(null);

        return waitlistRepository.save(entry);
    }

    // =========================================================
    // GET USER WAITLIST
    // =========================================================

    @Transactional(readOnly = true)
    public List<WaitlistEntry> getUserWaitlist(
            String userEmail) {

        User user =
                userService.findByEmail(userEmail);

        return waitlistRepository
                .findByUserOrderByCreatedAtDesc(user);
    }

    // =========================================================
    // GET EVENT WAITLIST
    // =========================================================

    @Transactional(readOnly = true)
    public List<WaitlistEntry> getEventWaitlist(
            Long eventId) {

        Event event =
                eventRepository.findById(eventId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event not found"
                                ));

        return waitlistRepository
                .findByEventOrderByPositionAsc(event);
    }

    // =========================================================
    // GET SINGLE ENTRY
    // =========================================================

    @Transactional(readOnly = true)
    public WaitlistEntry getEntry(
            Long entryId,
            String userEmail) {

        User user =
                userService.findByEmail(userEmail);

        WaitlistEntry entry =
                waitlistRepository
                        .findById(entryId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Waitlist entry not found"
                                ));

        if (!entry.getUser()
                .getId()
                .equals(user.getId())) {

            throw new RuntimeException(
                    "You do not have permission to view this waitlist entry"
            );
        }

        return entry;
    }

    // =========================================================
    // CANCEL WAITLIST ENTRY
    // =========================================================

    @Transactional
    public WaitlistEntry cancelWaitlistEntry(
            Long entryId,
            String userEmail) {

        WaitlistEntry entry =
                getEntry(
                        entryId,
                        userEmail
                );

        if (entry.getStatus() ==
                WaitlistEntry.Status.FULFILLED) {

            throw new RuntimeException(
                    "This waitlist entry has already been fulfilled"
            );
        }

        if (entry.getStatus() ==
                WaitlistEntry.Status.CANCELLED) {

            throw new RuntimeException(
                    "Waitlist entry is already cancelled"
            );
        }

        Seat offeredSeat =
                entry.getOfferedSeat();

        Event event =
                entry.getEvent();

        WaitlistEntry.Category category =
                entry.getCategory();

        /*
         * Cancel the waitlist entry first.
         */
        entry.setStatus(
                WaitlistEntry.Status.CANCELLED
        );

        entry.setOfferedSeat(null);
        entry.setOfferExpiresAt(null);

        waitlistRepository.save(entry);

        /*
         * If this customer had an OFFERED seat,
         * release it.
         */
        if (offeredSeat != null &&
                offeredSeat.getStatus() ==
                        Seat.Status.HELD &&
                entry.getUser()
                        .getId()
                        .equals(
                                offeredSeat
                                        .getHeldByUserId()
                        )) {

            offeredSeat.setStatus(
                    Seat.Status.AVAILABLE
            );

            offeredSeat.setHeldByUserId(null);

            offeredSeat.setHoldExpiresAt(null);

            seatRepository.save(offeredSeat);

            /*
             * Re-number remaining waiting customers.
             */
            compactWaitingPositions(
                    event,
                    category
            );

            /*
             * Give released seat to next customer.
             */
            offerNextCustomer(
                    event,
                    offeredSeat
            );

        } else {

            /*
             * Normal WAITING cancellation.
             */
            compactWaitingPositions(
                    event,
                    category
            );
        }

        return entry;
    }

    // =========================================================
    // OFFER NEXT CUSTOMER
    // =========================================================

    @Transactional
    public WaitlistEntry offerNextCustomer(
            Event event,
            Seat seat) {

        if (seat == null) {
            return null;
        }

        /*
         * Only AVAILABLE seats can be offered.
         */
        if (seat.getStatus() !=
                Seat.Status.AVAILABLE) {

            return null;
        }

        /*
         * Only customers waiting for the same
         * category are eligible.
         */
        WaitlistEntry.Category category =
                WaitlistEntry.Category.valueOf(
                        seat.getCategory().name()
                );

        /*
         * Compact first.
         */
        compactWaitingPositions(
                event,
                category
        );

        List<WaitlistEntry> waitingEntries =
                waitlistRepository
                        .findWaitingEntriesForUpdate(
                                event,
                                category
                        );

        if (waitingEntries.isEmpty()) {
            return null;
        }

        /*
         * First waiting customer gets the offer.
         */
        WaitlistEntry entry =
                waitingEntries.get(0);

        LocalDateTime now =
                LocalDateTime.now();

        LocalDateTime expiresAt =
                now.plusMinutes(
                        offerMinutes
                );

        /*
         * Temporarily reserve seat.
         *
         * Payment has NOT happened yet.
         */
        seat.setStatus(
                Seat.Status.HELD
        );

        seat.setHeldByUserId(
                entry.getUser().getId()
        );

        seat.setHoldExpiresAt(
                expiresAt
        );

        seatRepository.save(seat);

        /*
         * Mark waitlist entry as OFFERED.
         */
        entry.setStatus(
                WaitlistEntry.Status.OFFERED
        );

        entry.setOfferedSeat(
                seat
        );

        entry.setOfferExpiresAt(
                expiresAt
        );

        return waitlistRepository.save(entry);
    }

    // =========================================================
    // HANDLE EXPIRED OFFERS
    // =========================================================

    @Scheduled(fixedDelay = 30000)
    @Transactional
    public void releaseExpiredOffers() {

        LocalDateTime now =
                LocalDateTime.now();

        List<WaitlistEntry> expiredEntries =
                waitlistRepository
                        .findExpiredOffers(now);

        List<WaitlistEntry> entries =
                new ArrayList<>(
                        expiredEntries
                );

        for (WaitlistEntry entry :
                entries) {

            Seat offeredSeat =
                    entry.getOfferedSeat();

            Event event =
                    entry.getEvent();

            WaitlistEntry.Category category =
                    entry.getCategory();

            /*
             * Mark current offer expired.
             */
            entry.setStatus(
                    WaitlistEntry.Status.EXPIRED
            );

            entry.setOfferedSeat(null);
            entry.setOfferExpiresAt(null);

            waitlistRepository.save(entry);

            /*
             * Release seat if still held by
             * this waitlist customer.
             */
            if (offeredSeat != null &&
                    offeredSeat.getStatus() ==
                            Seat.Status.HELD &&
                    entry.getUser()
                            .getId()
                            .equals(
                                    offeredSeat
                                            .getHeldByUserId()
                            )) {

                offeredSeat.setStatus(
                        Seat.Status.AVAILABLE
                );

                offeredSeat.setHeldByUserId(null);

                offeredSeat.setHoldExpiresAt(null);

                seatRepository.save(
                        offeredSeat
                );

                /*
                 * Re-number waiting customers.
                 */
                compactWaitingPositions(
                        event,
                        category
                );

                /*
                 * Immediately offer released seat
                 * to next customer.
                 */
                offerNextCustomer(
                        event,
                        offeredSeat
                );
            }
        }
    }

    // =========================================================
    // ACCEPT OFFER
    // =========================================================

    @Transactional
    public Map<String, Object> acceptOffer(
            Long entryId,
            String userEmail) {

        WaitlistEntry entry =
                getEntry(
                        entryId,
                        userEmail
                );

        if (entry.getStatus() !=
                WaitlistEntry.Status.OFFERED) {

            throw new RuntimeException(
                    "This waitlist entry does not have an active seat offer"
            );
        }

        if (entry.getOfferedSeat() == null) {

            throw new RuntimeException(
                    "No seat has been offered"
            );
        }

        LocalDateTime now =
                LocalDateTime.now();

        if (entry.getOfferExpiresAt() == null ||
                !entry.getOfferExpiresAt()
                        .isAfter(now)) {

            throw new RuntimeException(
                    "This seat offer has expired"
            );
        }

        Seat seat =
                entry.getOfferedSeat();

        if (seat.getStatus() !=
                Seat.Status.HELD) {

            throw new RuntimeException(
                    "The offered seat is no longer available"
            );
        }

        if (seat.getHeldByUserId() == null ||
                !seat.getHeldByUserId()
                        .equals(
                                entry.getUser().getId()
                        )) {

            throw new RuntimeException(
                    "The offered seat is held by another user"
            );
        }

        /*
         * IMPORTANT:
         *
         * Do NOT change the seat to BOOKED here.
         *
         * It remains HELD until Razorpay payment
         * is successfully verified.
         */

        Map<String, Object> response =
                new java.util.HashMap<>();

        response.put(
                "entryId",
                entry.getId()
        );

        response.put(
                "eventId",
                entry.getEvent().getId()
        );

        response.put(
                "seatId",
                seat.getId()
        );

        response.put(
                "seatNumber",
                seat.getSeatNumber()
        );

        response.put(
                "amount",
                entry.getEvent().getPrice()
        );

        response.put(
                "status",
                entry.getStatus().name()
        );

        response.put(
                "message",
                "Offer accepted. Proceed to payment."
        );

        return response;
    }

    // =========================================================
    // MARK ENTRY FULFILLED
    // =========================================================

    @Transactional
    public WaitlistEntry markFulfilled(
            Long entryId) {

        WaitlistEntry entry =
                waitlistRepository
                        .findById(entryId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Waitlist entry not found"
                                ));

        entry.setStatus(
                WaitlistEntry.Status.FULFILLED
        );

        entry.setOfferExpiresAt(null);

        return waitlistRepository.save(entry);
    }

    // =========================================================
    // ASSIGN AVAILABLE SEAT
    // =========================================================

    @Transactional
    public WaitlistEntry handleAvailableSeat(
            Seat seat) {

        if (seat == null) {
            return null;
        }

        Event event =
                seat.getEvent();

        /*
         * Make sure seat is available.
         */
        if (seat.getStatus() !=
                Seat.Status.AVAILABLE) {

            return null;
        }

        return offerNextCustomer(
                event,
                seat
        );
    }

    // =========================================================
    // COMPACT WAITING POSITIONS
    // =========================================================

    private void compactWaitingPositions(
            Event event,
            WaitlistEntry.Category category) {

        List<WaitlistEntry> waitingEntries =
                waitlistRepository
                        .findByEventAndCategoryAndStatusOrderByPositionAsc(
                                event,
                                category,
                                WaitlistEntry.Status.WAITING
                        );

        int position = 1;

        for (WaitlistEntry entry :
                waitingEntries) {

            entry.setPosition(position);

            waitlistRepository.save(entry);

            position++;
        }
    }

    // =========================================================
    // NEXT ACTIVE POSITION
    // =========================================================

    private int getNextActivePosition(
            Event event,
            WaitlistEntry.Category category) {

        List<WaitlistEntry> waitingEntries =
                waitlistRepository
                        .findByEventAndCategoryAndStatusOrderByPositionAsc(
                                event,
                                category,
                                WaitlistEntry.Status.WAITING
                        );

        List<WaitlistEntry> offeredEntries =
                waitlistRepository
                        .findByEventAndCategoryAndStatusOrderByPositionAsc(
                                event,
                                category,
                                WaitlistEntry.Status.OFFERED
                        );

        int activeCount =
                waitingEntries.size()
                + offeredEntries.size();

        return activeCount + 1;
    }
}