package com.ticketbooking.backend.repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.Seat;

import jakarta.persistence.LockModeType;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    // =========================================================
    // GET SEATS
    // =========================================================

    List<Seat> findByEventOrderBySeatNumberAsc(Event event);

    List<Seat> findByEventAndStatusOrderBySeatNumberAsc(
            Event event,
            Seat.Status status
    );

    Optional<Seat> findByEventAndSeatNumber(
            Event event,
            String seatNumber
    );

    // =========================================================
    // LOCK SEAT FOR UPDATE
    // =========================================================

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT s
            FROM Seat s
            WHERE s.id = :id
            """)
    Optional<Seat> findByIdForUpdate(
            @Param("id") Long id
    );

    // =========================================================
    // FIND EXPIRED HOLDS
    // =========================================================

    @Query("""
            SELECT s
            FROM Seat s
            WHERE s.status = com.ticketbooking.backend.entity.Seat$Status.HELD
              AND s.holdExpiresAt <= :now
            """)
    List<Seat> findExpiredHeldSeats(
            @Param("now") LocalDateTime now
    );

    // =========================================================
    // COUNT
    // =========================================================

    long countByEventAndStatus(
            Event event,
            Seat.Status status
    );

    // =========================================================
    // AVAILABLE SEATS
    // =========================================================

    long countByEventAndStatusAndHoldExpiresAtAfter(
            Event event,
            Seat.Status status,
            LocalDateTime now
    );
}
