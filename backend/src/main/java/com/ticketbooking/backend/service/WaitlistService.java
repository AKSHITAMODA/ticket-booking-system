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
         * A user cannot have multiple active
         * waitlist entries for the same event
         * and category.
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

            if (entry.getStatus() ==
                    WaitlistEntry.Status.WAITING ||
                entry.getStatus() ==
                    WaitlistEntry.Status.OFFERED) {

                throw new RuntimeException(
                        "You are already on the waitlist for this category"
                );
            }
        }

        /*
         * Determine the next ACTIVE position.
         *
         * We deliberately do not use MAX(position)
         * because cancelled/expired entries should
         * not permanently consume queue positions.
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

        /*
         * Remember whether this customer currently
         * owns an offered seat.
         */
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
         * release that seat.
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
             * Re-number the remaining waiting
             * customers.
             *
             * Example:
             *
             * Before:
             * #1 CANCELLED
             * #2 WAITING
             * #3 WAITING
             *
             * After:
             * #1 WAITING
             * #2 WAITING
             */
            compactWaitingPositions(
                    event,
                    category
            );

            /*
             * Give the released seat to the new
             * position #1 customer.
             */
            offerNextCustomer(
                    event,
                    offeredSeat
            );

        } else {

            /*
             * Normal WAITING cancellation.
             *
             * Example:
             *
             * #1 WAITING
             * #2 CANCELLED
             * #3 WAITING
             *
             * becomes:
             *
             * #1 WAITING
             * #2 WAITING
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
         * Only customers waiting for the
         * same seat category are eligible.
         */
        WaitlistEntry.Category category =
                WaitlistEntry.Category.valueOf(
                        seat.getCategory().name()
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
         * Make sure positions are compact
         * before selecting the first customer.
         */
        compactWaitingPositions(
                event,
                category
        );

        /*
         * Fetch again after compaction.
         */
        waitingEntries =
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
         * Temporarily reserve the seat.
         *
         * Payment has not happened yet,
         * therefore status = HELD.
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
             * Release the seat only if it is still
             * held by this waitlist customer.
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
                 * Remove the expired customer from
                 * the active queue positions.
                 */
                compactWaitingPositions(
                        event,
                        category
                );

                /*
                 * Immediately offer the released
                 * seat to the next customer.
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
                getEntry(entryId, userEmail);

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
                !entry.getOfferExpiresAt().isAfter(now)) {

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
                        .equals(entry.getUser().getId())) {

            throw new RuntimeException(
                    "The offered seat is held by another user"
            );
        }

        /*
        * Do NOT change the seat to BOOKED here.
        *
        * It stays HELD until Razorpay payment
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
         * Make sure the seat is actually available.
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

        /*
         * If there is currently an OFFERED customer,
         * that customer occupies the next queue slot.
         */
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