package com.ticketbooking.backend.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.ticketbooking.backend.entity.Booking;
import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.User;

public interface BookingRepository
        extends JpaRepository<Booking, Long> {

    List<Booking> findByUserOrderByCreatedAtDesc(User user);

    List<Booking> findByEventOrderByCreatedAtDesc(Event event);

    List<Booking> findByUserAndStatusOrderByCreatedAtDesc(
            User user,
            Booking.Status status
    );

    List<Booking> findByEventAndStatus(
            Event event,
            Booking.Status status
    );
}