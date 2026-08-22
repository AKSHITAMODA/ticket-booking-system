package com.ticketbooking.backend.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ticketbooking.backend.entity.Booking;
import com.ticketbooking.backend.entity.BookingSeat;
import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.Seat;
import com.ticketbooking.backend.entity.User;
import com.ticketbooking.backend.repository.BookingRepository;
import com.ticketbooking.backend.repository.EventRepository;
import com.ticketbooking.backend.repository.SeatRepository;

@Service
public class BookingService {

    private final BookingRepository bookingRepository;
    private final EventRepository eventRepository;
    private final SeatRepository seatRepository;
    private final UserService userService;

    public BookingService(
            BookingRepository bookingRepository,
            EventRepository eventRepository,
            SeatRepository seatRepository,
            UserService userService) {

        this.bookingRepository = bookingRepository;
        this.eventRepository = eventRepository;
        this.seatRepository = seatRepository;
        this.userService = userService;
    }

    // =========================================================
    // CREATE BOOKING
    // =========================================================

    @Transactional
    public Booking createBooking(
            Long eventId,
            List<Long> seatIds,
            String userEmail) {

        // -----------------------------------------------------
        // Validate seat selection
        // -----------------------------------------------------

        if (seatIds == null || seatIds.isEmpty()) {
            throw new RuntimeException(
                    "At least one seat must be selected"
            );
        }

        // Prevent duplicate seat IDs in request
        if (seatIds.size() != seatIds.stream().distinct().count()) {
            throw new RuntimeException(
                    "Duplicate seats are not allowed"
            );
        }

        // -----------------------------------------------------
        // Find user
        // -----------------------------------------------------

        User user =
                userService.findByEmail(userEmail);

        // -----------------------------------------------------
        // Lock event
        // -----------------------------------------------------

        Event event =
                eventRepository.findByIdForUpdate(eventId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event not found"
                                ));

        // -----------------------------------------------------
        // Validate requested number of seats
        // -----------------------------------------------------

        if (seatIds.size() > event.getAvailableSeats()) {
            throw new RuntimeException(
                    "Not enough seats available"
            );
        }

        // -----------------------------------------------------
        // Lock and validate every selected seat
        // -----------------------------------------------------

        List<Seat> selectedSeats = new ArrayList<>();

        for (Long seatId : seatIds) {

            Seat seat =
                    seatRepository.findByIdForUpdate(seatId)
                            .orElseThrow(() ->
                                    new RuntimeException(
                                            "Seat not found: " + seatId
                                    ));

            // Make sure seat belongs to this event
            if (!seat.getEvent().getId()
                    .equals(event.getId())) {

                throw new RuntimeException(
                        "Seat " +
                        seat.getSeatNumber() +
                        " does not belong to this event"
                );
            }

            // Make sure seat is available
            if (seat.getStatus() != Seat.Status.AVAILABLE) {

                throw new RuntimeException(
                        "Seat " +
                        seat.getSeatNumber() +
                        " is already booked"
                );
            }

            selectedSeats.add(seat);
        }

        // -----------------------------------------------------
        // Calculate total amount
        // -----------------------------------------------------

        BigDecimal totalAmount =
                event.getPrice()
                        .multiply(
                                BigDecimal.valueOf(
                                        selectedSeats.size()
                                )
                        );

        // -----------------------------------------------------
        // Mark seats as BOOKED
        // -----------------------------------------------------

        for (Seat seat : selectedSeats) {

            seat.setStatus(
                    Seat.Status.BOOKED
            );

            seatRepository.save(seat);
        }

        // -----------------------------------------------------
        // Update event available seats
        // -----------------------------------------------------

        event.setAvailableSeats(
                event.getAvailableSeats()
                        - selectedSeats.size()
        );

        eventRepository.save(event);

        // -----------------------------------------------------
        // Create booking
        // -----------------------------------------------------

        Booking booking = new Booking();

        booking.setUser(user);
        booking.setEvent(event);

        booking.setNumberOfSeats(
                selectedSeats.size()
        );

        booking.setTotalAmount(totalAmount);

        booking.setStatus(
                Booking.Status.CONFIRMED
        );

        // -----------------------------------------------------
        // Create BookingSeat records
        // -----------------------------------------------------

        for (Seat seat : selectedSeats) {

            BookingSeat bookingSeat =
                    new BookingSeat();

            bookingSeat.setSeat(seat);

            booking.addBookingSeat(
                    bookingSeat
            );
        }

        // -----------------------------------------------------
        // Save booking
        // -----------------------------------------------------

        return bookingRepository.save(booking);
    }

    // =========================================================
    // GET USER BOOKINGS
    // =========================================================

    @Transactional(readOnly = true)
    public List<Booking> getUserBookings(
            String userEmail) {

        User user =
                userService.findByEmail(userEmail);

        return bookingRepository
                .findByUserOrderByCreatedAtDesc(user);
    }

    // =========================================================
    // GET SINGLE BOOKING
    // =========================================================

    @Transactional(readOnly = true)
    public Booking getBookingById(
            Long bookingId,
            String userEmail) {

        Booking booking =
                bookingRepository.findById(bookingId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Booking not found"
                                ));

        User user =
                userService.findByEmail(userEmail);

        // Customer can only view their own booking.
        // ADMIN can view any booking.

        if (user.getRole() != User.Role.ADMIN &&
                !booking.getUser().getId()
                        .equals(user.getId())) {

            throw new RuntimeException(
                    "You do not have permission to view this booking"
            );
        }

        return booking;
    }

    // =========================================================
    // CANCEL BOOKING
    // =========================================================

    @Transactional
    public Booking cancelBooking(
            Long bookingId,
            String userEmail) {

        // -----------------------------------------------------
        // Find booking
        // -----------------------------------------------------

        Booking booking =
                bookingRepository.findById(bookingId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Booking not found"
                                ));

        // -----------------------------------------------------
        // Find user
        // -----------------------------------------------------

        User user =
                userService.findByEmail(userEmail);

        // -----------------------------------------------------
        // Permission check
        // -----------------------------------------------------

        if (user.getRole() != User.Role.ADMIN &&
                !booking.getUser().getId()
                        .equals(user.getId())) {

            throw new RuntimeException(
                    "You do not have permission to cancel this booking"
            );
        }

        // -----------------------------------------------------
        // Check already cancelled
        // -----------------------------------------------------

        if (booking.getStatus() ==
                Booking.Status.CANCELLED) {

            throw new RuntimeException(
                    "Booking is already cancelled"
            );
        }

        // -----------------------------------------------------
        // Lock event
        // -----------------------------------------------------

        Event event =
                eventRepository.findByIdForUpdate(
                        booking.getEvent().getId()
                )
                .orElseThrow(() ->
                        new RuntimeException(
                                "Event not found"
                        ));

        // -----------------------------------------------------
        // Restore individual seats
        // -----------------------------------------------------

        for (BookingSeat bookingSeat :
                booking.getBookingSeats()) {

            Seat seat =
                    seatRepository.findByIdForUpdate(
                            bookingSeat.getSeat().getId()
                    )
                    .orElseThrow(() ->
                            new RuntimeException(
                                    "Seat not found"
                            ));

            seat.setStatus(
                    Seat.Status.AVAILABLE
            );

            seatRepository.save(seat);
        }

        // -----------------------------------------------------
        // Restore event available seats
        // -----------------------------------------------------

        event.setAvailableSeats(
                event.getAvailableSeats()
                        + booking.getNumberOfSeats()
        );

        eventRepository.save(event);

        // -----------------------------------------------------
        // Cancel booking
        // -----------------------------------------------------

        booking.setStatus(
                Booking.Status.CANCELLED
        );

        return bookingRepository.save(booking);
    }

    // =========================================================
    // ORGANISER BOOKINGS
    // =========================================================

    @Transactional(readOnly = true)
    public List<Booking> getEventBookings(
            Long eventId,
            String userEmail) {

        Event event =
                eventRepository.findById(eventId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event not found"
                                ));

        User user =
                userService.findByEmail(userEmail);

        // Only organiser or ADMIN

        if (user.getRole() != User.Role.ADMIN &&
                !event.getOrganiser().getId()
                        .equals(user.getId())) {

            throw new RuntimeException(
                    "You do not have permission to view these bookings"
            );
        }

        return bookingRepository
                .findByEventOrderByCreatedAtDesc(event);
    }
}