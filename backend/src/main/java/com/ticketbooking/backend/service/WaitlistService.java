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
         * A user cannot have multiple active waitlist
         * entries for the same event and category.
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

        Integer maxPosition =
                waitlistRepository.findMaxPosition(
                        event,
                        category
                );

        int nextPosition =
                maxPosition == null
                        ? 1
                        : maxPosition + 1;

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
                waitlistRepository.findById(entryId)
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

        entry.setStatus(
                WaitlistEntry.Status.CANCELLED
        );

        entry.setOfferedSeat(null);
        entry.setOfferExpiresAt(null);

        return waitlistRepository.save(entry);
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
         * Only users waiting for the same
         * seat category are eligible.
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
         * Temporarily reserve the seat for
         * the waitlist customer.
         *
         * We use HELD rather than BOOKED because
         * payment has not happened yet.
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

        /*
         * Copy the list so that changes to the
         * persistence context don't interfere
         * with iteration.
         */
        List<WaitlistEntry> entries =
                new ArrayList<>(
                        expiredEntries
                );

        for (WaitlistEntry entry :
                entries) {

            Seat offeredSeat =
                    entry.getOfferedSeat();

            /*
             * Mark the current offer expired.
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

                offeredSeat.setHeldByUserId(
                        null
                );

                offeredSeat.setHoldExpiresAt(
                        null
                );

                seatRepository.save(
                        offeredSeat
                );

                /*
                 * Immediately offer the released seat
                 * to the next customer.
                 */
                offerNextCustomer(
                        entry.getEvent(),
                        offeredSeat
                );
            }
        }
    }

    // =========================================================
    // MARK ENTRY FULFILLED
    // =========================================================

    @Transactional
    public WaitlistEntry markFulfilled(
            Long entryId) {

        WaitlistEntry entry =
                waitlistRepository.findById(
                        entryId
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Waitlist entry not found"
                        ));

        entry.setStatus(
                WaitlistEntry.Status.FULFILLED
        );

        entry.setOfferExpiresAt(
                null
        );

        return waitlistRepository.save(entry);
    }

    // =========================================================
    // ASSIGN CANCELLED SEAT
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
         * Make sure the seat is actually available
         * before looking for a customer.
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
}