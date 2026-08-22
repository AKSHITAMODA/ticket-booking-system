package com.ticketbooking.backend.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

import com.ticketbooking.backend.entity.Event;
import com.ticketbooking.backend.entity.User;

import jakarta.persistence.LockModeType;

public interface EventRepository extends JpaRepository<Event, Long> {

    List<Event> findAllByOrderByEventDateAsc();

    List<Event> findByOrganiserOrderByEventDateAsc(User organiser);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT e FROM Event e WHERE e.id = :id")
    Optional<Event> findByIdForUpdate(Long id);
}