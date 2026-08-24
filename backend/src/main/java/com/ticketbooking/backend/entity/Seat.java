package com.ticketbooking.backend.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

@Entity
@Table(
    name = "seats",
    uniqueConstraints = {
        @UniqueConstraint(
            columnNames = {"event_id", "seat_number"}
        )
    }
)
public class Seat {

    public enum Status {
        AVAILABLE,
        HELD,
        BOOKED
    }

    public enum Category {
        PREMIUM,
        STANDARD
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "seat_number", nullable = false)
    private String seatNumber;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "event_id", nullable = false)
    private Event event;

    // =========================================================
    // HOLD INFORMATION
    // =========================================================

    @Column(name = "held_by_user_id")
    private Long heldByUserId;

    @Column(name = "hold_expires_at")
    private LocalDateTime holdExpiresAt;

    // =========================================================
    // GETTERS
    // =========================================================

    public Long getId() {
        return id;
    }

    public String getSeatNumber() {
        return seatNumber;
    }

    public Category getCategory() {
        return category;
    }

    public Status getStatus() {
        return status;
    }

    public Event getEvent() {
        return event;
    }

    public Long getHeldByUserId() {
        return heldByUserId;
    }

    public LocalDateTime getHoldExpiresAt() {
        return holdExpiresAt;
    }

    // =========================================================
    // SETTERS
    // =========================================================

    public void setSeatNumber(String seatNumber) {
        this.seatNumber = seatNumber;
    }

    public void setCategory(Category category) {
        this.category = category;
    }

    public void setStatus(Status status) {
        this.status = status;
    }

    public void setEvent(Event event) {
        this.event = event;
    }

    public void setHeldByUserId(Long heldByUserId) {
        this.heldByUserId = heldByUserId;
    }

    public void setHoldExpiresAt(LocalDateTime holdExpiresAt) {
        this.holdExpiresAt = holdExpiresAt;
    }
}
