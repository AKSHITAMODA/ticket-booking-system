package com.ticketbooking.backend.service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.User;
import com.ticketbooking.backend.repository.EventRepository;

@Service
public class EventService {

    private final EventRepository eventRepository;
    private final UserService userService;

    public EventService(
            EventRepository eventRepository,
            UserService userService) {

        this.eventRepository = eventRepository;
        this.userService = userService;
    }

    // ================= GET ALL EVENTS =================

    public List<Event> getAllEvents() {
        return eventRepository.findAllByOrderByEventDateAsc();
    }

    // ================= GET EVENT BY ID =================

    public Event getEventById(Long id) {

        return eventRepository.findById(id)
                .orElseThrow(() ->
                        new RuntimeException("Event not found"));
    }

    // ================= CREATE EVENT =================

    @Transactional
    public Event createEvent(
            String title,
            String description,
            String venue,
            LocalDateTime eventDate,
            Integer totalSeats,
            BigDecimal price,
            String organiserEmail) {

        validateEventData(
                title,
                description,
                venue,
                eventDate,
                totalSeats,
                price
        );

        User organiser =
                userService.findByEmail(organiserEmail);

        if (organiser.getRole() != User.Role.ORGANISER &&
                organiser.getRole() != User.Role.ADMIN) {

            throw new RuntimeException(
                    "Only organisers and admins can create events");
        }

        Event event = new Event();

        event.setTitle(title);
        event.setDescription(description);
        event.setVenue(venue);
        event.setEventDate(eventDate);
        event.setTotalSeats(totalSeats);

        // Initially all seats are available
        event.setAvailableSeats(totalSeats);

        event.setPrice(price);
        event.setOrganiser(organiser);

        return eventRepository.save(event);
    }

    // ================= UPDATE EVENT =================

    @Transactional
    public Event updateEvent(
            Long id,
            String title,
            String description,
            String venue,
            LocalDateTime eventDate,
            Integer totalSeats,
            BigDecimal price,
            String organiserEmail) {

        Event event = getEventById(id);

        User user =
                userService.findByEmail(organiserEmail);

        // Only organiser who created the event
        // or ADMIN can update it.
        if (user.getRole() != User.Role.ADMIN &&
                !event.getOrganiser().getId()
                        .equals(user.getId())) {

            throw new RuntimeException(
                    "You do not have permission to update this event");
        }

        validateEventData(
                title,
                description,
                venue,
                eventDate,
                totalSeats,
                price
        );

        /*
         * Calculate seats already booked.
         *
         * Example:
         * total = 100
         * available = 70
         * booked = 30
         */
        int bookedSeats =
                event.getTotalSeats()
                        - event.getAvailableSeats();

        // New total cannot be smaller than
        // already booked seats.
        if (totalSeats < bookedSeats) {

            throw new RuntimeException(
                    "Total seats cannot be less than already booked seats");
        }

        event.setTitle(title);
        event.setDescription(description);
        event.setVenue(venue);
        event.setEventDate(eventDate);
        event.setTotalSeats(totalSeats);

        // Preserve already booked seats
        event.setAvailableSeats(
                totalSeats - bookedSeats
        );

        event.setPrice(price);

        return eventRepository.save(event);
    }

    // ================= DELETE EVENT =================

    @Transactional
    public void deleteEvent(
            Long id,
            String organiserEmail) {

        Event event = getEventById(id);

        User user =
                userService.findByEmail(organiserEmail);

        // Only owner organiser or ADMIN
        if (user.getRole() != User.Role.ADMIN &&
                !event.getOrganiser().getId()
                        .equals(user.getId())) {

            throw new RuntimeException(
                    "You do not have permission to delete this event");
        }

        eventRepository.delete(event);
    }

    // ================= VALIDATION =================

    private void validateEventData(
            String title,
            String description,
            String venue,
            LocalDateTime eventDate,
            Integer totalSeats,
            BigDecimal price) {

        if (title == null || title.isBlank()) {
            throw new RuntimeException(
                    "Event title is required");
        }

        if (description == null || description.isBlank()) {
            throw new RuntimeException(
                    "Event description is required");
        }

        if (venue == null || venue.isBlank()) {
            throw new RuntimeException(
                    "Event venue is required");
        }

        if (eventDate == null) {
            throw new RuntimeException(
                    "Event date is required");
        }

        if (eventDate.isBefore(LocalDateTime.now())) {
            throw new RuntimeException(
                    "Event date must be in the future");
        }

        if (totalSeats == null || totalSeats <= 0) {
            throw new RuntimeException(
                    "Total seats must be greater than 0");
        }

        if (price == null || price.compareTo(BigDecimal.ZERO) < 0) {
            throw new RuntimeException(
                    "Price cannot be negative");
        }
    }
}