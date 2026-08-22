package com.ticketbooking.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.Seat;

import jakarta.persistence.LockModeType;

public interface SeatRepository extends JpaRepository<Seat, Long> {

    List<Seat> findByEventOrderBySeatNumberAsc(Event event);

    List<Seat> findByEventAndStatusOrderBySeatNumberAsc(
            Event event,
            Seat.Status status
    );

    Optional<Seat> findByEventAndSeatNumber(
            Event event,
            String seatNumber
    );

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
            SELECT s
            FROM Seat s
            WHERE s.id = :id
            """)
    Optional<Seat> findByIdForUpdate(
            @Param("id") Long id
    );

    long countByEventAndStatus(
            Event event,
            Seat.Status status
    );
}