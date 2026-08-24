package com.ticketbooking.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.Seat;
import com.ticketbooking.backend.entity.User;
import com.ticketbooking.backend.entity.WaitlistEntry;

import jakarta.persistence.LockModeType;

public interface WaitlistRepository
        extends JpaRepository<WaitlistEntry, Long> {

    // =========================================================
    // CHECK EXISTING ENTRY
    // =========================================================

    Optional<WaitlistEntry> findByEventAndUserAndCategory(
            Event event,
            User user,
            WaitlistEntry.Category category
    );

    // =========================================================
    // GET WAITLIST FOR EVENT + CATEGORY
    // =========================================================

    List<WaitlistEntry>
    findByEventAndCategoryAndStatusOrderByPositionAsc(
            Event event,
            WaitlistEntry.Category category,
            WaitlistEntry.Status status
    );

    // =========================================================
    // GET NEXT WAITING CUSTOMER
    // =========================================================

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT w
            FROM WaitlistEntry w
            WHERE w.event = :event
              AND w.category = :category
              AND w.status =
                  com.ticketbooking.backend.entity.WaitlistEntry$Status.WAITING
            ORDER BY w.position ASC
            """)
    List<WaitlistEntry> findWaitingEntriesForUpdate(
            @Param("event") Event event,
            @Param("category") WaitlistEntry.Category category
    );

    // =========================================================
    // FIND OFFERED ENTRIES WHOSE OFFER EXPIRED
    // =========================================================

    @Query("""
            SELECT w
            FROM WaitlistEntry w
            WHERE w.status =
                  com.ticketbooking.backend.entity.WaitlistEntry$Status.OFFERED
              AND w.offerExpiresAt <= :now
            """)
    List<WaitlistEntry> findExpiredOffers(
            @Param("now") LocalDateTime now
    );

    // =========================================================
    // FIND USER WAITLIST ENTRIES
    // =========================================================

    List<WaitlistEntry>
    findByUserOrderByCreatedAtDesc(
            User user
    );

    // =========================================================
    // FIND EVENT WAITLIST
    // =========================================================

    List<WaitlistEntry>
    findByEventOrderByPositionAsc(
            Event event
    );

    // =========================================================
    // FIND OFFERED ENTRY FOR USER
    // =========================================================

    List<WaitlistEntry>
    findByEventAndUserAndStatus(
            Event event,
            User user,
            WaitlistEntry.Status status
    );

    // =========================================================
    // FIND WAITLIST ENTRY BY OFFERED SEAT
    // =========================================================

    Optional<WaitlistEntry>
    findByOfferedSeatAndStatus(
            Seat offeredSeat,
            WaitlistEntry.Status status
    );
    // =========================================================
    // NEXT POSITION
    // =========================================================

    @Query("""
            SELECT COALESCE(MAX(w.position), 0)
            FROM WaitlistEntry w
            WHERE w.event = :event
              AND w.category = :category
            """)
    Integer findMaxPosition(
            @Param("event") Event event,
            @Param("category") WaitlistEntry.Category category
    );

    // =========================================================
    // COUNT ACTIVE WAITING ENTRIES
    // =========================================================

    long countByEventAndCategoryAndStatus(
            Event event,
            WaitlistEntry.Category category,
            WaitlistEntry.Status status
    );
}