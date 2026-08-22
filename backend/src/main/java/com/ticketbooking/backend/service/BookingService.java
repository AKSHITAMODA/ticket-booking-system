package com.ticketbooking.backend.service;

import java.math.BigDecimal;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ticketbooking.backend.entity.Booking;
import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.User;
import com.ticketbooking.backend.repository.BookingRepository;
import com.ticketbooking.backend.repository.EventRepository;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final UserService userService;

    public BookingService(
            BookingRepository bookingRepository,
            EventRepository eventRepository,
            UserService userService) {

        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.userService = userService;
    }

    // ================= CREATE BOOKING =================

    @Transactional
    public Booking createBooking(
            Long eventId,
            Integer numberOfSeats,
            String userEmail) {

        if (numberOfSeats == null || numberOfSeats <= 0) {
            throw new RuntimeException(
                    "Number of seats must be greater than 0");
        }

        User user =
                userService.findByEmail(userEmail);

        /*
         * Lock the event row while booking.
         */
        Event event =
                eventRepository.findByIdForUpdate(eventId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event not found"));

        // Check available seats
        if (event.getAvailableSeats() < numberOfSeats) {

            throw new RuntimeException(
                    "Not enough seats available");
        }

        // Calculate total price
        BigDecimal totalAmount =
                event.getPrice()
                        .multiply(
                                BigDecimal.valueOf(numberOfSeats)
                        );

        // Deduct seats
        event.setAvailableSeats(
                event.getAvailableSeats()
                        - numberOfSeats
        );

        eventRepository.save(event);

        // Create booking
        Booking booking = new Booking();

        booking.setUser(user);
        booking.setEvent(event);
        booking.setNumberOfSeats(numberOfSeats);
        booking.setTotalAmount(totalAmount);
        booking.setStatus(
                Booking.Status.CONFIRMED
        );

        return bookingRepository.save(booking);
    }

    // ================= GET USER BOOKINGS =================

    @Transactional(readOnly = true)
    public List<Booking> getUserBookings(
            String userEmail) {

        User user =
                userService.findByEmail(userEmail);

        return bookingRepository
                .findByUserOrderByCreatedAtDesc(user);
    }

    // ================= GET BOOKING =================

    @Transactional(readOnly = true)
    public Booking getBookingById(
            Long bookingId,
            String userEmail) {

        Booking booking =
                bookingRepository.findById(bookingId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Booking not found"));

        User user =
                userService.findByEmail(userEmail);

        /*
         * Customer can only view their own booking.
         * ADMIN can view any booking.
         */
        if (user.getRole() != User.Role.ADMIN &&
                !booking.getUser().getId()
                        .equals(user.getId())) {

            throw new RuntimeException(
                    "You do not have permission to view this booking");
        }

        return booking;
    }

    // ================= CANCEL BOOKING =================

    @Transactional
    public Booking cancelBooking(
            Long bookingId,
            String userEmail) {

        Booking booking =
                bookingRepository.findById(bookingId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Booking not found"));

        User user =
                userService.findByEmail(userEmail);

        // Permission check
        if (user.getRole() != User.Role.ADMIN &&
                !booking.getUser().getId()
                        .equals(user.getId())) {

            throw new RuntimeException(
                    "You do not have permission to cancel this booking");
        }

        // Already cancelled
        if (booking.getStatus() ==
                Booking.Status.CANCELLED) {

            throw new RuntimeException(
                    "Booking is already cancelled");
        }

        /*
         * Lock event before restoring seats.
         */
        Event event =
                eventRepository.findByIdForUpdate(
                        booking.getEvent().getId()
                ).orElseThrow(() ->
                        new RuntimeException(
                                "Event not found"));

        // Restore seats
        event.setAvailableSeats(
                event.getAvailableSeats()
                        + booking.getNumberOfSeats()
        );

        eventRepository.save(event);

        // Cancel booking
        booking.setStatus(
                Booking.Status.CANCELLED
        );

        return bookingRepository.save(booking);
    }

    // ================= ORGANISER BOOKINGS =================

    @Transactional(readOnly = true)
    public List<Booking> getEventBookings(
            Long eventId,
            String userEmail) {

        Event event =
                eventRepository.findById(eventId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event not found"));

        User user =
                userService.findByEmail(userEmail);

        /*
         * Only event organiser or ADMIN
         * can view bookings.
         */
        if (user.getRole() != User.Role.ADMIN &&
                !event.getOrganiser().getId()
                        .equals(user.getId())) {

            throw new RuntimeException(
                    "You do not have permission to view these bookings");
        }

        return bookingRepository
                .findByEventOrderByCreatedAtDesc(event);
    }
}