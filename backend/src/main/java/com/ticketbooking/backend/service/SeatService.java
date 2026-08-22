package com.ticketbooking.backend.service;

import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.Seat;
import com.ticketbooking.backend.repository.EventRepository;
import com.ticketbooking.backend.repository.SeatRepository;

@Service
public class SeatService {

    private final SeatRepository seatRepository;
    private final EventRepository eventRepository;

    public SeatService(
            SeatRepository seatRepository,
            EventRepository eventRepository) {

        this.seatRepository = seatRepository;
        this.eventRepository = eventRepository;
    }

    // ================= GET SEAT MAP =================

    @Transactional(readOnly = true)
    public List<Seat> getEventSeats(Long eventId) {

        Event event =
                eventRepository.findById(eventId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event not found"));

        return seatRepository
                .findByEventOrderBySeatNumberAsc(event);
    }

    // ================= CREATE SEATS =================

    @Transactional
    public List<Seat> generateSeats(
            Long eventId,
            Integer totalSeats) {

        Event event =
                eventRepository.findByIdForUpdate(eventId)
                        .orElseThrow(() ->
                                new RuntimeException(
                                        "Event not found"));

        if (totalSeats == null || totalSeats <= 0) {

            throw new RuntimeException(
                    "Total seats must be greater than 0");
        }

        List<Seat> existingSeats =
                seatRepository
                        .findByEventOrderBySeatNumberAsc(event);

        if (!existingSeats.isEmpty()) {

            throw new RuntimeException(
                    "Seats have already been generated for this event");
        }

        /*
         * First 20% = PREMIUM
         * Remaining 80% = STANDARD
         */

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

            seatRepository.save(seat);
        }

        return seatRepository
                .findByEventOrderBySeatNumberAsc(event);
    }

    // ================= SEAT NUMBER =================

    private String generateSeatNumber(int number) {

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